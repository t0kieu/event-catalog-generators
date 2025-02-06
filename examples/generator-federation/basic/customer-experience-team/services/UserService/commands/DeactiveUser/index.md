---
id: DeactivateUser
name: Deactivate User
version: 1.0.0
owners:
  - customer-experience-team
---

The DeactivateUser command allows customers to deactivate their user accounts in the system. It enables them to stop using the platform and remove their account from the system.

<NodeGraph />

### Key Features
- **Account Deactivation**: Removes user account from the system
- **Data Retention**: Keeps user data for legal and audit purposes
- **Event Publishing**: Triggers relevant events for downstream processes (e.g., user deletion, data cleanup)

### Usage
This command is typically invoked through:
- User profile deletion interfaces
- API endpoints for programmatic account deactivation
- Administrative interfaces for system operators

### Input Requirements
- Username/Email (required)
- Reason for deactivation (optional)

### Success Criteria
- User account successfully deactivated in the database
- Account status is updated to "DEACTIVATED"
- User data is retained for legal and audit purposes

### Error Handling
- Provides clear feedback for invalid input
- Handles account not found scenarios gracefully
- Manages database transaction failures
- Ensures proper cleanup of associated resources

### Any questions?
You can ask the team any questions you have