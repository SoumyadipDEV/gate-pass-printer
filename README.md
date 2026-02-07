# Gate Pass Printer

Gate pass generation and printing tool for Suraksha Diagnostic Limited. The app lets authenticated users create numbered gate passes, print two-copy slips, manage previously issued passes, and export history to Excel.

## Features
- Email/password login (stored in `localStorage`) with protected routes.
- Guided gate pass form with dynamic line items, required fields, and preset “Through” options.
- Automatic gate pass numbering per day (`SDLGPDDMMYYYY-####`) based on the latest pass returned by the API.
- One-click print with two stacked copies and print-friendly styling.
- Dashboard to search/filter, view status, and select a pass for print.
- Edit existing passes (blocked when a pass is disabled).
- Enable/disable toggle with audit (modifiedBy/modifiedAt) updates.
- Date-range Excel export using `xlsx`.
- Create new login users from the dashboard modal.
- Toast feedback for success/error across flows.

## Tech Stack
- React 18 + TypeScript, Vite
- Tailwind CSS + shadcn/ui component primitives
- React Router v6, React Query (provider ready), React Hook Form helpers
- React-to-print for printable slips, XLSX for exports

## Project Structure (key files)
- `src/App.tsx` – router + providers (auth context, tooltips, toasters).
- `src/contexts/UserContext.tsx` – auth state persisted to `localStorage`.
- `src/components/ProtectedRoute.tsx` – guards authenticated routes.
- `src/pages/Login.tsx` – API-backed login (`/api/auth/login`), saves user.
- `src/pages/Index.tsx` – create & print gate pass; calls `GatePassService.createGatePass`.
- `src/pages/Dashboard.tsx` – list/search, print, edit, toggle enable, export, create user.
- `src/pages/EditGatePass.tsx` – update an existing pass (only if enabled).
- `src/components/GatePassForm.tsx` – reusable form with dynamic items.
- `src/components/GatePassPrint.tsx` – A4 two-copy printable layout.
- `src/services/gatepassService.ts` – API calls, gate pass number generation.
- `src/utils/gatepassNumber.ts` – numbering and date formatting helpers.

## API Expectations
All calls use `VITE_API_URL` as the base:
- `POST /api/auth/login` – returns `{ success, user: { email, userName } }`.
- `GET /api/gatepass` – returns `{ success, data: GatePass[] }`.
- `POST /api/gatepass` – create gate pass (uses `x-user` header).
- `PATCH /api/gatepass` – update gate pass (uses `x-user` header when provided).
- `DELETE /api/gatepassdelete/:id` – delete gate pass (wired but button disabled).
- `POST /api/createlogin` – create new user (body: `email`, `userName`, `password`, `isActive`).

## Environment
Create a `.env` (or `.env.local`) at the project root:
```
VITE_API_URL=http://localhost:3000
```
The repo includes an example pointing to `http://172.16.100.70:3000`; adjust to your backend.

## Prerequisites
- Node.js 18+ (tested with npm; bun/pnpm also possible but lockfiles for npm & bun exist).
- Access to the Gate Pass API described above.

## Run Locally
1) Install dependencies  
   ```bash
   npm install
   ```
2) Start the dev server  
   ```bash
   npm run dev
   ```  
   Vite will print a localhost URL (default http://localhost:5173).
3) Login with valid API credentials, then:
   - Create a gate pass at `/index` (auto-numbered, saved via API, printable).
   - Manage passes at `/dashboard` (search, export, toggle enable, edit).

## Build & Preview
```bash
npm run build     # outputs static assets to dist/
npm run preview   # serve the production build locally
```

## Quality Checks
```bash
npm run lint
npm test          # vitest (default sample test included)
```

## Printing & Export Notes
- Printing uses `react-to-print`; a hidden component renders two copies on A4. Browser print dialog handles printer selection.
- Excel export filters by created date (inclusive of selected range) and flattens line items.
- Disabled gate passes cannot be edited or printed until re-enabled from the dashboard.

## Authentication & State
- Successful login stores `user`, `username`, `email`, and `isAuthenticated` in `localStorage`.
- `ProtectedRoute` blocks `/index`, `/dashboard`, and `/edit/:id` when not authenticated.
- Logout clears stored auth and redirects to `/`.

## Folder Shortcuts
- Styles: `src/index.css`, `src/App.css`, Tailwind config in `tailwind.config.ts`.
- UI primitives: `src/components/ui/*` (shadcn-generated components).
- Assets: `src/assets/suraksha-logo.png`, `src/assets/suraksha-stamp.png`.

## Gate Pass Numbering
Number format: `SDLGP<DDMMYYYY>-####` where `####` is the next sequence for that day. Sequence is derived from the latest gate pass returned by `GET /api/gatepass`, then incremented.
