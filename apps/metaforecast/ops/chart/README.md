# Helm chart for Metaforecast

## Notes

The `image.tag` is updated automatically by the CI GitHub Action on each commit.

The secret with the name matching the `envSecret` value, containing environment variables, should be created in the target Kubernetes cluster. See `env.example` at the root of the repository for the required variables.

Elasticsearch is not deployed by default; you need to set up your own instance and provide its credentials in the secret. If you want to self-host Elastic in Kubernetes, you'll need to set up [ECK](https://www.elastic.co/guide/en/cloud-on-k8s/current/k8s-quickstart.html) (that's what we do at QURI) or some other configuration.
