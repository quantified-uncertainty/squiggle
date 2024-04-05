import { Client as ElasticClient } from "@elastic/elasticsearch";

export const client = new ElasticClient({
  node: "https://localhost:9200",
  auth: {
    username: "elastic",
    password: "PASSWORD_HERE",
  },
  tls: {
    rejectUnauthorized: false,
  },
});
