# Current Sprint Tasks

## Phase 3 (Business Logic)
### BOO-001: Booking Module Foundation
Status: ✅ COMPLETE (November 15, 2025)
Priority: High
Dependencies: ✅ Branches Module, Professionals Module, Services Module

#### Requirements
- [X] Basic booking CRUD (create, read, update, cancel)
- [X] Availability query structure (time slot generation API)
- [X] Simple time slot logic (30-minute intervals, 09:00-18:00)
- [X] **Tests**: Contract tests for booking APIs (completed)
- [X] Auto-assignment logic for "any professional" bookings
- [X] Dual endpoint pattern (Admin + Customer-scoped)
- [X] Double-booking prevention
- [X] Cross-customer validation
- [X] Price calculation from ServicePricing


# Next Sprint Tasks
## Phase 4 (Advanced Business Features)

### ADV-001: Complete booking flow
Status: In Backlog
Priority: Medium
Dependencies: ✅ BOO-001 (Booking Module Foundation)

#### Requirements

- [ ] Professional availability calculation (schedule-aware)
- [ ] "Any professional" slot aggregation (merged availability)
- [ ] Service duration slot blocking (overlap detection)
- [ ] Branch operating hours configuration (database-driven)
- [ ] Professional working hours/schedules
- [ ] Buffer times between appointments
- [ ] Concurrent booking race condition handling
- [ ] Booking flow
   - [ ] 1. User can confirm service booking whether or not logged in
   - [ ] 2. Generate a confimation URL
   - [ ] 3. One day before the booking, send a confirmation link to the user WhatsApp
      - [ ] Evaluate if this implementation is so much complex. If so, just generate a URL that could be sent to user manually
   - [ ] 4. If the user confirms it (via a screen button), the customer will be able to check the confirmed bookings in yours customer panel
      
- [ ] **Tests**: Property-based tests for complex availability algorithms