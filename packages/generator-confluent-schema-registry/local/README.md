### Running the generator or schema registry locally

1. Clone the repo
1. Run docker compose up -d with the file `docker-compose.yml` in this directory
1. Run the scripts `npx ts-node local/generate-test-data.ts`

This will create new topics in your schema registry, then go to localhost:8081 and see your new topics.

To see all subjects in your schema registry, go to localhost:8081/subjects

To see all schemas in your EventCatalog, go to localhost:3000/catalog/schemas
