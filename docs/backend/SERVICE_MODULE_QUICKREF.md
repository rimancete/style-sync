# Service Module Quick Reference

**Status**: Planning Complete - Ready for Implementation  
**Related Doc**: [Full Implementation Plan](./SERVICE_MODULE_IMPLEMENTATION_PLAN.md)

---

## 🎯 Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Soft Delete** | `isActive` boolean | Matches Professional pattern, simpler than `deletedAt` |
| **Deletion Rule** | Prevent if ANY bookings exist | Preserves history, prevents data integrity issues |
| **Pricing Model** | One price per service-branch | Simple v1, extensible later |
| **Service-Pro Relationship** | None (v1) | All pros do all services - simplified logic |
| **Ordering** | displayId + name | Creation order + alphabetical fallback |

---

## 🗄️ Database Change

```prisma
model Service {
  // ... existing fields
  isActive  Boolean @default(true)  // 🆕 ADD THIS FIELD
}
```

**Migration**: `npx prisma migrate dev --name add_is_active_to_services`

---

## 🌐 API Endpoints (14 total)

### Admin (Global) - 5 endpoints
```
GET    /api/services              # List all services
POST   /api/services              # Create service
GET    /api/services/:id          # Get service
PATCH  /api/services/:id          # Update service
DELETE /api/services/:id          # Deactivate service
```

### Customer-Scoped - 5 endpoints
```
GET    /api/salon/:slug/services              # List customer services
POST   /api/salon/:slug/services              # Create customer service
GET    /api/salon/:slug/services/:id          # Get customer service
PATCH  /api/salon/:slug/services/:id          # Update customer service
DELETE /api/salon/:slug/services/:id          # Deactivate customer service
```

### Branch + Pricing - 4 endpoints
```
GET    /api/salon/:slug/branches/:branchId/services             # Services with pricing
POST   /api/salon/:slug/services/:serviceId/pricing             # Set pricing
GET    /api/salon/:slug/services/:serviceId/pricing/:branchId   # Get pricing
DELETE /api/salon/:slug/services/:serviceId/pricing/:branchId   # Remove pricing
```

---

## 🔒 Authentication & Authorization

| Endpoint Type | Guards | Roles |
|---------------|--------|-------|
| Admin (Global) | `JwtAuthGuard`, `GlobalAdminGuard` | ADMIN only |
| Customer-Scoped (Write) | `JwtAuthGuard`, `CustomerContextGuard`, `RolesGuard` | ADMIN only |
| Customer-Scoped (Read) | `JwtAuthGuard`, `CustomerContextGuard` | All roles |

---

## 📋 Implementation Checklist (Summary)

### Phase 1: Database (2 hours)
- [ ] Add `isActive` field to Service model
- [ ] Run migration
- [ ] Create 8 DTOs
- [ ] Create 2 Entity classes

### Phase 2: Service Layer (4 hours)
- [ ] 8 core service methods
- [ ] 5 pricing methods
- [ ] 6 business validations

### Phase 3: Controller (3 hours)
- [ ] 14 endpoint routes
- [ ] Guard configuration
- [ ] Role-based access

### Phase 4: Swagger (1 hour)
- [ ] API documentation decorators
- [ ] Request/response examples

### Phase 5: Testing (5 hours)
- [ ] 40+ contract tests
- [ ] All scenarios covered

### Phase 6: Finalization (2 hours)
- [ ] Postman collection
- [ ] Documentation updates
- [ ] Code quality checks

**Total**: ~17 hours (2-3 days)

---

## ✅ Success Criteria

- ✅ All 40+ contract tests passing
- ✅ Swagger documentation complete
- ✅ Services can be created and priced per branch
- ✅ Deactivation prevented when bookings exist
- ✅ Customer-scoped operations isolated
- ✅ Role-based access working

---

## 🧪 Testing Strategy

**Target**: 40+ contract tests

**Categories**:
- 8 tests: Authentication & Authorization
- 12 tests: Service CRUD Operations
- 10 tests: Pricing Management
- 5 tests: Branch Services Queries
- 10+ tests: Validation & Edge Cases

---

## 🔮 Future Enhancements (Post-v1)

1. **ServiceProfessional** junction table (skill restrictions)
2. **ServiceCategory** model (grouping)
3. **PricingRule** model (time-based, level-based, promotional)
4. **displayOrder** field (custom ordering)
5. **Availability schedules** (time/day restrictions)

---

## 📚 Key Files to Create

**DTOs** (8 files):
- `create-service.dto.ts`
- `create-customer-service.dto.ts`
- `update-service.dto.ts`
- `service-response.dto.ts`
- `services-list-response.dto.ts`
- `create-service-pricing.dto.ts`
- `update-service-pricing.dto.ts`
- `service-pricing-response.dto.ts`

**Entities** (2 files):
- `service.entity.ts`
- `service-pricing.entity.ts`

**Core** (3 files):
- `services.service.ts`
- `services.controller.ts`
- `services.module.ts`

**Testing** (1 file):
- `services.contract.test.ts`

---

## 🚨 Critical Validation Rules

### Service
- Name: 2-100 characters, unique per customer
- Duration: 5-480 minutes (8 hours max)
- Description: 0-500 characters

### Pricing
- Price: 0.01-9999.99 (2 decimals)
- Branch must belong to same customer as service
- One price per service-branch combo

### Deactivation
- **Cannot deactivate if bookings exist** (past or future)
- Error: HTTP 409 Conflict
- Message: "Cannot deactivate service with existing bookings..."

---

## 💡 Implementation Tips

1. **Follow Professional Module Pattern**: Use same structure for consistency
2. **Test Customer Context Early**: Ensure slug extraction works
3. **Validate Cross-Customer Access**: Prevent data leaks
4. **Use Upsert for Pricing**: Atomic create/update operation
5. **Include Related Data**: Eager load customer/branch names when needed

---

**Last Updated**: 2025-10-25  
**Next Step**: Start Phase 1 - Database Migration

