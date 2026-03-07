# Current Sprint Tasks

## Phase 1 (Project structure)

### FFU-003: Tanstack router
**Status**: 📋 Backlog  
**Priority**: High
**Dependencies**: NA

#### References
##### Tanstack Router routing
- [Tanstack Router Routing Concepts](https://tanstack.com/router/latest/docs/routing/routing-concepts)

##### Initial screens

- [X] Create a consistent structure for the system screens
   - [X] Screen components must be in 'client/src/screens'
      ├── routes
      │   ├── public
      │   |   ├── login.tsx
      │   |   ├── register.tsx
      │   ├── private
      │   |   ├── admin
      │   |   |   ├── index.tsx
      │   |   |   ├── bookings.tsx
      │   |   |   ├── club.tsx
      │   |   |   ├── plan.tsx
      │   |   |   ├── profile.tsx
      │   |   ├── user
      │   |   |   ├── index.tsx
      │   |   |   ├── profile.tsx
      ├── screens
      │   ├── Login
      │   |   ├── Login.tsx
      │   |   ├── index.tsx
      │   |   ├── components
      │   |   |   ├── components
      │   |   |   |   ├── Banner.tsx
      │   ├── Register
      │   |   ├── Register.tsx
      │   |   ├── index.tsx
      │   ├── Admin
      │   |   ├── Home
      │   |   |   ├── Home.tsx
      │   |   |   ├── index.tsx
      │   |   |   ├── components
      │   |   |   |   ├── BookingSummary
      │   |   |   |   |   ├── BookingSummary.tsx
      │   |   |   |   |   ├── NextSummaries.tsx
      │   |   |   |   |   ├── EstimatedProfit.tsx
      │   |   |   |   ├── Table.tsx
      │   |   ├── Bookings
      │   |   |   ├── Bookings.tsx
      │   |   |   ├── index.tsx
      │   |   |   ├── components
      │   |   |   |   ├── SelectedItem
      │   |   |   |   |   ├── SelectedItem.tsx
      ├── components
      │   ├── DateTime
      │   |   ├── DateTime.tsx
      │   |   ├── index.tsx
      │   ├── TextField
      │   |   ├── TextField.tsx
      │   |   ├── index.tsx
      │   ├── Button
      │   |   ├── Button.tsx
      │   |   ├── index.tsx

Where:
- '/' > [Home screen folder](client/src/screens/Home)
- '/login' > [Login screen folder](client/src/screens/Login)
- '/register' > [Register screen folder](client/src/screens/Register)

#### Implementation Checklist (based on the prototype)
- [X] Update the 'routes' folder structure to match with 'screens' folder
- [X] Move current screens components inside 'routes' folder to 'screens' folder. The 'routes' must be used only to manage routes
- [X] Setup the route settings if needed

#### 📊 Progress Tracking

##### In Progress 🚧
- None currently

#### Next Up 📋
- Review Code linter
- Improve tests structure

### FFU-004: Review Code linter

**Status**: 📋 Backlog  
**Priority**: High  
**Estimated Effort**: EVALUATE
**Dependencies**: EVALUATE

#### References
...

#### Feature goals

#### Implementation Checklist
- [ ] Runtime lint
- [ ] Fix or find code issues on commit

#### 📊 Progress Tracking

##### In Progress 🚧
- None currently

#### Next Up 📋
- Improve tests structure
- Create / update the Frontend documentation