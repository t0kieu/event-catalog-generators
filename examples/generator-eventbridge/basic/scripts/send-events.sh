#!/bin/bash

# This script will send events to EventBridge
# The schema discovery will discover the events and create a schemas for each one
# We will use these to map into EventCatalog
# Remember to run the init.sh script first to create the EventBridge bus and start the schema discovery

# The discovery can take a while to complete. After running this script wait 5 minutes for AWS to discover the schemas
# You can verify the schemas were discovered https://us-east-1.console.aws.amazon.com/events/home?region=us-east-1#/schemas?registry=discovered-schemas

BUS_NAME="my-demo-bus"

# Function to send event to EventBridge
send_event() {
    local source=$1
    local detail_type=$2
    local event_data=$3
    
    local escaped_data=$(echo "$event_data" | sed 's/"/\\"/g')
    aws events put-events --region us-east-1 --entries "[{\"Source\":\"$source\",\"DetailType\":\"$detail_type\",\"Detail\":\"$escaped_data\",\"EventBusName\":\"$BUS_NAME\"}]" > /dev/null
    echo "✓ Sent event: $detail_type from $source"
}

# Send 20 different types of events
echo "Sending events to $BUS_NAME..."

# User domain events
send_event "demo.users" "UserSignUp" "{\"action\":\"signup\",\"userId\":\"123\"}"
send_event "demo.users" "UserLogin" "{\"action\":\"login\",\"userId\":\"123\"}"
send_event "demo.users" "UserProfileUpdated" "{\"userId\":\"123\",\"field\":\"address\"}"

# Order domain events
send_event "demo.orders" "OrderCreated" "{\"orderId\":\"order123\",\"amount\":99.99}"
send_event "demo.orders" "OrderShipped" "{\"orderId\":\"order123\",\"trackingId\":\"track456\"}"

# Payment domain events
send_event "demo.payments" "PaymentProcessed" "{\"orderId\":\"order123\",\"status\":\"success\"}"

# Product domain events
send_event "demo.products" "InventoryUpdated" "{\"productId\":\"prod789\",\"quantity\":50}"
send_event "demo.products" "ProductCreated" "{\"productId\":\"prod789\",\"name\":\"New Item\"}"
send_event "demo.products" "ProductUpdated" "{\"productId\":\"prod789\",\"price\":29.99}"

# Shopping domain events
send_event "demo.shopping" "CartUpdated" "{\"userId\":\"123\",\"items\":3}"
send_event "demo.shopping" "WishlistUpdated" "{\"userId\":\"123\",\"productId\":\"prod789\"}"

# Communication domain events
send_event "demo.communications" "EmailSent" "{\"to\":\"user@example.com\",\"type\":\"welcome\"}"
send_event "demo.communications" "NotificationSent" "{\"userId\":\"123\",\"type\":\"push\"}"

# Subscription domain events
send_event "demo.subscriptions" "SubscriptionCreated" "{\"userId\":\"123\",\"plan\":\"premium\"}"
send_event "demo.subscriptions" "SubscriptionCancelled" "{\"userId\":\"123\",\"reason\":\"expired\"}"

# Content domain events
send_event "demo.content" "ReviewSubmitted" "{\"productId\":\"prod789\",\"rating\":5}"
send_event "demo.content" "CommentAdded" "{\"userId\":\"123\",\"content\":\"Great product!\"}"

# System domain events
send_event "demo.system" "SearchPerformed" "{\"query\":\"electronics\",\"results\":10}"
send_event "demo.system" "ErrorLogged" "{\"code\":\"E404\",\"message\":\"Not found\"}"
send_event "demo.system" "ApiRequest" "{\"endpoint\":\"/api/v1/users\",\"method\":\"GET\"}"

echo "Finished sending events!"
