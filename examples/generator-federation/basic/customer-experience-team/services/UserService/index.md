---
id: UserService
name: User Service
version: 1.0.0
receives:
    - id: CreateUser
    - id: UpdateUser
    - id: DeactivateUser
    - id: GetUser
    - id: GetUserEmailPreferences
    - id: PaymentFailed
    - id: OrderPlaced
    - id: LoyaltyPointsEarned
sends:
    - id: UserCreated
    - id: UserDeactivated
owners:
  - customer-experience-team
---
The User Service is a core microservice responsible for managing customer users throughout their lifecycle. It serves as the single source of truth for user profile data and handles user creation, updates, and user history management.

<NodeGraph />


## Business Context

This service plays a critical role in our system by:
- Managing user identity and profile information across all platform services
- Ensuring data consistency and integrity for user-related operations
- Supporting compliance requirements for user data management (GDPR, CCPA)
- Enabling personalization features across the platform

## Key Responsibilities

- User Profile Management
  - Personal information (name, contact details, preferences)
  - Account status and history
  - Profile verification status
- User Lifecycle Operations
  - Account creation and validation
  - Profile updates and modifications
  - Account deactivation/reactivation
- Data Integration
  - Synchronization with authentication systems
  - Profile data distribution to dependent services
  - Audit trail maintenance

## Event Integration

### Published Events
- `UserCreated`: Emitted when a new user account is successfully created
- `UserUpdated`: Emitted when user profile information is modified
- `UserDeactivated`: Emitted when a user account is deactivated

### Consumed Events
- `CreateUser`: Handles requests to create new user accounts
- `UpdateUser`: Processes user profile update requests
- `DeactivateUser`: Manages user account deactivation requests

## Technical Details

- **Storage**: PostgreSQL for user profiles, Redis for caching
- **Authentication**: Integrates with AuthenticationService for credential management
- **Compliance**: Implements data retention policies and GDPR requirements
- **Scalability**: Horizontally scalable with stateless design
- **Monitoring**: Prometheus metrics for user operations and service health

## Dependencies

- **AuthenticationService**: For user credential management
- **NotificationService**: For user-related notifications
- **AuditService**: For tracking user data changes



## API Documentation

For detailed API documentation, please refer to our [OpenAPI specification](./api-docs/openapi.yaml).

