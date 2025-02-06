---
id: UpdateOrderStatus
name: Update Order Status
version: 1.0.0
owners:
  - order-management-team
---

The `UpdateOrderStatus` command updates the status of an order (e.g., Processing, Shipped, Delivered). This is typically triggered by `Warehouse-Service` or `Delivery-Service`.

<NodeGraph />

### Key Features

- **Status Management**: Keeps order tracking up to date  
- **Customer Notifications**: Triggers emails or SMS alerts via `Notification-Service`  
- **Delivery Integration**: Updates status based on shipment progress  

