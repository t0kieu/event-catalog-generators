---
id: CancelOrder
name: Cancel Order
version: 1.0.0
owners:
  - order-management-team
---

The `CancelOrder` command cancels an existing order. It can be triggered by the user or automatically due to payment failure or stock issues.

<NodeGraph />

### Key Features

- **Order Cancellation**: Marks order as canceled and stops fulfillment  
- **Stock Restoration**: Returns reserved stock to inventory  
- **Refund Handling**: Notifies `Payment-Service` to process refunds if needed  

