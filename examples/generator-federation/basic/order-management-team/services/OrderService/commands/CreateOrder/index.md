---
id: CreateOrder
name: Create Order
version: 1.0.0
owners:
  - order-management-team
schemaPath: ./schema.json
---

The `CreateOrder` command is used to create a new order based on a user's cart. It validates the order, calculates totals, and reserves stock.

<NodeGraph />

<SchemaViewer file="schema.json" title="Schema" maxHeight="500px" />

### Example Usage

Copy the following command and paste it into your terminal to create an order.

```bash frame="none"
curl -X POST https://api.metaretail.com/v1/orders/create \
  -H "Content-Type: application/json" \
  -d '{"orderId": "1234567890", "customerId": "1234567890", "items": [{"productId": "1234567890", "quantity": 1}]}'
```

### Key Features

- **Order Creation**: Converts a cart into an order  
- **Stock Reservation**: Ensures items are available before confirming  
- **Payment Handling**: Connects with `Payment-Service` for processing  

