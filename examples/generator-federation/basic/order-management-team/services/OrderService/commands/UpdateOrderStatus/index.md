---
id: UpdateOrderStatus
name: Update Order Status
version: 1.0.0
owners:
  - order-management-team
schemaPath: ./schema.json
---

The `UpdateOrderStatus` command updates the status of an order (e.g., Processing, Shipped, Delivered). This is typically triggered by `Warehouse-Service` or `Delivery-Service`.

<NodeGraph />

<SchemaViewer file="schema.json" title="Schema" maxHeight="500px" />

### Example Usage

Copy the following command and paste it into your terminal to update an order status.

```bash frame="none"
curl -X POST https://api.metaretail.com/v1/orders/update-status \
  -H "Content-Type: application/json" \
  -d '{"orderId": "1234567890", "status": "SHIPPED"}'
```

### Key Features

- **Status Management**: Keeps order tracking up to date  
- **Customer Notifications**: Triggers emails or SMS alerts via `Notification-Service`  
- **Delivery Integration**: Updates status based on shipment progress  

