# Buzzer Admin Console

Buzzer Admin Console is an Angular-based administrative portal for managing sports, governing bodies, organizations, and participants. The application provides a nested data model for sports administration and supports features such as authentication, seed/reset workflows, search, detail views, and bulk import of sports data.

---

## Project Summary

A single-page Angular application built using standalone components and RxJS patterns to manage a hierarchical sports catalogue. The application connects to a live REST API backend (`https://buzzer-game-moderation-backend.vercel.app`) to persist and retrieve all data. No local database or in-browser storage (LocalStorage) is used. The UI uses Tailwind CSS and Angular Material for styling and components.

---

## Quick Start (recommended)

1. Clone the repository:

```bash
git clone https://github.com/ernesr456/buzzer-admin-console.git
cd buzzer-admin-console
```

2. Install dependencies. If you encounter peer-dependency errors during install, use the legacy peer deps option shown below (this is common with mixed Angular/third-party versions):

```bash
# Normal install
npm install

# OR, if you see peer dependency errors
npm install --legacy-peer-deps
```

> Note: Using `--legacy-peer-deps` tells npm to ignore peer dependency conflicts and proceed. Prefer to resolve peer conflicts for long-term stability; use this flag only when necessary.

3. Start the development server:

```bash
npm start
```

Open http://localhost:4200/ in your browser.

---

## Prerequisites & Recommendations

- Node.js: LTS (recommend v18+ or the version pinned in .nvmrc if present)
- npm: latest stable for your Node.js version
- If your environment uses Yarn or pnpm, the project is tested with npm; adapt commands accordingly.

---

## Available npm Scripts

- npm start — run dev server (ng serve)
- npm run build — build for production (output in dist/)
- npm test — run unit tests (Karma/Jasmine or configured test runner)
- npm run lint — run linters
- npm run format — apply Prettier (if configured)

Run `npm run` to list all defined scripts in package.json.

---

## Features

- Authentication (login/register) with route guards
- Sports list and detail views with nested routing for entities, organizations, participants
- Bulk import JSON/CSV of sports and nested entities
- Seed and reset sample catalogue via UI
- Client-side caching and counts for quick statistics

---

## Project Structure (high level)

src/
  app/
    auth/              # login and register flows
    common/            # shared UI, toast, breadcrumbs, layout
    core/              # guards, interceptors, shared services
    entities/          # entity-related models, components, resolver
    organizations/     # organization-related models, components, resolver
    participants/      # participant-related models and services
    sports/            # sport list/detail, models, sample data, services

---

## Bulk Import Details

- Supported formats: JSON (preferred) and CSV (simple flat imports).
- JSON can include nested entities -> organizations -> participants.
- Example payload and sample file are located at: `src/app/sports/sample/sport-data.json`.

Import steps:
1. Open Sports page
2. Click "Bulk Import"
3. Select the JSON/CSV file
4. The UI shows an importing indicator; after import finishes, the list refreshes

Performance: Hierarchical imports are performed sequentially; large imports may take time. Consider splitting very large files.

## Troubleshooting

- Peer dependency errors during install: use `npm install --legacy-peer-deps`.
- If the development server fails to start, ensure the correct Node version and clear node_modules then reinstall:

```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

- Routing issues where child routes don't render: ensure route parents either have a <router-outlet> or are declared without a component so child routes can render (see `src/app/app.routes.ts`).

---

## Testing & CI

- Unit tests: `npm test`
- Add or update tests under `src/app/**/*.(spec).ts` when changing functionality
- CI pipelines should run lint, tests, and build steps

---

## Contributing

- Fork the repo and create feature branches
- Follow Conventional Commits for commit messages
- Run lint and tests before opening a PR

---

## License & Authors

- Author: ernesr456 (repository owner)
- License: check LICENSE file in the repo (if present)

---

If any specific documentation section is missing or you'd like a README tailored to deployment (Docker, cloud hosting) or contributor onboarding, tell me which section to expand and it will be added.