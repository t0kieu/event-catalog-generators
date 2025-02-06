---
id: OrderDelivered
name: Order Delivered
version: 1.0.0
owners:
  - order-management-team
---

The `OrderDelivered` event is emitted when an order has been successfully delivered to the customer.

<NodeGraph />

### Key Features

- **Triggers Loyalty Rewards**: Notifies `Loyalty-Service` to grant reward points  
- **Customer Satisfaction**: Can trigger surveys via `Marketing-Service`  
- **Finalizes Order**: Marks order as complete in `Order-Service`  

