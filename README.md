# ClassFlow

Professor and student workspace for CCSync. React 19, TypeScript, Vite 8, Tailwind CSS 4.

Local URL: http://localhost:5174

## Commands

```powershell
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## API configuration

```dotenv
VITE_APP_NAME="ClassFlow"
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_ADMIN_APP_URL=/admin
```

If `VITE_API_BASE_URL` is unset, the client uses the local API URL above. Set an
absolute API URL for other environments. The API CORS allowlist must include the
frontend origin.
`VITE_ADMIN_APP_URL` sets the Administrator link destination. Use the Admin app's
absolute deployment URL when it is hosted separately; `/admin` is the same-origin
default for deployments that route both applications through one host.

## Routes and authentication

```text
/                       Sign-in with Student/Professor role selection
/professor/login        Professor entry
/professor/dashboard    Professor workspace (guarded)
/professor/attendance   Professor attendance entry and session history (guarded)
/student/login          Student entry
/student/dashboard      Student workspace (guarded)
/student/attendance     Student read-only attendance history (guarded)
```

The root and both role-specific sign-in routes use the same sign-in page. Selecting a
role opens its role-specific sign-in route, which enforces that expected role.
Authentication uses
Sanctum HttpOnly session cookies, CSRF protection, session restoration, and server
logout. API errors during session restoration are shown with a retry action. No bearer
token or auth state is stored in localStorage.

Published schedules are available to assigned Professors and enrolled Students.
Professors can record and correct attendance for their assigned classes; Students can
review their own attendance history and summary. Student academic workflows beyond
attendance remain deferred.

See the repository [README](../../README.md), [authentication guide](../../docs/authentication.md),
and [architecture guide](../../docs/architecture.md).
