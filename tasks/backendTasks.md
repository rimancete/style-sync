# Current Sprint Tasks

## Phase 3 (Business Logic)
### SER-001: Implement Service Module
Status: ✅ COMPLETE (November 2025)
Priority: High
Dependencies: Branches Module, Professionals Module, Customers Module

#### Planning Complete ✅
- [x] Design decisions documented
- [x] Database schema changes defined
- [x] API endpoints specified
- [x] Implementation plan created
- [x] Testing strategy defined

#### Requirements
- [X] Service catalog management
- [X] Location-based pricing implementation
   - [X] Make currency configurable per customer
- [X] Service duration configuration (5-480 minutes validation)
- [X] **Soft Delete**: isActive boolean field (matching Professional pattern)
- [X] **Business Rule**: DELETE blocked if bookings exist; PATCH allows isActive=false anytime
- [X] **Ordering**: Sort by displayId (primary), name (secondary)
- [X] **Tests**: 40+ contract tests for service catalog and pricing APIs (45 delivered)

#### Implementation Phases
1. **Database & Core Setup** (2 hours)
   - [X] Add isActive field to Service model
   - [X] Run database migration
   - [X] Update seed data
   - [X] Create DTOs (8 files)
   - [X] Create Entity classes (2 files)

2. **Service Layer** (4 hours)
   - [X] Implement core service methods (8 methods)
   - [X] Implement pricing methods (5 methods)
   - [X] Add business logic validation (6 validations)

3. **Controller Layer** (3 hours)
   - [X] Admin endpoints (5 routes)
   - [X] Customer-scoped endpoints (5 routes)
   - [X] Branch-specific endpoints (4 routes)
   - [X] Configure guards and decorators

4. **Documentation** (1 hour)
   - [X] Add Swagger decorators
   - [X] Document request/response examples
   - [X] Add validation descriptions

5. **Testing** (5 hours)
   - [X] Write 40+ contract tests
   - [X] Test authentication/authorization
   - [X] Test CRUD operations
   - [X] Test pricing management
   - [X] Test edge cases

6. **Finalization** (2 hours)
   - [X] Update Postman collection
   - [X] Update technical documentation
   - [X] Code quality checks
   - [X] Manual testing

#### Bonus Deliverables (Completed)
- [X] Service name uniqueness fix (inactive services don't block name reuse)
- [X] Test infrastructure optimization (sequential execution via --runInBand)
- [X] Test split into maintainable files (services: 28 tests, pricing: 17 tests)
- [X] `updatedAt` field nullable behavior (null until first update)
- [X] Compilation error fixes (non-null assertion removal)

#### Resources & Documentation
- [Technical Specification](../docs/backend/technical.md#services-module) - Complete API documentation
- [Implementation History](../docs/backend/implementationHistory.md) - Step 3.3: Services Module Implementation
- [Postman Collection](../docs/backend/postman-collection.json) - All 14 endpoints with examples
- [Test Files](../server/src/services/) - 45 contract tests with full coverage
- [Status Tracking](../docs/backend/status.md) - Current progress and completions

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