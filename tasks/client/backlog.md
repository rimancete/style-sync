# Backlog
## Phase 2 (Improve project structure)
### FFU-005: Improve test structure

**Status**: 📋 Backlog  
**Priority**: Medium  
**Estimated Effort**: EVALUATE
**Dependencies**: EVALUATE

#### References

#### Feature goals
- Based at the reference, create a robust test structure


#### Implementation Checklist
- [ ] Implement testRenderHelper
- [ ] MSW to simulate API requests
- [ ] Implement 'contract' integration test for login screen

#### 📊 Progress Tracking

##### In Progress 🚧
- None currently

#### Next Up 📋
- Create / update the Frontend documentation

### FFU-006: Create / update the Frontend documentation

**Status**: 📋 Backlog  
**Priority**: Medium  
**Estimated Effort**: EVALUATE
**Dependencies**: EVALUATE

#### References

#### Feature goals
- Based at the project, update the frontend documentation


#### Implementation Checklist
- [ ] Frontend System architecture and component relationships at [architecture.mermaid](../../docs/frontend/architecture.mermaid)
- [ ] Technical specifications at [technical.md](../../docs/frontend/technical.md)
- [ ] Prepar to integration test

#### 📊 Progress Tracking

##### In Progress 🚧
- None currently

#### Next Up 📋
- Create / update the Frontend documentation

### BUS-007: Register API integration

**Status**: 📋 Backlog  
**Priority**: High  
**Estimated Effort**: EVALUATE
**Dependencies**: EVALUATE

#### References

##### Prototype
- [Lovable](https://style-station-pro.lovable.app/)

##### Initial screens

- [ ] Screens
  - [ ] Login (with socials like gmail / instagram and account)
  - [ ] Register (user create account)
  - [ ] Confirm booking: page for service booking confirmation by the user
  - [ ] User area
      - Home:  Listing current user bookings
      - Bookings: Book a service
      - Club (for future): Salon plans like pay once a month and cut hair / beard 3 times during this period
      - Plan (for future): Evolve idea
      - Profile (Manage personal account [update password | name | phone number | end account])
  - [ ] Customer (salons)
      - [ ] Home               
        - Listing next salon bookings
          - Filters
            - Date
            - Branch
            - Professional
          - Table: Booking list
            - Summaritize finantial operations [Booked earned | Incoming earnings]
      - [ ] Bookings (Menu): Follow the server implementation services
         - Branches
         - Services
         - Professionals
         - Availability



##### Folder structure suggestion (inside 'client' folder)
```
client/
├── .env.example
├── public/
│   ├── favicon.ico
│   ├── login-icon-*.svg
│   └── login-topo-*.svg
└── src/
    ├── @types/global.d.ts
    ├── api/
    │   ├── api.ts
    │   ├── auth/          # useLogin, useRegister
    │   ├── bookings/
    │   ├── branches/
    │   ├── professionals/
    │   ├── services/
    │   └── theme/
    ├── components/
    │   ├── form-elements/
    │   ├── Icon/
    │   └── ui/            # shadcn: button, input, form, alert, toast, toaster
    ├── hooks/
    │   ├── useMutation/
    │   ├── useQuery/
    │   ├── use-toast.ts
    │   └── utils/         # request, errorTreatment, notify, restoreSession
    ├── i18n/
    ├── mocks/             # MSW handlers aligned to the NestJS contract
    ├── routes/
    ├── screens/
    │   ├── Login/
    │   ├── Register/
    │   ├── Admin/
    │   └── User/
    ├── store/             # authStore, themeStore, bookingStore
    ├── test/
    └── utils/             # env, jwt.util, customer-url.util
```

##### Tools
```
- shadcn/ui
- tailwindcss
- tanstack query
- tanstack router
- tanstack form/react-hook-form
- zod
- zustand
- vitest
- vite
- msw
- pnpm
- cypress/playwrright
- i18next
```

##### Initial business rules guideline
- Client can register and login
   - Admin (Customer salon) can login
- Admin can manage branches and services and its prices
- Client can view available time slots
- Client can book appointments

#### Implementation Checklist (based on the prototype)
- [ ] Update the current client libraries to lastest stable versions, including React, Typescript
- [ ] Setup the base libraries
- [ ] Add the 'client' folder structure as needed

#### 📊 Progress Tracking

##### In Progress 🚧
- None currently

#### Next Up 📋
- Create the Frontend documentation
- Create Login page

### FFU-008: Create the Frontend documentation

1. Based on the 'server' structure and the base structure implemented before, generate:

- docs/frontend/architecture.mermaid: Frontend System architecture and component relationships
- docs/frontend/architecture.md: Descriptive Frontend System Architecture, guidelines and patterns
- docs/frontend/technical.md: Technical specifications
- docs/frontend/status.md: Frontend progress and state
- docs/frontend/implementationHistory.md: Implementation history

## Phase 3 (Screens)
**Goal**: Integrate customer branding into React application

**Status**: 📋 Backlog (in progress)
**Priority**: High  
**Estimated Effort**: EVALUATE
**Dependencies**: EVALUATE

##### Step 2.4.6: Customer Context Provider

- [ ] Create React context for customer state management
- [ ] Implement customer config fetching from backend
- [ ] Add loading states and error boundaries
- [ ] URL parsing logic to extract customer slug

##### Step 2.4.7: Dynamic Branding Application

- [ ] Update document title based on customer config
- [ ] Apply CSS variables for theme colors
- [ ] Dynamic logo loading and display
- [ ] Fallback handling for missing assets

##### Step 2.4.8: Customer URL Integration

- [ ] URL change detection and customer context updates
- [ ] Default customer fallback for missing URL slugs
- [ ] Route protection based on customer context

##### Step 2.4.9: Frontend Testing & Validation

- [ ] Unit tests for customer context logic
- [ ] Integration tests for branding application
- [ ] E2E tests for customer identification flow

Just for note. The following tasks came from the backend tasks. Plan it better in the future

**Phase 5.6: Frontend Coordination** (⏳ Pending Frontend Work)
- [ ] **Task 6.1**: Update frontend to consume timezone info
  - API ready: `timezone`, `utcOffset`, `isoTimestamp` fields available
- [ ] **Task 6.2**: Implement user timezone detection
- [ ] **Task 6.3**: Add timezone display in UI
- [ ] **Task 6.4**: Test booking flow with timezone conversion

**Phase 5.7: Documentation Updates**
- [ ] **Task 7.2**: Update frontend integration guide

##### Key Technical Considerations

- URL Structure: `https://solutiondomain.com/{customer-url-slug}/`
- Customer URL slug: lowercase, hyphens, alphanumeric only (max 50 chars)
- Backend-first approach ensures API stability before frontend integration

