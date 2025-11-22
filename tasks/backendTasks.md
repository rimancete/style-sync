# Current Sprint Tasks

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
      - [ ] Evaluate if this implementation is so much complex. If so, just generate a URL that could be sent to user manually by the customer
   - [ ] 4. If the user confirms it (via a screen button), the customer will be able to check the confirmed bookings in yours customer panel
      
- [ ] **Tests**: Property-based tests for complex availability algorithms