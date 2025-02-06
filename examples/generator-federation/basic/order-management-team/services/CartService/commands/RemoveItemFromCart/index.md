---
id: RemoveItemFromCart
name: Remove Item from Cart
version: 1.0.0
owners:
  - order-management-team
---

The `RemoveItemFromCart` command removes an item from the user's cart. If the quantity is greater than one, it decreases the quantity instead of removing the item completely.

<NodeGraph />

### Key Features

- **Item Removal**: Deletes or decreases quantity of an item in the cart  
- **Cart Cleanup**: Ensures empty carts are handled properly  
- **Stock Adjustment**: Can trigger inventory updates if needed  

