#!/bin/bash

# Script to add a schema to an existing AWS Glue Schema Registry
# Usage: ./scripts/add-schema-to-registry.sh <registry-name> <schema-name> <data-format> <schema-file> [region]

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 4 ]; then
    echo -e "${RED}❌ Usage: $0 <registry-name> <schema-name> <data-format> <schema-file> [region]${NC}"
    echo -e "${YELLOW}Example: $0 my-registry UserEvent AVRO ./schemas/user-event.avsc${NC}"
    exit 1
fi

REGISTRY_NAME=$1
SCHEMA_NAME=$2
DATA_FORMAT=$3
SCHEMA_FILE=$4
REGION=${5:-us-east-1}

# Validate data format
if [[ ! "$DATA_FORMAT" =~ ^(AVRO|JSON|PROTOBUF)$ ]]; then
    echo -e "${RED}❌ Invalid data format. Must be AVRO, JSON, or PROTOBUF${NC}"
    exit 1
fi

# Check if schema file exists
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Schema file not found: $SCHEMA_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}📤 Adding schema to AWS Glue Schema Registry${NC}"
echo -e "Registry: ${GREEN}$REGISTRY_NAME${NC}"
echo -e "Schema: ${GREEN}$SCHEMA_NAME${NC}"
echo -e "Format: ${GREEN}$DATA_FORMAT${NC}"
echo -e "File: ${GREEN}$SCHEMA_FILE${NC}"
echo -e "Region: ${GREEN}$REGION${NC}\n"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Read schema content
SCHEMA_DEFINITION=$(cat "$SCHEMA_FILE")

# Create the schema
echo -e "${YELLOW}📄 Creating schema...${NC}"
aws glue create-schema \
    --registry-id "RegistryName=$REGISTRY_NAME" \
    --schema-name "$SCHEMA_NAME" \
    --data-format "$DATA_FORMAT" \
    --compatibility "BACKWARD" \
    --description "Schema for $SCHEMA_NAME events" \
    --schema-definition "$SCHEMA_DEFINITION" \
    --region "$REGION"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Schema successfully added!${NC}"
    echo -e "\n${BLUE}📋 Schema details:${NC}"
    echo -e "  Name: ${GREEN}$SCHEMA_NAME${NC}"
    echo -e "  Registry: ${GREEN}$REGISTRY_NAME${NC}"
    echo -e "  Format: ${GREEN}$DATA_FORMAT${NC}"
    echo -e "  Compatibility: ${GREEN}BACKWARD${NC}"
    echo -e "\n${YELLOW}💡 Next steps:${NC}"
    echo -e "  • View in AWS Console: https://console.aws.amazon.com/glue/home?region=$REGION#/schema-registry"
    echo -e "  • Update your EventCatalog configuration to include this registry"
    echo -e "  • Run ${GREEN}./scripts/list-registries.sh $REGION${NC} to verify"
else
    echo -e "\n${RED}❌ Failed to create schema. Check your permissions and registry name.${NC}"
    exit 1
fi