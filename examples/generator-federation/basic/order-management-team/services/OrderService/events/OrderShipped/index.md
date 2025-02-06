---
id: OrderShipped
name: Order Shipped
version: 1.0.0
owners:
  - order-management-team
---

The `OrderShipped` event is emitted when an order has been shipped. This is usually triggered by `Warehouse-Service` after packaging.

<NodeGraph />

### Key Features

- **Customer Notification**: Notifies the user via `Notification-Service`  
- **Tracking Integration**: Updates shipment tracking details  
- **Delivery Coordination**: Informs `Delivery-Service` about the shipment  

