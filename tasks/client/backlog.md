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
├── .husky
│   ├── commit-msg
│   ├── post-merge
│   ├── pre-commit
│   └── prepare-commit-msg
├── public
│   ├── favicon
│   │   ├── apple-touch-icon.png
│   │   ├── favicon-96x96.png
│   │   ├── favicon.ico
│   │   ├── favicon.svg
│   │   ├── site.webmanifest
│   │   ├── web-app-manifest-192x192.png
│   │   └── web-app-manifest-512x512.png
│   ├── logo
│   │   ├── logo_tp_green_main.svg
│   │   └── logo_tp_white.svg
│   ├── arrow-group-1-2.svg
│   ├── bg-topography.svg
│   ├── chart-group-1-1.svg
│   ├── chat-group-4-2.svg
│   ├── check-group-3-3.svg
│   ├── code-group-2-1.svg
│   ├── code-group-2-3.svg
│   ├── code-group-2-4.svg
│   ├── data-group-2-2.svg
│   ├── engine-group-1-3.svg
│   ├── field-group-3-1.svg
│   ├── fields-group-3-2.svg
│   ├── hands-group-4-1.svg
│   ├── logo-background.svg
│   ├── logo-bg-dark.svg
│   ├── phone-group-4-3.svg
│   ├── thumb.png
│   ├── topography-half-bg-bottom-darken.svg
│   ├── topography-half-bg-bottom.svg
│   ├── topography-half-bg-top-darken.svg
│   └── topography-half-bg-top.svg
├── src
│   ├── @types
│   │   └── global.d.ts
│   ├── api
│   │   ├── bancos
│   │   │   ├── types.ts
│   │   │   └── useGetBancos.ts
│   │   ├── empresas
│   │   │   ├── useGetEmpresaIndicadora.ts
│   │   │   └── useGetEmpresasIndicadoras.ts
│   │   ├── favoritos
│   │   │   └── useGetFavoritePages.ts
│   │   ├── grupoEmpresas
│   │   │   ├── types.ts
│   │   │   ├── useGetConsultar.ts
│   │   │   └── useGetGrupoEmpresas.ts
│   │   ├── notificacoes
│   │   │   └── useGetNotifications.ts
│   │   ├── api.ts
│   │   └── index.ts
│   ├── components
│   │   ├── App
│   │   │   ├── App.tsx
│   │   │   ├── global.css
│   │   │   └── index.ts
│   │   ├── Copyright
│   │   ├── CustomTooltip
│   │   ├── DataTable
│   │   │   ├── components
│   │   │   │   ├── DataTableColumnHeader.tsx
│   │   │   │   ├── DataTableExport.tsx
│   │   │   │   ├── DataTableMoreFilters.tsx
│   │   │   │   ├── DataTablePagination.tsx
│   │   │   │   ├── DataTableSearchInput.tsx
│   │   │   │   ├── DataTableSkeleton.tsx
│   │   │   │   ├── DataTableToolbar.tsx
│   │   │   │   ├── DataTableViewOptions.tsx
│   │   │   │   ├── GenericShortFilters.tsx
│   │   │   │   └── index.ts
│   │   │   ├── utils
│   │   │   │   ├── columnHelpers.tsx
│   │   │   │   └── index.ts
│   │   │   ├── DataTable.tsx
│   │   │   └── index.ts
│   │   ├── Environment
│   │   ├── FilterBuilder
│   │   ├── FormBuilder
│   │   ├── FormElements
│   │   │   ├── FormCombobox.tsx
│   │   │   ├── FormInput.tsx
│   │   │   ├── FormSelect.tsx
│   │   │   └── index.ts
│   │   ├── Icons
│   │   │   ├── ListIcons
│   │   │   │   ├── Ban.tsx
│   │   │   │   ├── Check.tsx
│   │   │   │   ├── ChevronLeft.tsx
│   │   │   │   ├── ChevronRight.tsx
│   │   │   │   ├── ChevronsUpDown.tsx
│   │   │   │   ├── CircleAlert.tsx
│   │   │   │   ├── Clock.tsx
│   │   │   │   ├── Contact.tsx
│   │   │   │   ├── Database.tsx
│   │   │   │   ├── Download.tsx
│   │   │   │   ├── Eye.tsx
│   │   │   │   ├── EyeClosed.tsx
│   │   │   │   ├── Filter.tsx
│   │   │   │   ├── Trash2.tsx
│   │   │   │   ├── Whatsapp.tsx
│   │   │   │   ├── X.tsx
│   │   │   │   └── index.tsx
│   │   │   ├── Icon.tsx
│   │   │   ├── IconProvider.tsx
│   │   │   └── index.ts
│   │   ├── InlineFilter
│   │   │   ├── Combobox
│   │   │   │   ├── Combobox.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Input
│   │   │   │   ├── Input.tsx
│   │   │   │   └── index.ts
│   │   │   ├── Select
│   │   │   │   ├── Select.tsx
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── Layout
│   │   │   ├── components
│   │   │   │   ├── FeedbackUser
│   │   │   │   ├── Header
│   │   │   │   │   ├── components
│   │   │   │   │   │   ├── Company
│   │   │   │   │   │   │   ├── Company.tsx
│   │   │   │   │   │   │   └── index.ts
│   │   │   │   │   │   ├── Notification
│   │   │   │   │   │   │   ├── components
│   │   │   │   │   │   │   │   ├── NotificationContent.tsx
│   │   │   │   │   │   │   │   ├── NotificationIcon.tsx
│   │   │   │   │   │   │   │   ├── NotificationItem.tsx
│   │   │   │   │   │   │   │   ├── NotificationList.tsx
│   │   │   │   │   │   │   │   └── index.ts
│   │   │   │   │   │   │   ├── Notification.tsx
│   │   │   │   │   │   │   └── index.ts
│   │   │   │   │   │   ├── Search
│   │   │   │   │   │   │   ├── components
│   │   │   │   │   │   │   │   ├── Favorites
│   │   │   │   │   │   │   │   │   ├── Favorites.tsx
│   │   │   │   │   │   │   │   │   └── index.ts
│   │   │   │   │   │   │   │   ├── Menus
│   │   │   │   │   │   │   │   │   ├── MenuGroup.tsx
│   │   │   │   │   │   │   │   │   ├── MenuItem.tsx
│   │   │   │   │   │   │   │   │   ├── Menus.tsx
│   │   │   │   │   │   │   │   │   ├── SubMenuItem.tsx
│   │   │   │   │   │   │   │   │   └── index.ts
│   │   │   │   │   │   │   │   ├── Recent.tsx
│   │   │   │   │   │   │   │   └── index.ts
│   │   │   │   │   │   │   ├── Search.tsx
│   │   │   │   │   │   │   └── index.ts
│   │   │   │   │   │   ├── User
│   │   │   │   │   │   │   ├── User.tsx
│   │   │   │   │   │   │   └── index.ts
│   │   │   │   │   │   ├── UsernameInitials
│   │   │   │   │   │   │   ├── UsernameInitials.tsx
│   │   │   │   │   │   │   └── index.ts
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── Sidebar
│   │   │   │   │   ├── components
│   │   │   │   │   │   ├── Menu
│   │   │   │   │   │   │   ├── Menu.tsx
│   │   │   │   │   │   │   └── index.ts
│   │   │   │   │   │   ├── RecentPages
│   │   │   │   │   │   │   ├── RecentPages.tsx
│   │   │   │   │   │   │   └── index.ts
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts
│   │   │   ├── Layout.tsx
│   │   │   └── index.ts
│   │   ├── Logo
│   │   │   ├── Logo.tsx
│   │   │   └── index.ts
│   │   ├── PageTitle
│   │   │   ├── PageTitle.tsx
│   │   │   └── index.ts
│   │   ├── RouteProvider
│   │   │   ├── components
│   │   │   │   └── PrivateRoute.tsx
│   │   │   ├── RouteProvider.tsx
│   │   │   └── index.ts
│   │   ├── Title
│   │   │   ├── Dialog.tsx
│   │   │   ├── Page.tsx
│   │   │   └── index.ts
│   │   ├── TopBanner
│   │   │   ├── TopBanner.tsx
│   │   │   └── index.ts
│   │   ├── Version
│   │   │   ├── Version.tsx
│   │   │   └── index.ts
│   │   ├── Wrapper
│   │   │   ├── PageWrapper.tsx
│   │   │   ├── TitleWrapper.tsx
│   │   │   └── index.ts
│   │   ├── ui
│   │   │   ├── accordion.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── command.tsx
│   │   │   ├── context-menu.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── hover-card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── menubar.tsx
│   │   │   ├── navigation-menu.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── resizable.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   └── tooltip.tsx
│   │   └── index.ts
│   ├── hooks
│   │   ├── useMutation
│   │   │   ├── index.ts
│   │   │   └── useMutation.ts
│   │   ├── useQuery
│   │   │   ├── index.ts
│   │   │   └── useQuery.ts
│   │   ├── utils
│   │   │   ├── errorTreatment.ts
│   │   │   ├── index.ts
│   │   │   └── request.ts
│   │   ├── Context.ts
│   │   ├── index.ts
│   │   ├── use-toast.ts
│   │   ├── useDataTable.ts
│   │   ├── useDialogParams.ts
│   │   ├── useFilterCount.ts
│   │   ├── useFilterParams.ts
│   │   ├── useFilteredData.ts
│   │   ├── useFilters.ts
│   │   ├── useRecentPages.ts
│   │   ├── useScreenSize.ts
│   │   └── useShortcutDialog.ts
│   ├── interfaces
│   │   ├── enum
│   │   │   ├── domains.enum.ts
│   │   │   └── index.ts
│   │   └── models
│   │       └── data
│   │           ├── icons.d.ts
│   │           ├── menus.d.ts
│   │           └── notifications.d.ts
│   ├── lib
│   │   ├── export.ts
│   │   └── utils.ts
│   ├── mocks
│   │   ├── index.ts
│   │   ├── mock_get_banco.ts
│   │   ├── mock_get_bancos.ts
│   │   ├── mock_get_consultar.ts
│   │   ├── mock_get_consultar_empresa.ts
│   │   ├── mock_get_empresa_indicadora.ts
│   │   ├── mock_get_empresas_grupo_empresa.ts
│   │   ├── mock_get_empresas_indicadoras.ts
│   │   ├── mock_get_favorite_pages.ts
│   │   ├── mock_get_grupo_empresas.ts
│   │   └── mock_get_notifications.ts
│   ├── routes
│   │   ├── cadastros.route.ts
│   │   ├── cadastrosGerais.routes.ts
│   │   ├── ferramentas.routes.ts
│   │   ├── index.ts
│   │   ├── menus.ts
│   │   └── public.routes.ts
│   ├── screens
│   │   ├── Bookings
│   │   │   ├── Branches
│   │   │   │   ├── components
│   │   │   │   │   ├── Edit
│   │   │   │   │   │   ├── Edit.tsx
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── Filters
│   │   │   │   │   │   ├── filters.config.ts
│   │   │   │   │   │   ├── filters.model.ts
│   │   │   │   │   │   ├── filters.schema.ts
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   └── Table
│   │   │   │   │       ├── Table.tsx
│   │   │   │   │       └── index.ts
│   │   │   │   ├── Branches.tsx
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── Home
│   │   │   ├── Home.tsx
│   │   │   └── index.ts
│   │   ├── Club
│   │   │   ├── Club.tsx
│   │   │   └── index.ts
│   │   ├── Plan
│   │   │   ├── Plan.tsx
│   │   │   └── index.ts
│   │   ├── Profile
│   │   │   ├── Profile.tsx
│   │   │   └── index.ts
│   │   └── Login
│   │       ├── components
│   │       │   ├── Banner
│   │       │   │   ├── components
│   │       │   │   │   ├── IconsFirstGroup.tsx
│   │       │   │   │   ├── IconsFourthGroup.tsx
│   │       │   │   │   ├── IconsSecondGroup.tsx
│   │       │   │   │   └── IconsThirdGroup.tsx
│   │       │   │   ├── Banner.tsx
│   │       │   │   └── index.ts
│   │       │   ├── DialogChangePassword
│   │       │   │   ├── DialogChangePassword.tsx
│   │       │   │   └── index.ts
│   │       │   └── index.ts
│   │       ├── Login.tsx
│   │       └── index.ts
│   │   └── Register
│   │       ├── components
│   │       │   ├── Banner
│   │       │   │   ├── components
│   │       │   │   │   ├── IconsFirstGroup.tsx
│   │       │   │   │   ├── IconsFourthGroup.tsx
│   │       │   │   │   ├── IconsSecondGroup.tsx
│   │       │   │   │   └── IconsThirdGroup.tsx
│   │       │   │   ├── Banner.tsx
│   │       │   │   └── index.ts
│   │       │   └── index.ts
│   │       ├── Register.tsx
│   │       └── index.ts
│   ├── store
│   │   ├── index.ts
│   │   ├── statusSidebar.ts
│   │   └── theme.ts
│   ├── utils
│   │   ├── animations.ts
│   │   ├── encode.ts
│   │   ├── env.ts
│   │   ├── getInitials.ts
│   │   ├── index.ts
│   │   ├── logger.ts
│   │   └── maskValue.ts
│   ├── main.tsx
│   ├── output.css
│   └── vite-env.d.ts
├── .editorconfig
├── .env.staging
├── .eslintrc.json
├── .gitattributes
├── .gitignore
├── .gitlab-ci.yml
├── .npmrc
├── .nvmrc
├── .prettierrc
├── README.md
├── commitlint.config.js
├── components.json
├── git-dev.key
├── index.html
├── output.css
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
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

