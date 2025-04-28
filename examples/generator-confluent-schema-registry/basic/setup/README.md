### Running the generator or schema registry locally

1. Clone the repo
1. Run confluent schema registry locally

```
cd setup
docker compose up -d
```

_Wait for the schema registry to be ready, visit localhost:8081 should return an empty json object (array)_

1. Set the compatibility to none (so we can insert test data with versions)

```
curl -X PUT http://localhost:8081/config \
  -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  -d '{"compatibility": "NONE"}'
```

1. Generate the test data

```
npx ts-node setup/generate-test-data.ts
```

Go to `http://localhost:8081/subjects` and see your new topics, you should see something like this:

```
[
"analytics-event-click-value",
"analytics-event-convert-value",
"analytics-event-view-value",
"customer-deleted-value",
"inventory-updated-value",
"order-created-value",
"payment-received-value",
"shipment-created-value",
"user-registered-value"
]
```

To see all subjects in your schema registry, go to localhost:8081/subjects
