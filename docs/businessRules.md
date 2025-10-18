# 1 Business
StyleSync is a multi-location barbershop booking system with the following key requirements:

- **Customer-Scoped**: Complete customer-scoped management. One single code base, multiple clients.
- **Multi-branch**: Multiple branch locations ("Unidade 1", "Unidade 2")
- **Professional selection**: Clients can choose specific professionals or "any available"
- **Single service booking**: One service per appointment (simplified business logic)
- **Location-based pricing**: Same services can have different prices per branch
- **Multilingual support**: Primary english (USA) and then portuguese, expandable to other languages

## 1.1 Business Logic Clarifications

1. **Professional Preferences**: Clients can book "any available professional" (professionalId = null)
2. **Service Combinations**: Single service per booking (no complex multi-service logic)
3. **Pricing Strategy**: Location-specific pricing for services
4. **Cancellation Rules**: Deferred to future implementation
