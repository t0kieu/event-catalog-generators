#!/bin/bash

# Set AWS region
AWS_REGION="us-east-1"  # Change this to your desired region

# Sample schemas
declare -a schemas=(
    "UserCreated"
    "OrderPlaced"
    "PaymentProcessed"
    "ProductUpdated"
    "InventoryChanged"
    "InventoryUpdated"
    "OrderShipped"
    "OrderCreated"
    "OrderCancelled"
    "OrderPaid"
    "OrderShipped"
    "OrderDelivered"
    "OrderReturned"
)

# Create custom schema registry if it doesn't exist
aws schemas create-registry \
    --registry-name "my-custom-registry" \
    --description "Custom registry for sample schemas" \
    --region $AWS_REGION > /dev/null 2>&1

# Schema content for each event type
for schema in "${schemas[@]}"
do
    echo "Creating schema: $schema"
    
    # Create schema content
    SCHEMA_CONTENT=$(cat <<EOF
{
    "\$schema": "http://json-schema.org/draft-07/schema#",
    "title": "${schema}Event",
    "type": "object",
    "properties": {
        "eventType": {
            "type": "string",
            "description": "The type of the event",
            "enum": ["${schema}"]
        },
        "timestamp": {
            "type": "string",
            "format": "date-time",
            "description": "The time when the event occurred"
        },
        "data": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "string",
                    "description": "Unique identifier"
                },
                "name": {
                    "type": "string",
                    "description": "Name associated with the event"
                }
            }
        }
    },
    "required": ["eventType", "timestamp", "data"]
}
EOF
)

    # Create schema in the registry
    aws schemas create-schema \
        --registry-name "my-custom-registry" \
        --schema-name "${schema}" \
        --content "$SCHEMA_CONTENT" \
        --type "JSONSchemaDraft4" \
        --region $AWS_REGION > /dev/null 2>&1

    echo "Schema ${schema} created successfully"
done

echo "All schemas have been uploaded to the registry"
