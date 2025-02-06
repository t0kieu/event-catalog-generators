---
id: CreateOrder
name: Create Order
version: 1.0.0
owners:
  - order-management-team
---

The `CreateOrder` command is used to create a new order based on a user's cart. It validates the order, calculates totals, and reserves stock.

<NodeGraph />

### Key Features

- **Order Creation**: Converts a cart into an order  
- **Stock Reservation**: Ensures items are available before confirming  
- **Payment Handling**: Connects with `Payment-Service` for processing  

