---
id: OrderCreated
name: Order Created
version: 1.0.0
owners:
  - order-management-team
---

The `OrderCreated` event is emitted when a new order has been successfully created. It triggers payment processing and stock allocation.

<NodeGraph />

### Key Features

- **Triggers Payment**: Notifies `Payment-Service` to process payment  
- **Reserves Stock**: Ensures inventory is allocated for the order  
- **Notifies Warehouse**: Informs `Warehouse-Service` to prepare shipment  

