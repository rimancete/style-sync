# Current Sprint Tasks

## Phase 3 (Business Logic)
### SER-001: Implement Service Module
Status: In Progress - Planning Complete
Priority: High
Dependencies: Branches Module, Professionals Module, Customers Module

#### Planning Complete ✅
- [x] Design decisions documented
- [x] Database schema changes defined
- [x] API endpoints specified
- [x] Implementation plan created
- [x] Testing strategy defined

#### Requirements
- [ ] Service catalog management
- [ ] Location-based pricing implementation
- [ ] Service duration configuration
- [ ] **Soft Delete**: isActive boolean field (matching Professional pattern)
- [ ] **Business Rule**: Prevent deactivation if bookings exist
- [ ] **Ordering**: Sort by displayId (primary), name (secondary)
- [ ] **Tests**: 40+ contract tests for service catalog and pricing APIs

#### Implementation Phases
1. **Database & Core Setup** (2 hours)
   - [ ] Add isActive field to Service model
   - [ ] Run database migration
   - [ ] Update seed data
   - [ ] Create DTOs (8 files)
   - [ ] Create Entity classes (2 files)

2. **Service Layer** (4 hours)
   - [ ] Implement core service methods (8 methods)
   - [ ] Implement pricing methods (5 methods)
   - [ ] Add business logic validation (6 validations)

3. **Controller Layer** (3 hours)
   - [ ] Admin endpoints (5 routes)
   - [ ] Customer-scoped endpoints (5 routes)
   - [ ] Branch-specific endpoints (4 routes)
   - [ ] Configure guards and decorators

4. **Documentation** (1 hour)
   - [ ] Add Swagger decorators
   - [ ] Document request/response examples
   - [ ] Add validation descriptions

5. **Testing** (5 hours)
   - [ ] Write 40+ contract tests
   - [ ] Test authentication/authorization
   - [ ] Test CRUD operations
   - [ ] Test pricing management
   - [ ] Test edge cases

6. **Finalization** (2 hours)
   - [ ] Update Postman collection
   - [ ] Update technical documentation
   - [ ] Code quality checks
   - [ ] Manual testing

#### Resources
- [Service Module Implementation Plan](../docs/backend/SERVICE_MODULE_IMPLEMENTATION_PLAN.md)
- [API Endpoints Specification](../docs/backend/SERVICE_MODULE_IMPLEMENTATION_PLAN.md#api-endpoints)
- [Testing Strategy](../docs/backend/SERVICE_MODULE_IMPLEMENTATION_PLAN.md#testing-strategy)

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