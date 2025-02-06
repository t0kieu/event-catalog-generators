# This script will create the required resources in AWS for this demo

# Create an EventBus we use for the demo
aws events create-event-bus --name my-demo-bus --region us-east-1

# Get account number
ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)

# Create a discoverer to discover schemas in the event bus
aws schemas create-discoverer --source-arn arn:aws:events:us-east-1:$ACCOUNT_ID:event-bus/my-demo-bus --region us-east-1

# Start the discovery for schema discovery
aws schemas start-discoverer --discoverer-id events-event-bus-my-demo-bus --region us-east-1
