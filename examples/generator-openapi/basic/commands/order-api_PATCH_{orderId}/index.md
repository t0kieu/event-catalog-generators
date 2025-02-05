---
id: 'order-api_PATCH_{orderId}'
version: 1.0.0
name: 'order-api_PATCH_{orderId}'
summary: Update order status
schemaPath: request-body.json
badges:
  - content: PATCH
    textColor: blue
    backgroundColor: blue
---
## Architecture
<NodeGraph />


## Overview
Update the status of an order (e.g., cancel).




## PATCH `(/{orderId})`

### Parameters
- **orderId** (path) (required)



### Request Body
<SchemaViewer file="request-body.json" maxHeight="500" id="request-body" />


### Responses
**404 Response**
<SchemaViewer file="response-404.json" maxHeight="500" id="response-404" />
      **500 Response**
<SchemaViewer file="response-500.json" maxHeight="500" id="response-500" />
