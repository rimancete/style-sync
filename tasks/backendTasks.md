# Current Sprint Tasks

## Phase 2 (Core Modules)
### AUT-002: Implement Customer-Linked Registration
Status: In Progress
Priority: High
Dependencies: None

#### Requirements
- [x] **Customer-Linked Registration**: Multi-tenant user registration system
- [ ] **Two Steps Customer Registration Flow**: If the user exists we need to return a specif status code like 428. The frontend will ask if the user wants to register his user to this customer and then the frontend will try to register again and the backend will accept it.
Another improvement is to update the user name and phone when this user is linked to the selected customer.
- [ ] **Tests**: Contract tests for auth endpoints (base implemented but it will be updated)

## Phase 3 (Business Logic)
### SER-001: Implement Service Module
Status: In Backlog
Priority: High
Dependencies: None

#### Requirements
- [ ] Service catalog management
- [ ] Location-based pricing implementation
- [ ] Service duration configuration
- [ ] **Tests**: Contract tests for service catalog and pricing APIs

### BOO-001: Booking Module Foundation
Status: In Backlog
Priority: Medium
Dependencies: None

#### Requirements
- [ ] Basic booking CRUD
- [ ] Availability query structure
- [ ] Simple time slot logic
- [ ] **Tests**: Contract tests for booking APIs + property-based tests for availability logic


# Next Sprint Tasks
## Phase 4 (Advanced Business Features)

### ADV-001: Complete booking flow
Status: In Backlog
Priority: Low
Dependencies: None

#### Requirements

- [ ] Professional availability calculation
- [ ] "Any professional" slot aggregation
- [ ] Service duration slot blocking
- [ ] **Tests**: Property-based tests for complex availability algorithms