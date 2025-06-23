#!/bin/bash

# AWS Glue Schema Registry Test Data Creator
# Creates a test schema registry with sample event schemas for EventCatalog testing

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
DEFAULT_REGION="us-east-1"
DEFAULT_REGISTRY="eventcatalog-test-registry"

# Use provided arguments or defaults
REGION="${1:-$DEFAULT_REGION}"
REGISTRY_NAME="${2:-$DEFAULT_REGISTRY}"

echo -e "${BLUE}🚀 Creating AWS Glue Schema Registry Test Data${NC}"
echo -e "Region: ${GREEN}$REGION${NC}"
echo -e "Registry: ${GREEN}$REGISTRY_NAME${NC}\n"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is not installed. Please install it first (brew install jq or apt-get install jq).${NC}"
    exit 1
fi

# Create the registry
echo -e "${YELLOW}📦 Creating schema registry: $REGISTRY_NAME${NC}"
aws glue create-registry \
    --registry-name "$REGISTRY_NAME" \
    --description "Test registry for EventCatalog generator" \
    --tags "Environment=test,Purpose=eventcatalog-testing" \
    --region "$REGION" 2>/dev/null || echo -e "${YELLOW}Registry already exists, continuing...${NC}"

# Function to create a schema
create_schema() {
    local SCHEMA_NAME=$1
    local DATA_FORMAT=$2
    local SCHEMA_DEFINITION=$3
    local DESCRIPTION=$4
    local TAGS=$5
    local COMPATIBILITY=${6:-"BACKWARD"}
    
    echo -e "${BLUE}📄 Creating schema: $SCHEMA_NAME ($DATA_FORMAT)${NC}"
    
    # Create the schema
    aws glue create-schema \
        --registry-id "RegistryName=$REGISTRY_NAME" \
        --schema-name "$SCHEMA_NAME" \
        --data-format "$DATA_FORMAT" \
        --compatibility "$COMPATIBILITY" \
        --description "$DESCRIPTION" \
        --tags "$TAGS" \
        --schema-definition "$SCHEMA_DEFINITION" \
        --region "$REGION" > /dev/null 2>&1 || echo -e "${YELLOW}  Schema already exists, skipping...${NC}"
}

# Create CustomerRegistered schema (AVRO)
CUSTOMER_REGISTERED_SCHEMA='{
  "type": "record",
  "name": "CustomerRegistered",
  "namespace": "com.example.events.customer",
  "doc": "Event emitted when a new customer registers",
  "fields": [
    {"name": "customerId", "type": "string", "doc": "Unique customer identifier"},
    {"name": "email", "type": "string", "doc": "Customer email address"},
    {"name": "firstName", "type": "string", "doc": "Customer first name"},
    {"name": "lastName", "type": "string", "doc": "Customer last name"},
    {"name": "registeredAt", "type": "long", "logicalType": "timestamp-millis", "doc": "Registration timestamp"}
  ]
}'
create_schema "CustomerRegistered" "AVRO" "$CUSTOMER_REGISTERED_SCHEMA" \
    "Event emitted when a new customer registers" \
    "Domain=customer,Team=customer-experience"

# Create CustomerProfileUpdated schema (JSON)
CUSTOMER_PROFILE_UPDATED_SCHEMA='{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CustomerProfileUpdated",
  "description": "Event emitted when customer profile is updated",
  "type": "object",
  "properties": {
    "customerId": {
      "type": "string",
      "description": "Unique customer identifier"
    },
    "updatedFields": {
      "type": "array",
      "items": {
        "type": "string"
      },
      "description": "List of fields that were updated"
    },
    "updatedBy": {
      "type": "string",
      "description": "User or system that made the update"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time",
      "description": "Update timestamp"
    }
  },
  "required": ["customerId", "updatedFields", "updatedAt"]
}'
create_schema "CustomerProfileUpdated" "JSON" "$CUSTOMER_PROFILE_UPDATED_SCHEMA" \
    "Event emitted when customer profile is updated" \
    "Domain=customer,Team=customer-experience"

# Create OrderCreated schema (AVRO)
ORDER_CREATED_SCHEMA='{
  "type": "record",
  "name": "OrderCreated",
  "namespace": "com.example.events.order",
  "doc": "Event emitted when a new order is created",
  "fields": [
    {"name": "orderId", "type": "string", "doc": "Unique order identifier"},
    {"name": "customerId", "type": "string", "doc": "Customer who placed the order"},
    {"name": "totalAmount", "type": "double", "doc": "Total order amount"},
    {"name": "currency", "type": "string", "doc": "Currency code"},
    {"name": "items", "type": {"type": "array", "items": {
      "type": "record",
      "name": "OrderItem",
      "fields": [
        {"name": "productId", "type": "string"},
        {"name": "quantity", "type": "int"},
        {"name": "price", "type": "double"}
      ]
    }}, "doc": "Order line items"},
    {"name": "createdAt", "type": "long", "logicalType": "timestamp-millis", "doc": "Order creation timestamp"}
  ]
}'
create_schema "OrderCreated" "AVRO" "$ORDER_CREATED_SCHEMA" \
    "Event emitted when a new order is created" \
    "Domain=order,Team=order-management"

# Create OrderShipped schema (AVRO)
ORDER_SHIPPED_SCHEMA='{
  "type": "record",
  "name": "OrderShipped",
  "namespace": "com.example.events.order",
  "doc": "Event emitted when an order is shipped",
  "fields": [
    {"name": "orderId", "type": "string", "doc": "Unique order identifier"},
    {"name": "trackingNumber", "type": "string", "doc": "Shipping tracking number"},
    {"name": "carrier", "type": "string", "doc": "Shipping carrier"},
    {"name": "estimatedDelivery", "type": "long", "logicalType": "timestamp-millis", "doc": "Estimated delivery date"},
    {"name": "shippedAt", "type": "long", "logicalType": "timestamp-millis", "doc": "Shipment timestamp"}
  ]
}'
create_schema "OrderShipped" "AVRO" "$ORDER_SHIPPED_SCHEMA" \
    "Event emitted when an order is shipped" \
    "Domain=order,Team=fulfillment"

# Create OrderPlaced schema (AVRO)
ORDER_PLACED_SCHEMA='{
  "type": "record",
  "name": "OrderPlaced",
  "namespace": "com.example.events.order",
  "doc": "Event emitted when an order is successfully placed",
  "fields": [
    {"name": "orderId", "type": "string", "doc": "Unique order identifier"},
    {"name": "customerId", "type": "string", "doc": "Customer who placed the order"},
    {"name": "orderStatus", "type": {"type": "enum", "name": "OrderStatus", "symbols": ["pending", "confirmed", "processing"]}, "doc": "Initial order status"},
    {"name": "paymentStatus", "type": {"type": "enum", "name": "PaymentOrderStatus", "symbols": ["pending", "authorized", "captured"]}, "doc": "Payment status"},
    {"name": "shippingAddress", "type": {
      "type": "record",
      "name": "ShippingAddress",
      "fields": [
        {"name": "street", "type": "string"},
        {"name": "city", "type": "string"},
        {"name": "state", "type": "string"},
        {"name": "zipCode", "type": "string"},
        {"name": "country", "type": "string"}
      ]
    }, "doc": "Shipping address details"},
    {"name": "totalAmount", "type": "double", "doc": "Total order amount"},
    {"name": "currency", "type": "string", "doc": "Currency code"},
    {"name": "placedAt", "type": "long", "logicalType": "timestamp-millis", "doc": "Order placement timestamp"}
  ]
}'
create_schema "OrderPlaced" "AVRO" "$ORDER_PLACED_SCHEMA" \
    "Event emitted when an order is successfully placed" \
    "Domain=order,Team=order-management"

# Create InventoryUpdated schema (JSON)
INVENTORY_UPDATED_SCHEMA='{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "InventoryUpdated",
  "description": "Event emitted when inventory levels change",
  "type": "object",
  "properties": {
    "productId": {
      "type": "string",
      "description": "Product identifier"
    },
    "warehouseId": {
      "type": "string",
      "description": "Warehouse identifier"
    },
    "previousQuantity": {
      "type": "integer",
      "description": "Previous inventory level"
    },
    "currentQuantity": {
      "type": "integer",
      "description": "Current inventory level"
    },
    "reason": {
      "type": "string",
      "enum": ["sale", "restock", "adjustment", "damage"],
      "description": "Reason for inventory change"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time",
      "description": "Update timestamp"
    }
  },
  "required": ["productId", "warehouseId", "currentQuantity", "reason", "updatedAt"]
}'
create_schema "InventoryUpdated" "JSON" "$INVENTORY_UPDATED_SCHEMA" \
    "Event emitted when inventory levels change" \
    "Domain=inventory,Team=warehouse-ops"

# Create InventoryAlertRaised schema (JSON)
INVENTORY_ALERT_SCHEMA='{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "InventoryAlertRaised",
  "description": "Event emitted when inventory falls below threshold",
  "type": "object",
  "properties": {
    "alertId": {
      "type": "string",
      "description": "Alert identifier"
    },
    "productId": {
      "type": "string",
      "description": "Product identifier"
    },
    "currentLevel": {
      "type": "integer",
      "description": "Current inventory level"
    },
    "thresholdLevel": {
      "type": "integer",
      "description": "Alert threshold level"
    },
    "severity": {
      "type": "string",
      "enum": ["low", "medium", "high", "critical"],
      "description": "Alert severity"
    },
    "raisedAt": {
      "type": "string",
      "format": "date-time",
      "description": "Alert timestamp"
    }
  },
  "required": ["alertId", "productId", "currentLevel", "thresholdLevel", "severity", "raisedAt"]
}'
create_schema "InventoryAlertRaised" "JSON" "$INVENTORY_ALERT_SCHEMA" \
    "Event emitted when inventory falls below threshold" \
    "Domain=inventory,Team=warehouse-ops,Priority=high"

# Create StockLevelChecked schema (JSON)
STOCK_LEVEL_CHECKED_SCHEMA='{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "StockLevelChecked",
  "description": "Event emitted when stock levels are checked",
  "type": "object",
  "properties": {
    "checkId": {
      "type": "string",
      "description": "Unique stock check identifier"
    },
    "productId": {
      "type": "string",
      "description": "Product identifier"
    },
    "warehouseId": {
      "type": "string",
      "description": "Warehouse identifier"
    },
    "stockLevel": {
      "type": "integer",
      "description": "Current stock level"
    },
    "minimumLevel": {
      "type": "integer",
      "description": "Minimum required stock level"
    },
    "maximumLevel": {
      "type": "integer",
      "description": "Maximum stock capacity"
    },
    "status": {
      "type": "string",
      "enum": ["healthy", "low", "critical", "overstocked"],
      "description": "Stock status assessment"
    },
    "checkedBy": {
      "type": "string",
      "description": "User or system that performed the check"
    },
    "checkedAt": {
      "type": "string",
      "format": "date-time",
      "description": "Check timestamp"
    }
  },
  "required": ["checkId", "productId", "warehouseId", "stockLevel", "status", "checkedAt"]
}'
create_schema "StockLevelChecked" "JSON" "$STOCK_LEVEL_CHECKED_SCHEMA" \
    "Event emitted when stock levels are checked" \
    "Domain=inventory,Team=warehouse-ops"

# Create PaymentProcessed schema (AVRO)
PAYMENT_PROCESSED_SCHEMA='{
  "type": "record",
  "name": "PaymentProcessed",
  "namespace": "com.example.events.payment",
  "doc": "Event emitted when a payment is processed",
  "fields": [
    {"name": "paymentId", "type": "string", "doc": "Unique payment identifier"},
    {"name": "orderId", "type": "string", "doc": "Associated order identifier"},
    {"name": "amount", "type": "double", "doc": "Payment amount"},
    {"name": "currency", "type": "string", "doc": "Currency code"},
    {"name": "method", "type": "string", "doc": "Payment method (card, paypal, etc)"},
    {"name": "status", "type": {"type": "enum", "name": "PaymentStatus", "symbols": ["pending", "completed", "failed", "refunded"]}, "doc": "Payment status"},
    {"name": "processedAt", "type": "long", "logicalType": "timestamp-millis", "doc": "Processing timestamp"}
  ]
}'
create_schema "PaymentProcessed" "AVRO" "$PAYMENT_PROCESSED_SCHEMA" \
    "Event emitted when a payment is processed" \
    "Domain=payment,Team=payment-processing,Compliance=pci"

# Create InventoryReserved schema (AVRO)
INVENTORY_RESERVED_SCHEMA='{
  "type": "record",
  "name": "InventoryReserved",
  "namespace": "com.example.events.inventory",
  "doc": "Event emitted when inventory is reserved for an order",
  "fields": [
    {"name": "reservationId", "type": "string", "doc": "Unique reservation identifier"},
    {"name": "orderId", "type": "string", "doc": "Associated order identifier"},
    {"name": "productId", "type": "string", "doc": "Product being reserved"},
    {"name": "warehouseId", "type": "string", "doc": "Warehouse from which inventory is reserved"},
    {"name": "quantity", "type": "int", "doc": "Quantity reserved"},
    {"name": "expiresAt", "type": "long", "logicalType": "timestamp-millis", "doc": "Reservation expiration time"},
    {"name": "reservedAt", "type": "long", "logicalType": "timestamp-millis", "doc": "Reservation timestamp"}
  ]
}'
create_schema "InventoryReserved" "AVRO" "$INVENTORY_RESERVED_SCHEMA" \
    "Event emitted when inventory is reserved for an order" \
    "Domain=inventory,Team=warehouse-ops"

# Create PaymentRequested schema (JSON)
PAYMENT_REQUESTED_SCHEMA='{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PaymentRequested",
  "description": "Event emitted when payment is requested for an order",
  "type": "object",
  "properties": {
    "paymentRequestId": {
      "type": "string",
      "description": "Unique payment request identifier"
    },
    "orderId": {
      "type": "string",
      "description": "Associated order identifier"
    },
    "customerId": {
      "type": "string",
      "description": "Customer identifier"
    },
    "amount": {
      "type": "number",
      "description": "Payment amount requested"
    },
    "currency": {
      "type": "string",
      "description": "Currency code (e.g., USD, EUR)"
    },
    "paymentMethod": {
      "type": "string",
      "enum": ["credit_card", "debit_card", "paypal", "bank_transfer"],
      "description": "Requested payment method"
    },
    "dueDate": {
      "type": "string",
      "format": "date-time",
      "description": "Payment due date"
    },
    "requestedAt": {
      "type": "string",
      "format": "date-time",
      "description": "Request timestamp"
    }
  },
  "required": ["paymentRequestId", "orderId", "customerId", "amount", "currency", "requestedAt"]
}'
create_schema "PaymentRequested" "JSON" "$PAYMENT_REQUESTED_SCHEMA" \
    "Event emitted when payment is requested for an order" \
    "Domain=payment,Team=payment-processing"

# Create ReservationCancelled schema (AVRO)
RESERVATION_CANCELLED_SCHEMA='{
  "type": "record",
  "name": "ReservationCancelled",
  "namespace": "com.example.events.inventory",
  "doc": "Event emitted when an inventory reservation is cancelled",
  "fields": [
    {"name": "cancellationId", "type": "string", "doc": "Unique cancellation identifier"},
    {"name": "reservationId", "type": "string", "doc": "Original reservation identifier"},
    {"name": "orderId", "type": "string", "doc": "Associated order identifier"},
    {"name": "productId", "type": "string", "doc": "Product that was reserved"},
    {"name": "warehouseId", "type": "string", "doc": "Warehouse where inventory was reserved"},
    {"name": "quantity", "type": "int", "doc": "Quantity that was reserved"},
    {"name": "reason", "type": {"type": "enum", "name": "CancellationReason", "symbols": ["order_cancelled", "payment_failed", "expired", "manual_adjustment"]}, "doc": "Reason for cancellation"},
    {"name": "cancelledBy", "type": "string", "doc": "User or system that cancelled the reservation"},
    {"name": "cancelledAt", "type": "long", "logicalType": "timestamp-millis", "doc": "Cancellation timestamp"}
  ]
}'
create_schema "ReservationCancelled" "AVRO" "$RESERVATION_CANCELLED_SCHEMA" \
    "Event emitted when an inventory reservation is cancelled" \
    "Domain=inventory,Team=warehouse-ops"

# Create ProductViewed schema (JSON)
PRODUCT_VIEWED_SCHEMA='{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "ProductViewed",
  "description": "Analytics event for product views",
  "type": "object",
  "properties": {
    "sessionId": {
      "type": "string",
      "description": "User session identifier"
    },
    "userId": {
      "type": "string",
      "description": "User identifier (if logged in)"
    },
    "productId": {
      "type": "string",
      "description": "Viewed product identifier"
    },
    "categoryId": {
      "type": "string",
      "description": "Product category"
    },
    "source": {
      "type": "string",
      "enum": ["search", "category", "recommendation", "direct"],
      "description": "How user found the product"
    },
    "viewedAt": {
      "type": "string",
      "format": "date-time",
      "description": "View timestamp"
    }
  },
  "required": ["sessionId", "productId", "source", "viewedAt"]
}'
create_schema "ProductViewed" "JSON" "$PRODUCT_VIEWED_SCHEMA" \
    "Analytics event for product views" \
    "Domain=analytics,Team=data-analytics" \
    "NONE"  # No compatibility checking for analytics events

echo -e "\n${GREEN}✅ Schema registry setup complete!${NC}"
echo -e "\n${BLUE}Summary:${NC}"
echo -e "  Registry: ${GREEN}$REGISTRY_NAME${NC}"
echo -e "  Region: ${GREEN}$REGION${NC}"
echo -e "  Schemas created: ${GREEN}13${NC}"
echo -e "\n${YELLOW}📝 Next steps:${NC}"
echo -e "  1. Run ${GREEN}./scripts/create-sample-config.sh${NC} to generate a sample EventCatalog configuration"
echo -e "  2. Run ${GREEN}./scripts/list-registries.sh${NC} to verify the schemas were created"
echo -e "  3. Use the generated configuration in your EventCatalog project"
echo -e "\n${BLUE}To clean up when done:${NC}"
echo -e "  Run ${GREEN}./scripts/cleanup-test-registry.sh $REGION $REGISTRY_NAME${NC}"