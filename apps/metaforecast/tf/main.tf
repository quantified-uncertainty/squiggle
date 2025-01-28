terraform {
  required_providers {
    vercel       = { source = "vercel/vercel" }
    digitalocean = { source = "digitalocean/digitalocean" }
    heroku       = { source = "heroku/heroku" }
  }
}

resource "digitalocean_database_cluster" "main" {
  name       = "postgres-green"
  engine     = "pg"
  size       = "db-s-1vcpu-1gb"
  region     = "nyc1"
  node_count = 1
  version    = 14
}

locals {
  generated_env = merge(var.metaforecast_env, {
    # should we bring proper DO certificates to prod instead?
    DIGITALOCEAN_POSTGRES = replace(digitalocean_database_cluster.main.uri, "/\\?sslmode=require$/", "")
  })
}

resource "digitalocean_project_resources" "main" {
  project = var.digitalocean_project_id
  resources = [
    digitalocean_database_cluster.main.urn
  ]
}

resource "heroku_app" "backend" {
  name   = "metaforecast-backend"
  region = "us"

  config_vars = local.generated_env

  organization {
    name = "quantified-uncertainty-researc"
  }
}

resource "vercel_project" "main" {
  name      = "metaforecast"
  framework = "nextjs"

  git_repository = {
    repo              = "quantified-uncertainty/metaforecast"
    type              = "github"
    production_branch = "master"
  }

  environment = concat([
    for key, value in local.generated_env : {
      key    = key
      value  = value
      target = ["preview", "production"]
    }
  ])

  vercel_authentication = {
    deployment_type = "only_preview_deployments"
  }

  serverless_function_region = "iad1"
}
