# Terraform

Infra is managed by [Terraform](https://www.terraform.io/) (WIP, not everything is migrated yet).

Managed with Terraform:

- Vercel
- Digital Ocean (database)
- Heroku

TODO:

- Elasticsearch
- Twitter bot
- DNS?

## Recipes

### Set up a new dev repo for managing prod

1. Install [Terraform CLI](https://www.terraform.io/downloads)
2. `cd tf`
3. `terraform init`
4. Get a current version of prod tfvars configuration
   - Source is in `metaforecast-notes-and-secrets` secret repo, `tf/prod.auto.tfvars` for now (will move to Terraform Cloud later)
   - Store it in `tf/prod.auto.tfvars` (or somewhere else, there are [other ways](https://www.terraform.io/language/values/variables#assigning-values-to-root-module-variables))
5. Get a current version of terraform state
   - Source is in `metaforecast-notes-and-secrets` secret repo for now (will move to Terraform Cloud or [pg backend](https://www.terraform.io/language/settings/backends/pg) later)
   - Store it in `tf/terraform.tfstate`

Now everything is set up.

Check with `terraform plan`; it should output `"No changes. Your infrastructure matches the configuration."`.

### Edit environment variables in prod

1. Update terraform state and vars from `metaforecast-notes-and-secrets`
2. Modify `tf/prod.auto.tfvars` as needed
3. Run `terraform apply`
   - Check if proposed actions list is appropriate
   - Enter `yes`
   - Terraform will push the new configuration to Heroku and Vercel.
4. Push terraform state and vars back to `metaforecast-notes-and-secrets`

(After we move to Terraform Cloud (1) and (4) won't be needed.)
