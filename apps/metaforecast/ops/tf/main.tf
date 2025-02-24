terraform {
  required_providers {
    vercel       = { source = "vercel/vercel" }
    digitalocean = { source = "digitalocean/digitalocean" }
    heroku       = { source = "heroku/heroku" }
  }
}

resource "digitalocean_database_cluster" "main" {
  name             = "postgres-green"
  engine           = "pg"
  size             = "db-s-1vcpu-2gb"
  region           = "nyc1"
  node_count       = 1
  version          = 14
  storage_size_mib = 50 * 1024
}

locals {
  generated_env = merge(var.metaforecast_env, {
    # should we bring proper DO certificates to prod instead?
    METAFORECAST_DB_URL = replace(digitalocean_database_cluster.main.uri, "/\\?sslmode=require$/", "")
  })
}

resource "digitalocean_project_resources" "main" {
  project = var.digitalocean_project_id
  resources = [
    digitalocean_database_cluster.main.urn
  ]
}

resource "vercel_project" "main" {
  name           = "metaforecast"
  root_directory = "apps/metaforecast"

  git_repository = {
    repo              = "quantified-uncertainty/squiggle"
    type              = "github"
    production_branch = "main"
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
