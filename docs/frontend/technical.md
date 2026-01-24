# Frontend Technical Specifications

This document provides technical details about implementation patterns, API contracts, and integration strategies.

## 1. API Integration Pattern

All API calls must use the centralized `api` object pattern.

### 1.1. Query Example
```typescript
// src/api/branches/useGetBranches.ts
export const useGetBranches = () => {
  return useQuery<Branch[]>({
    endpoint: '/api/branches',
    queryKey: ['branches'],
    mockData: MOCK_BRANCHES,
  });
};
```

### 1.2. Mutation Example
```typescript
// src/api/auth/useLogin.ts
export const useLogin = () => {
  return useMutation<LoginResponse, LoginCredentials>({
    endpoint: '/api/auth/login',
    mutationKey: ['auth', 'login'],
  });
};
```

## 2. State Management Patterns

### 2.1. Global State (Zustand)
Used for data that survives navigation.
```typescript
// src/store/authStore.ts
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));
```

### 2.2. Local State (Constate)
Used for complex page logic (e.g., a booking flow with multiple steps).
```typescript
// src/hooks/Context.ts
const [LocalStateProvider, useLocalState, useLocalDispatch] = constate(
  useLocalReducer,
  (v) => v.localState,
  (v) => v.localDispatch
);
```

## 3. Form Validation Schema

We use **Zod** for all schema validations.
```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

## 4. Multi-tenancy & Theming

The application identifies the current tenant via the hostname or a URL parameter.

1. **Detection**: `useCustomerUrl` utility parses the URL.
2. **Fetching**: `useGetTheme` fetches colors/logos.
3. **Application**: `themeStore` applies styles:
   ```css
   :root {
     --primary: #c89350; /* Dynamically updated */
   }
   ```

## 5. Mocking Strategy

Mocking is handled by **MSW** for integration tests and a built-in `mockData` flag in our `useQuery` wrapper for development. This allows developers to work on the UI even when the backend is unavailable.

## 6. Authentication Flow

1. User submits credentials.
2. API returns JWT.
3. JWT is stored in `authStore` and persisted to `localStorage`.
4. All subsequent requests include `Authorization: Bearer <token>`.
5. On 401 response, `authStore` clears state and redirects to `/login`.
