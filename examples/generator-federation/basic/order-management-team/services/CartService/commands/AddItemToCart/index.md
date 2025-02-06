---
id: AddItemToCart
name: Add Item to Cart
version: 1.0.0
owners:
  - order-management-team
schemaPath: ./schema.json
---

The `AddItemToCart` command is used to add a product to a user's shopping cart. If the item already exists in the cart, the quantity is increased.

<NodeGraph />

<SchemaViewer file="schema.json" title="Schema" maxHeight="500px" />

### Example Usage

Copy the following command and paste it into your terminal to add an item to a cart.

```bash frame="none"
curl -X POST https://api.metaretail.com/v1/carts/add-item \
  -H "Content-Type: application/json" \
  -d '{"cartId": "1234567890", "productId": "1234567890", "quantity": 1}'
```


### Key Features

- **Item Addition**: Adds a product to the user's cart  
- **Quantity Handling**: Adjusts quantity if the item is already in the cart  
- **Stock Validation**: Can trigger an inventory check before adding  

