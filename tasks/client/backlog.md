# Backlog
## Phase 1 (Project structure)

### FFU-002: Create the Frontend documentation

1. Based on the 'server' structure and the base structure implemented before, generate:

- docs/frontend/architecture.mermaid: Frontend System architecture and component relationships
- docs/frontend/architecture.md: Descriptive Frontend System Architecture, guidelines and patterns
- docs/frontend/technical.md: Technical specifications
- docs/frontend/status.md: Frontend progress and state
- docs/frontend/implementationHistory.md: Implementation history

## Phase 2 (Screens)
**Goal**: Integrate customer branding into React application

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

