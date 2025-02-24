variable "metaforecast_env" {
  type = map(string)
}

variable "digitalocean_project_id" {
  type        = string
  description = "DigitalOcean resources will be assigned to this project"
}
