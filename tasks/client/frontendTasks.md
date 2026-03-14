# Current Sprint Tasks

## Phase 1 (Project structure)

### FFU-004: Review Code linter

**Status**: ✅ Done  
**Priority**: High  
**Estimated Effort**: S
**Dependencies**: None

#### References
- [vite-plugin-checker](https://github.com/fi3ework/vite-plugin-checker)
- [typescript-eslint typed linting](https://typescript-eslint.io/getting-started/typed-linting)

#### Feature goals
- Surface TypeScript and ESLint errors in the browser overlay and terminal during `vite dev`
- Ensure formatting violations (indentation, quotes, etc.) are reported as ESLint errors on commit

#### Implementation Checklist
- [x] Runtime lint (`vite-plugin-checker` with TypeScript + ESLint)
- [x] Fix or find code issues on commit (`eslint-plugin-prettier` + type-aware ESLint via `projectService`)

#### 📊 Progress Tracking

##### In Progress 🚧
- None currently

#### Next Up 📋
- Improve tests structure
- Create / update the Frontend documentation