# System architecture diagram

## 1. Overview

This document outlines the system architecture.

### 1.1 Architecture Decisions

#### 1.1.1 Technology Stack

- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **Development Database**: Docker Compose
- **API Documentation**: Swagger/OpenAPI + Postman collection
- **Validation**: class-validator + class-transformer

### 4.2. Code Quality Standards

**ESLint Rules:**
- TypeScript strict mode enabled
- No `any` types (use proper typing)
- Consistent naming conventions
- Import organization

**Prettier Configuration:**
- 2-space indentation
- Single quotes
- Trailing commas
- 80-character line width

**Commit Message Format:**
```
type(scope): description

feat(auth): add JWT authentication
fix(booking): resolve availability calculation bug
docs(api): update endpoint documentation
refactor(health): improve error handling
test(users): add integration tests
```

## 5 Future Considerations

### 5.1 Not Implementing Initially

- Advanced cancellation policies
- Multi-service bookings
- Professional working hours management
- Automated SMS/Email notifications
- Payment processing integration
- Advanced reporting/analytics

### 5.2 Multilingual Support

- Frontend: i18next (React)
- Backend: Simple translation service for API responses
- Database: Store translatable content in JSON columns when needed

## 6 Success Metrics

- [ ] User can register and login
- [ ] Admin can manage branches and services
- [ ] Client can view available time slots
- [ ] Client can book appointments
- [ ] System handles "any professional" booking logic
- [ ] API is documented with Swagger
- [ ] Database supports multiple branches with different pricing

## Notes

- Start with english (USA) as primary language
- Focus on core booking functionality first
- Keep business rules simple initially
- Prioritize working software over perfect architecture
- Document decisions and trade-offs as you go
