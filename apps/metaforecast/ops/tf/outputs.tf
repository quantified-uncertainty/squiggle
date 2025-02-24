output "vercel_project_id" {
  value = vercel_project.main.id
}

output "db_url" {
  value     = local.generated_env.METAFORECAST_DB_URL
  sensitive = true
}
