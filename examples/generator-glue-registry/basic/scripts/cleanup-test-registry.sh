#!/bin/bash

# AWS Glue Schema Registry Cleanup Script
# Removes test schema registry and all associated schemas

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

echo -e "${BLUE}🗑️  Cleaning up AWS Glue Schema Registry${NC}"
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

# Confirm deletion
echo -e "${YELLOW}⚠️  This will delete the registry and all its schemas!${NC}"
read -p "Are you sure you want to continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cancelled.${NC}"
    exit 0
fi

# List all schemas in the registry
echo -e "\n${BLUE}📋 Listing schemas in registry...${NC}"
SCHEMAS=$(aws glue list-schemas \
    --registry-id "RegistryName=$REGISTRY_NAME" \
    --region "$REGION" \
    --query 'Schemas[].SchemaName' \
    --output json 2>/dev/null || echo "[]")

if [ "$SCHEMAS" = "[]" ]; then
    echo -e "${YELLOW}No schemas found in registry.${NC}"
else
    # Delete each schema
    echo "$SCHEMAS" | jq -r '.[]' | while read -r schema_name; do
        echo -e "${BLUE}  Deleting schema: $schema_name${NC}"
        aws glue delete-schema \
            --schema-id "RegistryName=$REGISTRY_NAME,SchemaName=$schema_name" \
            --region "$REGION" 2>/dev/null || echo -e "${YELLOW}    Failed to delete schema${NC}"
    done
fi

# Delete the registry
echo -e "\n${BLUE}📦 Deleting registry: $REGISTRY_NAME${NC}"
aws glue delete-registry \
    --registry-id "RegistryName=$REGISTRY_NAME" \
    --region "$REGION" 2>/dev/null || echo -e "${YELLOW}Failed to delete registry (it might not exist)${NC}"

echo -e "\n${GREEN}✅ Cleanup complete!${NC}"