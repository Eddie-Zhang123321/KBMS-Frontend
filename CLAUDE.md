# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 + Vite frontend application for a Knowledge Base Management System (KBMS). The application uses:
- Vue 3 with Composition API (`<script setup>`)
- Vue Router for routing
- Pinia for state management
- Element Plus for UI components
- Axios for HTTP requests
- Vite for build tooling

## Project Structure

```
src/
├── api/          # API service layer
├── assets/       # Static assets
├── components/   # Reusable components
├── constants/    # Application constants
├── layouts/      # Page layouts
├── router/       # Vue Router configuration
├── stores/       # Pinia stores
├── utils/        # Utility functions
├── views/        # Page components
├── App.vue       # Root component
└── main.js       # Application entry point
```

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture Overview

1. **Routing**: Uses Vue Router with role-based access control. Routes are defined in `src/router/index.js` with meta tags for authentication and role requirements.

2. **State Management**: Uses Pinia stores (`src/stores/`) for global state management, particularly for user authentication and tenant information.

3. **API Layer**: API calls are centralized in the `src/api/` directory with separate files for different domains (user, role, tenant, etc.). All API calls go through the HTTP utility in `src/utils/http.js` which provides:
   - Request/response interceptors
   - Automatic token injection
   - Error handling
   - Multi-tenant header management

4. **Authentication**: JWT-based authentication with token stored in localStorage. The user store handles login, logout, and user information retrieval.

5. **Role-Based Access Control**: Five role types defined in `src/constants/roles.js`:
   - USER: Regular user
   - KB_ADMIN: Knowledge base administrator
   - KB_OWNER: Knowledge base owner
   - SUPER_ADMIN: Super administrator
   - PLATFORM_ADMIN: Platform administrator

6. **Multi-Tenancy**: The application supports multi-tenancy with automatic tenant header injection for non-platform administrators.

## Key Components

- **Layouts**: `AuthLayout.vue` for authentication pages, `DefaultLayout.vue` for authenticated pages
- **HTTP Utility**: `src/utils/http.js` handles all API communication with interceptors
- **User Store**: `src/stores/user.js` manages authentication state and user information
- **Router**: `src/router/index.js` handles routing and authentication guards