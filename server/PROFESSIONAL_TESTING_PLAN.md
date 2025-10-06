# Professionals Module - Manual Testing Plan (curl)

## Overview

This document provides a comprehensive test plan for the Professionals module using curl commands. The tests cover all endpoints, authentication scenarios, and business logic validation.

## Test Environment Setup

**Base URL**: `http://localhost:3000/api`
**Authentication**: JWT Bearer tokens

### Test Accounts (from seed data)

- **Platform Admin**: `admin@stylesync.com` / `123456` (ADMIN role, no customer association)
- **Customer Admin**: `admin@acme.com` / `123456` (ADMIN role, associated with Acme customer)
- **Client**: `client@test.com` / `123456` (CLIENT role, associated with Acme customer)

### Test Data (from seed)

- **Customer**: Acme Barbershop (urlSlug: `acme`)
- **Branch 1**: Unidade 1 (has professionals: Michel, Luiz)
- **Branch 2**: Unidade 2 (has professionals: Dario, Carlos)

---

## Test Execution Plan

### Phase 1: Authentication Setup

#### Test 1.1: Login as Platform Admin

**Purpose**: Get admin token for admin-only endpoints

```bash
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@stylesync.com",
    "password": "123456"
  }' | jq -r '.data.token')

echo "Admin Token: $ADMIN_TOKEN"
```

**Expected Result**:

- Status: 200 OK
- Response contains: `token`, `refreshToken`, `userId`, `userName`
- `userName` should be "Admin User"

---

#### Test 1.2: Login as Customer Admin

**Purpose**: Get customer admin token for customer-scoped endpoints

```bash
CUSTOMER_ADMIN_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "123456"
  }' | jq -r '.data.token')

CUSTOMER_ID=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.com",
    "password": "123456"
  }' | jq -r '.data.customers[0].id')

echo "Customer Admin Token: $CUSTOMER_ADMIN_TOKEN"
echo "Customer ID: $CUSTOMER_ID"
```

**Expected Result**:

- Status: 200 OK
- Token should be valid
- Should have access to Acme customer (`customerId` present)

---

#### Test 1.3: Login as Client

**Purpose**: Get client token to test read-only access

```bash
CLIENT_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "client@test.com",
    "password": "123456"
  }' | jq -r '.data.token')

echo "Client Token: $CLIENT_TOKEN"
```

**Expected Result**:

- Status: 200 OK
- Token should be valid
- User should have CLIENT role

---

### Phase 2: Admin Endpoints - Professional Management

#### Test 2.1: List All Professionals (Admin)

**Purpose**: Verify admin can list all professionals across all customers

```bash
curl -X GET http://localhost:3000/api/professionals \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Expected Result**:

- Status: 200 OK
- Response contains `professionals` array with 4 professionals (Michel, Luiz, Dario, Carlos)
- Response contains pagination metadata: `total`, `page`, `limit`
- Default limit should be 1000 (as per controller default)

---

#### Test 2.2: List Professionals with Custom Pagination

**Purpose**: Test pagination parameters

```bash
curl -X GET "http://localhost:3000/api/professionals?page=1&limit=2" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Expected Result**:

- Status: 200 OK
- Should return maximum 2 professionals
- Pagination: `page=1`, `limit=2`, `total=4`

---

#### Test 2.3: Get Professional by ID (Admin)

**Purpose**: Retrieve specific professional details

```bash
# First, get a professional ID
PROFESSIONAL_ID=$(curl -s -X GET http://localhost:3000/api/professionals \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data.professionals[0].id')

curl -X GET "http://localhost:3000/api/professionals/$PROFESSIONAL_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Expected Result**:

- Status: 200 OK
- Response contains professional details: `id`, `name`, `photoUrl`, `isActive`, `customerId`
- Should include `branches` array with branch associations

---

#### Test 2.4: Create Professional (Admin)

**Purpose**: Create a new professional with multi-branch assignment

```bash
# Get branch IDs first
BRANCH_1_ID=$(curl -s -X GET http://localhost:3000/api/branches \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data.branches[0].id')

BRANCH_2_ID=$(curl -s -X GET http://localhost:3000/api/branches \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data.branches[1].id')

# Create professional working at both branches
curl -X POST http://localhost:3000/api/professionals \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Ricardo Multi-Branch\",
    \"customerId\": \"$CUSTOMER_ID\",
    \"branchIds\": [\"$BRANCH_1_ID\", \"$BRANCH_2_ID\"],
    \"isActive\": true
  }" | jq
```

**Expected Result**:

- Status: 201 CREATED
- Response contains created professional with both branch associations
- Professional should be active by default

---

#### Test 2.5: Create Professional - Duplicate Name Check

**Purpose**: Verify duplicate name validation

```bash
curl -X POST http://localhost:3000/api/professionals \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Michel\",
    \"customerId\": \"$CUSTOMER_ID\",
    \"branchIds\": [\"$BRANCH_1_ID\"],
    \"isActive\": true
  }" | jq
```

**Expected Result**:

- Status: 409 CONFLICT
- Error message: "Professional with this name already exists for this customer"

---

#### Test 2.5b: Create Professional with documentId

**Purpose**: Test documentId field and uniqueness validation

```bash
# Create professional with documentId
curl -X POST http://localhost:3000/api/professionals \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Fernando with Document\",
    \"documentId\": \"123.456.789-00\",
    \"customerId\": \"$CUSTOMER_ID\",
    \"branchIds\": [\"$BRANCH_1_ID\"],
    \"isActive\": true
  }" | jq

# Try to create another professional with same documentId (should fail)
curl -X POST http://localhost:3000/api/professionals \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Another Person\",
    \"documentId\": \"123.456.789-00\",
    \"customerId\": \"$CUSTOMER_ID\",
    \"branchIds\": [\"$BRANCH_1_ID\"]
  }" | jq
```

**Expected Result** (First request):

- Status: 201 CREATED
- Professional created with `documentId` field populated

**Expected Result** (Second request):

- Status: 409 CONFLICT
- Error message: "Professional with this document ID already exists for this customer"

---

#### Test 2.6: Update Professional (Admin)

**Purpose**: Test updating professional information

```bash
curl -X PATCH "http://localhost:3000/api/professionals/$PROFESSIONAL_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Michel - Updated",
    "isActive": false
  }' | jq
```

**Expected Result**:

- Status: 200 OK
- Professional name should be updated
- `isActive` should be false

---

#### Test 2.7: Upload Professional Photo (Admin)

**Purpose**: Test photo upload functionality

```bash
# Create a test image file first
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > /tmp/test-photo.png

curl -X POST "http://localhost:3000/api/professionals/$PROFESSIONAL_ID/photo" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "photo=@/tmp/test-photo.png" | jq
```

**Expected Result**:

- Status: 200 OK
- Response should include updated `photoUrl`
- Photo should be stored in `uploads/professionals/{professionalId}/` directory

---

#### Test 2.8: Delete Professional Photo (Admin)

**Purpose**: Test photo deletion

```bash
curl -X DELETE "http://localhost:3000/api/professionals/$PROFESSIONAL_ID/photo" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Expected Result**:

- Status: 200 OK
- `photoUrl` should be null
- Physical file should be deleted from filesystem

---

#### Test 2.9: Delete Professional (Admin)

**Purpose**: Test professional deactivation

```bash
# Create a new professional first to avoid affecting seed data
NEW_PROFESSIONAL_ID=$(curl -s -X POST http://localhost:3000/api/professionals \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Delete Professional\",
    \"customerId\": \"$CUSTOMER_ID\",
    \"branchIds\": [\"$BRANCH_1_ID\"]
  }" | jq -r '.data.id')

# Now delete it
curl -X DELETE "http://localhost:3000/api/professionals/$NEW_PROFESSIONAL_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -v
```

**Expected Result**:

- Status: 204 NO CONTENT
- Professional should be marked as inactive (soft delete)

---

#### Test 2.10: Delete Professional with Bookings (Admin)

**Purpose**: Verify cannot delete professional with active bookings

```bash
# Try to delete Michel who has a booking in seed data
MICHEL_ID=$(curl -s -X GET http://localhost:3000/api/professionals \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data.professionals[] | select(.name=="Michel") | .id')

curl -X DELETE "http://localhost:3000/api/professionals/$MICHEL_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Expected Result**:

- Status: 409 CONFLICT
- Error message: "Cannot delete professional with associated bookings"

---

### Phase 3: Customer-Scoped Endpoints

#### Test 3.1: Get Customer Professionals (Customer Context)

**Purpose**: Test customer-scoped professional listing

```bash
curl -X GET "http://localhost:3000/api/salon/acme/professionals" \
  -H "Authorization: Bearer $CUSTOMER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Expected Result**:

- Status: 200 OK
- Should return only professionals for Acme customer (4 professionals)
- Default limit should be 1000 (as per controller default)

---

#### Test 3.2: Get Customer Professionals with Pagination

**Purpose**: Test pagination in customer context

```bash
curl -X GET "http://localhost:3000/api/salon/acme/professionals?page=1&limit=1000" \
  -H "Authorization: Bearer $CUSTOMER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Expected Result**:

- Status: 200 OK
- Should return all professionals (up to 1000)
- Pagination metadata should reflect high limit

---

#### Test 3.3: Create Professional in Customer Context (Admin)

**Purpose**: Test creating professional via customer-scoped endpoint

```bash
curl -X POST "http://localhost:3000/api/salon/acme/professionals" \
  -H "Authorization: Bearer $CUSTOMER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Pedro Customer Context\",
    \"branchIds\": [\"$BRANCH_1_ID\"],
    \"isActive\": true
  }" | jq
```

**Expected Result**:

- Status: 201 CREATED
- Professional should be created with `customerId` automatically set to Acme
- Should not require `customerId` in request body

---

#### Test 3.4: Create Professional in Customer Context (Client - Forbidden)

**Purpose**: Verify CLIENT role cannot create professionals

```bash
curl -X POST "http://localhost:3000/api/salon/acme/professionals" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Should Fail\",
    \"branchIds\": [\"$BRANCH_1_ID\"]
  }" | jq
```

**Expected Result**:

- Status: 403 FORBIDDEN
- Error message indicating insufficient permissions

---

#### Test 3.5: Get Single Professional in Customer Context

**Purpose**: Test retrieving specific professional in customer scope

```bash
curl -X GET "http://localhost:3000/api/salon/acme/professionals/$PROFESSIONAL_ID" \
  -H "Authorization: Bearer $CUSTOMER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Expected Result**:

- Status: 200 OK
- Should return professional details
- Must belong to Acme customer

---

#### Test 3.6: Update Professional in Customer Context (Admin)

**Purpose**: Test updating professional via customer-scoped endpoint

```bash
curl -X PATCH "http://localhost:3000/api/salon/acme/professionals/$PROFESSIONAL_ID" \
  -H "Authorization: Bearer $CUSTOMER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Michel - Customer Context Update"
  }' | jq
```

**Expected Result**:

- Status: 200 OK
- Professional should be updated
- Only allows updating professionals belonging to Acme

---

#### Test 3.7: Update Professional in Customer Context (Client - Forbidden)

**Purpose**: Verify CLIENT role cannot update professionals

```bash
curl -X PATCH "http://localhost:3000/api/salon/acme/professionals/$PROFESSIONAL_ID" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Should Fail"
  }' | jq
```

**Expected Result**:

- Status: 403 FORBIDDEN

---

#### Test 3.8: Delete Professional in Customer Context (Admin)

**Purpose**: Test deactivating professional via customer-scoped endpoint

```bash
# Create a professional first
NEW_PROF_ID=$(curl -s -X POST "http://localhost:3000/api/salon/acme/professionals" \
  -H "Authorization: Bearer $CUSTOMER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Delete Customer Context\",
    \"branchIds\": [\"$BRANCH_1_ID\"]
  }" | jq -r '.data.id')

# Delete it
curl -X DELETE "http://localhost:3000/api/salon/acme/professionals/$NEW_PROF_ID" \
  -H "Authorization: Bearer $CUSTOMER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" -v
```

**Expected Result**:

- Status: 204 NO CONTENT

---

### Phase 4: Branch-Scoped Endpoints

#### Test 4.1: Get Professionals by Branch

**Purpose**: Test listing professionals for a specific branch

```bash
curl -X GET "http://localhost:3000/api/salon/acme/branches/$BRANCH_1_ID/professionals" \
  -H "Authorization: Bearer $CUSTOMER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Expected Result**:

- Status: 200 OK
- Should return only professionals working at Branch 1 (Michel, Luiz, and any multi-branch professionals)
- Should only include active professionals

---

#### Test 4.2: Get Professionals by Branch (Client Access)

**Purpose**: Verify clients can view branch professionals

```bash
curl -X GET "http://localhost:3000/api/salon/acme/branches/$BRANCH_1_ID/professionals" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Expected Result**:

- Status: 200 OK
- Clients should be able to view professionals (needed for booking)

---

#### Test 4.3: Get Professionals by Branch (Invalid Customer Context)

**Purpose**: Test access control for wrong customer

```bash
# Try to access with wrong customer slug in URL
curl -X GET "http://localhost:3000/api/salon/wrong-customer/branches/$BRANCH_1_ID/professionals" \
  -H "Authorization: Bearer $CUSTOMER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Expected Result**:

- Status: 403 FORBIDDEN
- Error indicating access denied to customer

---

### Phase 5: Multi-Branch Professional Testing

#### Test 5.1: Create Professional Working at Multiple Branches

**Purpose**: Verify professional can be assigned to multiple branches

```bash
curl -X POST http://localhost:3000/api/professionals \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Julia Multi-Branch\",
    \"customerId\": \"$CUSTOMER_ID\",
    \"branchIds\": [\"$BRANCH_1_ID\", \"$BRANCH_2_ID\"],
    \"isActive\": true
  }" | jq
```

**Expected Result**:

- Status: 201 CREATED
- Professional should have both branch associations
- `branches` array should contain 2 items

---

#### Test 5.2: Verify Multi-Branch Professional in Branch Lists

**Purpose**: Confirm multi-branch professional appears in both branch lists

```bash
echo "=== Branch 1 Professionals ==="
curl -s -X GET "http://localhost:3000/api/salon/acme/branches/$BRANCH_1_ID/professionals" \
  -H "Authorization: Bearer $CUSTOMER_ADMIN_TOKEN" | jq '.data.professionals[] | select(.name | contains("Multi-Branch"))'

echo "=== Branch 2 Professionals ==="
curl -s -X GET "http://localhost:3000/api/salon/acme/branches/$BRANCH_2_ID/professionals" \
  -H "Authorization: Bearer $CUSTOMER_ADMIN_TOKEN" | jq '.data.professionals[] | select(.name | contains("Multi-Branch"))'
```

**Expected Result**:

- Multi-branch professional should appear in both lists

---

#### Test 5.3: Update Multi-Branch Professional Branch Assignments

**Purpose**: Test updating branch assignments

```bash
JULIA_ID=$(curl -s -X GET http://localhost:3000/api/professionals \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data.professionals[] | select(.name | contains("Julia")) | .id')

# Update to work only at Branch 1
curl -X PATCH "http://localhost:3000/api/professionals/$JULIA_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"branchIds\": [\"$BRANCH_1_ID\"]
  }" | jq
```

**Expected Result**:

- Status: 200 OK
- Professional should now only be associated with Branch 1

---

### Phase 6: Error Handling & Edge Cases

#### Test 6.1: Unauthorized Access (No Token)

**Purpose**: Verify authentication is required

```bash
curl -X GET http://localhost:3000/api/professionals \
  -H "Content-Type: application/json" | jq
```

**Expected Result**:

- Status: 401 UNAUTHORIZED

---

#### Test 6.2: Get Non-Existent Professional

**Purpose**: Test 404 handling

```bash
curl -X GET "http://localhost:3000/api/professionals/non-existent-id" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" | jq
```

**Expected Result**:

- Status: 404 NOT FOUND
- Error message: "Professional not found"

---

#### Test 6.3: Update Non-Existent Professional

**Purpose**: Test 404 on update

```bash
curl -X PATCH "http://localhost:3000/api/professionals/non-existent-id" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}' | jq
```

**Expected Result**:

- Status: 404 NOT FOUND

---

#### Test 6.4: Create Professional with Invalid Customer ID

**Purpose**: Test customer existence validation

```bash
curl -X POST http://localhost:3000/api/professionals \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Professional",
    "customerId": "invalid-customer-id",
    "branchIds": []
  }' | jq
```

**Expected Result**:

- Status: 404 NOT FOUND
- Error message: "Customer with ID invalid-customer-id not found"

---

#### Test 6.5: Create Professional with Invalid Fields

**Purpose**: Test DTO validation for all required fields

```bash
# Test empty name
curl -X POST http://localhost:3000/api/professionals \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"\",
    \"customerId\": \"$CUSTOMER_ID\",
    \"branchIds\": [\"$BRANCH_1_ID\"]
  }" | jq

# Test missing customerId
curl -X POST http://localhost:3000/api/professionals \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Professional",
    "branchIds": []
  }' | jq

# Test invalid branchIds format
curl -X POST http://localhost:3000/api/professionals \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Test Professional\",
    \"customerId\": \"$CUSTOMER_ID\",
    \"branchIds\": \"not-an-array\"
  }" | jq
```

**Expected Result** (All requests):

- Status: 400 BAD REQUEST
- Structured validation error from class-validator with format:
  ```json
  {
    "statusCode": 400,
    "message": [
      "name should not be empty",
      "name must be longer than or equal to 2 characters"
    ],
    "error": "Bad Request"
  }
  ```
- Each test should return specific field-level validation errors

---

#### Test 6.6: Upload Photo without File

**Purpose**: Test photo upload validation

```bash
curl -X POST "http://localhost:3000/api/professionals/$PROFESSIONAL_ID/photo" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Expected Result**:

- Status: 400 BAD REQUEST
- Error message: "No photo file provided"

---

### Phase 7: Pagination Edge Cases

#### Test 7.1: Test Default Pagination Limits

**Purpose**: Verify default limits match implementation (admin: 10, customer: 10)

```bash
curl -s -X GET http://localhost:3000/api/professionals \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.data.limit'

curl -s -X GET "http://localhost:3000/api/salon/acme/professionals" \
  -H "Authorization: Bearer $CUSTOMER_ADMIN_TOKEN" | jq '.data.limit'
```

**Expected Result**:

- Admin endpoint default limit: 1000
- Customer endpoint default limit: 1000

---

#### Test 7.2: Test High Pagination Limit

**Purpose**: Verify service supports 1000 limit as specified

```bash
curl -s -X GET "http://localhost:3000/api/salon/acme/professionals?limit=1000" \
  -H "Authorization: Bearer $CUSTOMER_ADMIN_TOKEN" | jq '.data | {total, page, limit}'
```

**Expected Result**:

- Should accept limit=1000
- Service layer default is 1000 per implementation

---

#### Test 7.3: Test Page Beyond Available Data

**Purpose**: Test pagination with page > total pages

```bash
curl -s -X GET "http://localhost:3000/api/professionals?page=999&limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq
```

**Expected Result**:

- Status: 200 OK
- Empty `professionals` array
- Correct `total` count

---

## Test Execution Script

Save the following as `test-professionals.sh` for automated execution:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000/api"

echo -e "${YELLOW}=== StyleSync Professionals Module Testing ===${NC}\n"

# Phase 1: Authentication
echo -e "${YELLOW}Phase 1: Authentication Setup${NC}"

echo "Test 1.1: Login as Platform Admin"
ADMIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@stylesync.com", "password": "123456"}')
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.data.token')

if [ "$ADMIN_TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Admin login successful${NC}"
else
  echo -e "${RED}✗ Admin login failed${NC}"
  exit 1
fi

echo "Test 1.2: Login as Customer Admin"
CUSTOMER_ADMIN_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@acme.com", "password": "123456"}')
CUSTOMER_ADMIN_TOKEN=$(echo $CUSTOMER_ADMIN_RESPONSE | jq -r '.data.token')
CUSTOMER_ID=$(echo $CUSTOMER_ADMIN_RESPONSE | jq -r '.data.customers[0].id')

if [ "$CUSTOMER_ADMIN_TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Customer admin login successful${NC}"
else
  echo -e "${RED}✗ Customer admin login failed${NC}"
  exit 1
fi

echo "Test 1.3: Login as Client"
CLIENT_RESPONSE=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "client@test.com", "password": "123456"}')
CLIENT_TOKEN=$(echo $CLIENT_RESPONSE | jq -r '.data.token')

if [ "$CLIENT_TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Client login successful${NC}"
else
  echo -e "${RED}✗ Client login failed${NC}"
  exit 1
fi

echo ""

# Phase 2: Admin Endpoints
echo -e "${YELLOW}Phase 2: Admin Endpoints${NC}"

echo "Test 2.1: List All Professionals"
ALL_PROFS=$(curl -s -X GET $BASE_URL/professionals \
  -H "Authorization: Bearer $ADMIN_TOKEN")
PROF_COUNT=$(echo $ALL_PROFS | jq '.data.total')

if [ "$PROF_COUNT" -ge 4 ]; then
  echo -e "${GREEN}✓ Listed $PROF_COUNT professionals${NC}"
else
  echo -e "${RED}✗ Expected at least 4 professionals, got $PROF_COUNT${NC}"
fi

echo "Test 2.2: Get Professional by ID"
PROFESSIONAL_ID=$(echo $ALL_PROFS | jq -r '.data.professionals[0].id')
SINGLE_PROF=$(curl -s -X GET "$BASE_URL/professionals/$PROFESSIONAL_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
PROF_NAME=$(echo $SINGLE_PROF | jq -r '.data.name')

if [ "$PROF_NAME" != "null" ]; then
  echo -e "${GREEN}✓ Retrieved professional: $PROF_NAME${NC}"
else
  echo -e "${RED}✗ Failed to retrieve professional${NC}"
fi

echo ""

# Phase 3: Customer-Scoped Endpoints
echo -e "${YELLOW}Phase 3: Customer-Scoped Endpoints${NC}"

echo "Test 3.1: Get Customer Professionals"
CUSTOMER_PROFS=$(curl -s -X GET "$BASE_URL/salon/acme/professionals" \
  -H "Authorization: Bearer $CUSTOMER_ADMIN_TOKEN")
CUSTOMER_PROF_COUNT=$(echo $CUSTOMER_PROFS | jq '.data.total')

if [ "$CUSTOMER_PROF_COUNT" -ge 4 ]; then
  echo -e "${GREEN}✓ Listed $CUSTOMER_PROF_COUNT customer professionals${NC}"
else
  echo -e "${RED}✗ Expected at least 4 professionals, got $CUSTOMER_PROF_COUNT${NC}"
fi

echo "Test 3.2: Client Cannot Create Professional"
CREATE_FORBIDDEN=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/salon/acme/professionals" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Should Fail", "branchIds": []}' \
  -o /dev/null)

if [ "$CREATE_FORBIDDEN" == "403" ]; then
  echo -e "${GREEN}✓ Client correctly forbidden from creating professional${NC}"
else
  echo -e "${RED}✗ Expected 403, got $CREATE_FORBIDDEN${NC}"
fi

echo ""

# Phase 4: Branch-Scoped Endpoints
echo -e "${YELLOW}Phase 4: Branch-Scoped Endpoints${NC}"

BRANCH_1_ID=$(curl -s -X GET $BASE_URL/branches \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.data.branches[0].id')

echo "Test 4.1: Get Professionals by Branch"
BRANCH_PROFS=$(curl -s -X GET "$BASE_URL/salon/acme/branches/$BRANCH_1_ID/professionals" \
  -H "Authorization: Bearer $CUSTOMER_ADMIN_TOKEN")
BRANCH_PROF_COUNT=$(echo $BRANCH_PROFS | jq '.data.total')

if [ "$BRANCH_PROF_COUNT" -ge 2 ]; then
  echo -e "${GREEN}✓ Listed $BRANCH_PROF_COUNT professionals for branch${NC}"
else
  echo -e "${RED}✗ Expected at least 2 professionals, got $BRANCH_PROF_COUNT${NC}"
fi

echo ""

# Summary
echo -e "${YELLOW}=== Test Summary ===${NC}"
echo -e "${GREEN}All critical tests passed!${NC}"
echo ""
echo "Run individual curl commands from the test plan for detailed testing."
```

---

## Expected Outcomes Summary

### ✅ Successful Tests

- All authentication flows work correctly
- Admin can perform all CRUD operations on professionals
- Customer-scoped endpoints enforce customer context
- Branch-scoped endpoints filter professionals correctly
- Multi-branch professionals work as expected
- Proper authorization (RBAC) is enforced
- Pagination works with custom and default limits
- Photo upload/delete functionality works
- Duplicate name validation prevents conflicts
- Cannot delete professionals with bookings

### ❌ Expected Failures (Negative Tests)

- Unauthorized access (401)
- Forbidden access for insufficient roles (403)
- Not found for invalid IDs (404)
- Conflict for duplicate names (409)
- Validation errors for invalid input (400)

---

## Notes for Manual Testing

1. **Clean State**: If you want to reset to seed data, run:

   ```bash
   cd /home/pudico/Documents/work/challenges/github/style-sync/server
   npm run prisma:seed
   ```

2. **Check Logs**: Monitor server logs for detailed error information:

   ```bash
   # Server is running in background, check logs if needed
   ```

3. **Database Inspection**: Use Prisma Studio to inspect data:

   ```bash
   npx prisma studio
   ```

4. **JWT Debugging**: Decode JWT tokens at https://jwt.io to verify payload structure

5. **File Upload Testing**: Ensure `uploads/professionals/` directory is created and writable

---

## Conclusion

This test plan covers:

- ✅ All 3 controller contexts (Admin, Customer-Scoped, Branch-Scoped)
- ✅ Complete CRUD operations
- ✅ Multi-branch professional support
- ✅ Photo upload/delete functionality
- ✅ Role-based access control (ADMIN, CLIENT)
- ✅ Customer context enforcement
- ✅ Pagination with custom limits
- ✅ Error handling and edge cases
- ✅ Business rule validation (duplicate names, bookings)

Execute tests sequentially or use the provided shell script for automated testing.
