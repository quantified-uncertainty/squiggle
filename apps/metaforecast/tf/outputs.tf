output "vercel_project_id" {
  value = vercel_project.main.id
}

output "db_url" {
  value     = local.generated_env.DIGITALOCEAN_POSTGRES
  sensitive = true
}
