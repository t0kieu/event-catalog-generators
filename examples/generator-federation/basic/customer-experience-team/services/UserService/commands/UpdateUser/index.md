---
id: UpdateUser
name: Update User
version: 1.0.0
owners:
  - customer-experience-team
---

The UpdateUser command allows customers to update their user profiles in the system. It enables them to change their name, email, and preferences.

<NodeGraph />

<SchemaViewer file="schema.json" title="Schema" maxHeight="500px" />

### Example Usage

Copy the following command and paste it into your terminal to update a user.

```bash frame="none"
curl -X POST https://api.metaretail.com/v1/users/update \
  -H "Content-Type: application/json" \
  -d '{"userId": "1234567890", "firstName": "John", "lastName": "Doe", "email": "john.doe@example.com"}'
```

### Key Features
- **Data Validation**: Validates user input including email format, password strength, and required fields
- **Duplicate Prevention**: Checks for existing accounts to prevent duplicate registrations
- **Security**: Implements secure password hashing and storage practices
- **Profile Setup**: Creates initial user profile with basic information
- **Event Publishing**: Triggers relevant events for downstream processes (e.g., welcome emails, verification processes)

### Usage
This command is typically invoked through:
- User profile editing interfaces
- API endpoints for programmatic profile updates
- Administrative interfaces for system operators

### Input Requirements
- Username/Email (required)
- Password (required)
- Basic profile information (optional)
- Additional metadata (configurable)

### Success Criteria
- User profile successfully updated in the database
- Profile information is consistent across all platform services
- Audit trail is maintained for profile changes

### Error Handling
- Provides clear feedback for validation failures
- Handles duplicate account attempts gracefully
- Manages database transaction failures
- Ensures proper rollback of partial operations

### Any questions?
You can ask the team any questions you have