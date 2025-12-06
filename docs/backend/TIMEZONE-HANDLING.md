# Timezone Handling in StyleSync

## Current Implementation (v1.0)

### ⚠️ Critical Assumption
**The system assumes the server timezone matches the branch timezone.**

All date/time operations are performed in UTC for internal consistency, but there is **no explicit timezone configuration** for branches or customers.

---

## How It Works Now

### 1. Booking Creation
**Frontend Requirement**: Must send ISO timestamps with timezone offset

```typescript
// ✅ CORRECT - Includes timezone offset
{
  "scheduledAt": "2025-12-25T11:00:00-03:00"  // 11 AM Brazil time (UTC-3)
}

// ❌ INCORRECT - Will be misinterpreted
{
  "scheduledAt": "2025-12-25T11:00:00.000Z"   // Forces UTC interpretation
}
```

**Backend Processing**:
1. Receives: `"2025-12-25T11:00:00-03:00"`
2. Converts to UTC: `2025-12-25T14:00:00.000Z`
3. Stores in database as UTC
4. PostgreSQL handles the conversion automatically

### 2. Availability Check
**Request**: `GET /api/salon/acme/availability?date=2025-12-25&branchId=...&serviceId=...`

**Backend Processing**:
```typescript
// Parse date as UTC
const [year, month, day] = date.split('-').map(Number);
const targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

// Generate slots in UTC
const slotTime = new Date(Date.UTC(year, month - 1, day, 11, 0, 0, 0));

// Compare with bookings (also in UTC)
// Returns slots as plain strings: "09:00", "09:30", etc.
```

**Response**:
```json
{
  "data": {
    "date": "2025-12-25",
    "availableSlots": [
      { "time": "09:00", "available": true, "professionalId": "..." },
      { "time": "09:30", "available": false },
      { "time": "11:00", "available": true, "professionalId": "..." }
    ]
  }
}
```

**⚠️ Note**: Times are returned as **strings without timezone context**. Frontend must interpret these in the branch's timezone.

### 3. Frontend Display
**Current Requirement**:
- Frontend must know the branch timezone (hardcoded or via API)
- Display "09:00" as "09:00 AM Brazil Time" (or whatever the branch timezone is)
- User timezone conversion is NOT handled by backend

---

## Limitations

### ❌ Single-Timezone Only
Works correctly ONLY when:
- Server timezone = Branch timezone
- All branches operate in the same timezone
- Users book in the branch timezone

### ❌ Breaks in Multi-Timezone Scenarios

**Example Problem**:
- Branch operates in **São Paulo** (UTC-3)
- Branch hours: 09:00-18:00 Brazil time
- Server runs in **UTC timezone**
- Availability slots generated: 09:00, 09:30, 10:00... (interpreted as UTC)
- User sees: 06:00 AM, 06:30 AM, 07:00 AM... (converted to Brazil time)
- **Result**: Wrong times displayed** ❌

### ❌ No Timezone Info in API
- Availability response doesn't include timezone
- Booking confirmation doesn't show timezone
- Frontend must independently manage timezone display

---

## Future Enhancement: Proper Timezone Support

### Phase 1: Database Schema

```prisma
model Branch {
  id        String   @id @default(cuid())
  name      String
  timezone  String   @default("UTC")  // NEW: IANA timezone (e.g., 'America/Sao_Paulo')
  // ... other fields
}

model Customer {
  id              String   @id @default(cuid())
  name            String
  defaultTimezone String   @default("UTC")  // NEW: Default for all branches
  // ... other fields
}
```

### Phase 2: Install Timezone Library

```bash
npm install date-fns-tz
# or
npm install luxon
```

### Phase 3: Refactor Slot Generation

```typescript
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

async generateTimeSlots(branchId: string, date: string): Promise<TimeSlotDto[]> {
  // Get branch timezone from database
  const branch = await this.db.branch.findUnique({ where: { id: branchId } });
  const branchTZ = branch.timezone; // 'America/Sao_Paulo'
  
  // Parse date in branch timezone
  const [year, month, day] = date.split('-').map(Number);
  const dateInBranchTZ = new Date(year, month - 1, day, 9, 0, 0); // 9 AM branch time
  
  // Convert to UTC for database comparison
  const dateUTC = zonedTimeToUtc(dateInBranchTZ, branchTZ);
  
  // Generate slots in branch timezone
  for (let hour = 9; hour < 18; hour++) {
    const slotInBranchTZ = new Date(year, month - 1, day, hour, 0, 0);
    const slotUTC = zonedTimeToUtc(slotInBranchTZ, branchTZ);
    
    // Check availability against bookings (in UTC)
    const available = !this.hasConflict(slotUTC, bookings);
    
    slots.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      available,
      timezone: branchTZ,  // NEW: Include timezone in response
    });
  }
  
  return slots;
}
```

### Phase 4: Update API Response

```typescript
// Before
{
  "time": "11:00",
  "available": true
}

// After
{
  "time": "11:00",
  "available": true,
  "timezone": "America/Sao_Paulo",
  "utcOffset": "-03:00",
  "isoTimestamp": "2025-12-25T11:00:00-03:00"  // Full ISO with offset
}
```

### Phase 5: Frontend Enhancement

```typescript
// Frontend can now properly display and convert times
import { format, utcToZonedTime } from 'date-fns-tz';

function displayBookingTime(isoTimestamp: string, userTimezone: string) {
  const date = new Date(isoTimestamp);
  const zonedDate = utcToZonedTime(date, userTimezone);
  return format(zonedDate, 'PPpp', { timeZone: userTimezone });
}

// Example:
// Booking: "2025-12-25T11:00:00-03:00" (Brazil time)
// User in: America/New_York (UTC-5)
// Display: "Dec 25, 2025, 9:00 AM EST"
```

---

## Migration Path

### Option A: Gradual Migration (Recommended)
1. **Phase 1**: Add `timezone` column with default 'UTC' (non-breaking)
2. **Phase 2**: Update admin interface to set branch timezones
3. **Phase 3**: Deploy timezone-aware slot generation (backward compatible)
4. **Phase 4**: Update API responses to include timezone info
5. **Phase 5**: Frontend updates to use new timezone data

### Option B: Big Bang Migration
- All changes deployed at once
- Requires coordinated frontend/backend release
- Higher risk but faster delivery

---

## Testing Requirements

### Current Tests (Passing)
- ✅ Slot generation in UTC
- ✅ Booking conflict detection in UTC
- ✅ Race condition handling

### Future Tests Needed
- [ ] Slot generation across timezone boundaries (DST changes)
- [ ] Booking creation from different timezones
- [ ] Availability check for branches in multiple timezones
- [ ] Edge cases: DST transitions, leap seconds, etc.

---

## Recommendations

### For Single-Timezone Deployment (Current)
✅ **Keep current implementation**
- Document timezone assumption clearly
- Ensure frontend sends proper ISO timestamps
- Monitor for timezone-related issues

### For Multi-Timezone Deployment (Future)
⚠️ **Implement proper timezone support**
- Priority: HIGH
- Estimated effort: 2-3 days
- Dependencies: Database migration, library installation
- Testing: Extensive timezone scenario coverage

---

## References

- [IANA Timezone Database](https://www.iana.org/time-zones)
- [date-fns-tz Documentation](https://github.com/marnusw/date-fns-tz)
- [ISO 8601 Timestamp Format](https://en.wikipedia.org/wiki/ISO_8601)
- [PostgreSQL Timezone Handling](https://www.postgresql.org/docs/current/datatype-datetime.html)

---

## Contact

For questions or issues related to timezone handling:
- See: `tasks/backendTasks.md` → Future Enhancements
- Code: `server/src/bookings/bookings.service.ts` → `generateTimeSlots()`
- Changelog: `docs/backend/CHANGELOG-2025-11-29.md`


