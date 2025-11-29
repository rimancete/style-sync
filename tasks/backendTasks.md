# Current Sprint Tasks

## Phase 4 (Advanced Business Features)

### ADV-001: Complete booking flow
Status: In progress
Priority: High
Dependencies: ✅ BOO-001 (Booking Module Foundation)

#### Requirements

- [X] Professional availability calculation (schedule-aware)
- [X] "Any professional" slot aggregation (merged availability)
- [X] Service duration slot blocking (overlap detection)
- [X] Branch operating hours configuration (database-driven)
- [X] Professional working hours/schedules
- [ ] **Tests**: Fix current implementation tests `npm tst`
- [ ] **Timezone Support** (Critical for multi-timezone deployments)
  - ⚠️ **Current Limitation**: System assumes server timezone = branch timezone
  - Bookings stored in UTC but no explicit branch timezone configuration
  - Frontend must send ISO timestamps with timezone offset (e.g., `2025-12-25T11:00:00-03:00`)
  - **Recommended Implementation**:
    - Add `timezone` field to `branches` or `customers` table (e.g., 'America/Sao_Paulo')
    - Install timezone library (`date-fns-tz` or `luxon`)
    - Refactor slot generation to use branch timezone for proper conversion
    - Return timezone info in API responses
    - Frontend displays times in user's local timezone
  - **Impact**: Without this, multi-timezone deployments will show incorrect times
  - **Priority**: HIGH for international expansion, LOW for single-timezone operation
- [ ] Buffer times between appointments
  - Add configurable padding between bookings (e.g., 10 min cleanup time)
  - ⏳ Not yet implemented (future enhancement)
- [X] Concurrent booking race condition handling
- [X] Booking flow
   - [X] 1. User can confirm service booking whether or not logged in
   - [X] 2. Generate a confirmation URL with secure token
   - [X] 3. Confirmation link (evaluated: manual send by customer)
   - [X] 4. Customer panel shows confirmed bookings
   - [X] 5. **NEW**: Booking cancellation via DELETE /bookings/cancel/:token (returns 204)
      
- [ ] **Tests**: Property-based tests for complex availability algorithms
  - ⏳ Contract tests exist, but advanced property-based testing not implemented

#### Recent Fixes (2025-11-29)

**Critical Bug Fixed: Timezone Issue in Availability Check**
- **Problem**: Slot times created in local timezone, bookings stored in UTC → false matches
- **Impact**: Showed slots as available even when both professionals were booked
- **Solution**: Changed all date/time creation to use `Date.UTC()` for consistent comparison
- **Files Modified**: `bookings.service.ts` (generateTimeSlots method)
- **Current Assumption**: Server timezone = Branch timezone (documented for future improvement)

---


### ADV-002: Timezone Support Implementation
#### 📚 Related Documentation

##### Implementation Guides
- **[TIMEZONE-HANDLING.md](../docs/backend/TIMEZONE-HANDLING.md)** - Complete guide for timezone support implementation
  - Current behavior and limitations
  - Step-by-step implementation roadmap
  - Code examples with `date-fns-tz`
  - Migration strategies
  - Testing requirements

##### Technical Documentation  
- **[technical.md](../docs/backend/technical.md)** - System architecture and booking module specs
  - Timezone warnings and considerations
  - Frontend integration requirements
  - API endpoint documentation

##### Change History
- **[CHANGELOG-2025-11-29.md](../docs/backend/CHANGELOG-2025-11-29.md)** - Today's fixes and improvements
  - Timezone bug fix details
  - API refinements
  - Breaking changes for frontend
  - Known limitations

##### Implementation History
- **[implementationHistory.md](../docs/backend/implementationHistory.md)** - Complete development timeline
  - Phase-by-phase progress
  - Architecture decisions
  - Success criteria tracking

---

##### 🚀 Next: ADV-002: Timezone Support Implementation
**Status**: 📋 Planning  
**Priority**: Evaluate based on deployment needs  
**Estimated Effort**: 2-3 days  
**Dependencies**: ✅ ADV-001 (Booking Flow Complete)

###### Implementation Checklist

**Phase 5.1: Database Schema**
- [ ] **Task 1.1**: Add migration for timezone support
  ```prisma
  // prisma/schema.prisma
  model Branch {
    timezone String @default("UTC") // Add this field
  }
  
  model Customer {
    defaultTimezone String @default("UTC") // Optional: customer-level default
  }
  ```
- [ ] **Task 1.2**: Create migration file
  ```bash
  npx prisma migrate dev --name add_timezone_support
  ```
- [ ] **Task 1.3**: Update seed data with appropriate timezones
  - Branch 1 (Unidade 1): 'America/Sao_Paulo' (UTC-3)
  - Branch 2 (Unidade 2): 'America/Sao_Paulo' (UTC-3)
  - Branch 3 (Elite Beauty): TBD based on location

**Phase 5.2: Install Timezone Library**
- [ ] **Task 2.1**: Choose library
  - Option A: `date-fns-tz` (lightweight, works with date-fns)
  - Option B: `luxon` (full-featured, DateTime API)
- [ ] **Task 2.2**: Install dependencies
  ```bash
  npm install date-fns-tz
  npm install --save-dev @types/date-fns-tz
  ```
- [ ] **Task 2.3**: Add to package.json and commit

**Phase 5.3: Refactor Slot Generation**
- [ ] **Task 3.1**: Update `generateTimeSlots()` method
  - Read branch timezone from database
  - Convert slot times to branch timezone
  - Keep UTC for database comparisons
  - Reference: `docs/backend/TIMEZONE-HANDLING.md` (Phase 3)
- [ ] **Task 3.2**: Update `checkTimeSlotConflict()`
  - Ensure UTC comparison consistency
  - Add timezone debug logging
- [ ] **Task 3.3**: Update availability DTO
  ```typescript
  // dto/availability-response.dto.ts
  export class TimeSlotDto {
    time: string;
    available: boolean;
    professionalId?: string;
    timezone: string;        // NEW
    utcOffset: string;       // NEW: e.g., "-03:00"
    isoTimestamp?: string;   // NEW: Full ISO with offset
  }
  ```

**Phase 5.4: Update API Responses**
- [ ] **Task 4.1**: Modify availability endpoint response
- [ ] **Task 4.2**: Add timezone to booking confirmation
- [ ] **Task 4.3**: Update Swagger documentation
- [ ] **Task 4.4**: Update Postman collection

**Phase 5.5: Testing**
- [ ] **Task 5.1**: Write timezone-specific tests
  ```typescript
  describe('Timezone Support', () => {
    it('generates slots in branch timezone (America/Sao_Paulo)');
    it('handles bookings across DST transition');
    it('converts user timezone to branch timezone correctly');
    it('handles multiple branches in different timezones');
  });
  ```
- [ ] **Task 5.2**: Test DST (Daylight Saving Time) transitions
- [ ] **Task 5.3**: Test edge cases (UTC midnight crossings)
- [ ] **Task 5.4**: Verify backward compatibility
- [ ] **Task 5.5**: Run full test suite (target: 170+ tests passing)

**Phase 5.6: Frontend Coordination**
- [ ] **Task 6.1**: Update frontend to consume timezone info
- [ ] **Task 6.2**: Implement user timezone detection
- [ ] **Task 6.3**: Add timezone display in UI
- [ ] **Task 6.4**: Test booking flow with timezone conversion

**Phase 5.7: Documentation Updates**
- [ ] **Task 7.1**: Update API documentation
- [ ] **Task 7.2**: Update frontend integration guide
- [ ] **Task 7.3**: Create migration guide for existing bookings
- [ ] **Task 7.4**: Document timezone configuration process

---

### ADV-003: Buffer Times Between Appointments
**Status**: 📋 Backlog  
**Priority**: Low  
**Estimated Effort**: 1 day  
**Dependencies**: ✅ ADV-001

#### Implementation Checklist
- [ ] Add `bufferMinutes` field to Branch or Service configuration
- [ ] Update availability calculation to include buffer time
- [ ] Test buffer time with various service durations
- [ ] Document buffer time configuration

---

### ADV-004: Property-Based Testing
**Status**: 📋 Backlog  
**Priority**: Medium  
**Estimated Effort**: 2-3 days  
**Dependencies**: ✅ ADV-001, Consider after ADV-002

#### Implementation Checklist
- [ ] Install property-based testing library (`fast-check`)
- [ ] Write generators for booking scenarios
- [ ] Test availability algorithm with random inputs
- [ ] Test edge cases (midnight, DST transitions, concurrent bookings)
- [ ] Document property-based test patterns

---

## 🎯 Quick Start Guide for Next Session

### To Continue Development:

1. **Review Documentation**
   ```bash
   # Read the complete timezone guide
   cat docs/backend/TIMEZONE-HANDLING.md
   
   # Check today's changes
   cat docs/backend/CHANGELOG-2025-11-29.md
   ```

2. **Decide on Timezone Implementation**
   - Single-timezone deployment? → Skip ADV-002 for now
   - Multi-timezone needs? → Start with Phase 5.1

3. **If Implementing Timezone Support**
   ```bash
   # Start with database schema
   cd server
   
   # Edit prisma/schema.prisma (add timezone fields)
   # Then create migration
   npx prisma migrate dev --name add_timezone_support
   
   # Install timezone library
   npm install date-fns-tz
   
   # Follow checklist in ADV-002 above
   ```

4. **Run Tests Before Changes**
   ```bash
   cd server
   npm test -- bookings --no-coverage
   # Expected: All tests passing ✅
   ```

5. **Reference Files During Implementation**
   - Schema changes: `server/prisma/schema.prisma`
   - Slot generation: `server/src/bookings/bookings.service.ts` (line ~697)
   - DTOs: `server/src/bookings/dto/availability-response.dto.ts`
   - Tests: `server/src/bookings/*.contract.test.ts`

---

## 📊 Progress Tracking

### In Progress 🚧
- None currently

### Next Up 📋
- 📋 ADV-002: Timezone Support (conditional - evaluate need)
- 📋 ADV-003: Buffer Times (low priority)
- 📋 ADV-004: Property-Based Testing (medium priority)

### Future Considerations 💡
- Email/SMS notifications for bookings
- Payment integration
- Advanced cancellation policies
- Multi-service bookings
- Professional availability management UI
- Reporting and analytics

---

## 🤝 Collaboration Notes

When starting the next implementation session:

1. **Review Status**: Check which tasks from ADV-002 are ready to start
2. **Discuss Priority**: Confirm if timezone support is needed now or later
3. **Set Goals**: Choose specific tasks from the checklist to implement
4. **Test-Driven**: Write tests first, then implement
5. **Document**: Update this file as we complete tasks
6. **Commit Often**: Small, focused commits with clear messages
7. Delete the temp CHANGELOG and TIMEZONE-HANDLING files

**Remember**: All documentation is interlinked. Use the guides in `docs/backend/` as reference during implementation!