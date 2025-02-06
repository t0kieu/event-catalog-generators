---
id: CartCheckedOut
name: Cart Checked Out
version: 1.0.0
owners:
  - order-management-team
---

The `CartCheckedOut` event is emitted when a user successfully checks out their cart, creating a new order. It notifies the `Order-Service` and `Payment-Service`.

<NodeGraph />

### Key Features

- **Order Creation**: Signals `Order-Service` to process the order  
- **Payment Processing**: Triggers `Payment-Service` to charge the user  
- **Stock Locking**: Ensures inventory is allocated for the order  

