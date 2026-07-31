# Buzzer Admin Console

Buzzer Admin Console is an Angular-based administrative portal for managing sports, governing bodies, organizations, and participants. The application provides a nested data model for sports administration and supports features such as authentication, seed/reset workflows, search, detail views, and bulk import of sports data.

---

## Project Overview

This app is designed to help administrators:
- manage sports catalog data
- browse nested entities such as governing bodies and organizations
- review participants tied to each organization
- import large sport datasets from JSON files
- reset the catalogue back to the seeded dataset

The application is organized around a sports-first data model and uses Angular standalone components with local persistence through browser storage.

---

## Tech Stack

- Angular 19+
- Angular Material
- RxJS
- Tailwind CSS
- TypeScript
- LocalStorage for sample data persistence

---

## Prerequisites

Make sure you have the following installed:
- Node.js (LTS recommended)
- npm

---

## Setup

Clone the repository and install dependencies:

```bash
npm install
```

After installation, Husky hooks are enabled automatically via the package setup.

---

## Run the Application

Start the development server:

```bash
npm start
```

Then open:

```text
http://localhost:4200/
```

The app will automatically reload when source files change.

---

## Main Features

### Authentication
The app includes login and registration flows and protects app routes with an authentication guard.

### Sports Management
Users can:
- view a sports list
- search sports by name
- add, edit, and delete sports
- open detailed sport pages
- bulk import sports data from JSON

### Nested Administration
The data model supports:
- Sports
- Entities (governing bodies)
- Organizations
- Participants

### Seed Data & Reset
The app can restore its sample catalogue from the seed data via the reset workflow.

---

## Data Model

The core data structure is centered around sports, with nested relationships:

```ts
SportModel {
  id: string;
  name: string;
  emoji: string;
  color: string;
  createdAt: Date;
  updatedAt?: Date;
  entities: EntityModel[];
}
```

Entity, organization, and participant objects are stored as nested data inside the sports catalogue.

---

## Bulk Import

The sport list page supports importing sports data from a JSON file.

### Sample file
A sample payload is available at [src/app/sports/sample/sport-data.json](src/app/sports/sample/sport-data.json).

### Import format
The JSON should follow the sports data model and may include nested entities, organizations, and participants.

Example:

```json
[
  {
    "name": "Cricket",
    "emoji": "🏏",
    "color": "#FFB414",
    "entities": [
      {
        "name": "ICC",
        "logo": "🏏",
        "organizations": [
          {
            "name": "ICC World Cup",
            "logo": "https://example.com/icc-world-cup.png",
            "participants": [
              {
                "name": "India",
                "logo": "https://example.com/india.png"
              }
            ]
          }
        ]
      }
    ]
  }
]
```

### Import steps
1. Open the Sports page.
2. Click Bulk Import.
3. Select a JSON file matching the expected structure.
4. Review the imported records in the sports list.

---

## Build

Build the app for production:

```bash
npm run build
```

The output is generated in the dist folder.

---

## Testing

Run the test suite:

```bash
npm test
```

The project also includes component-level test coverage for key UI pieces.

---

## Code Quality & Contribution Guidelines

This repository uses:
- ESLint
- Prettier
- Husky
- commitlint

### Commit message format
Use Conventional Commits:

```text
<type>(<scope>): <subject>
```

Examples:
```bash
feat(sports): add bulk import support
fix(auth): resolve route redirect issue
chore(config): update Angular tooling
```

---

## Project Structure

A high-level overview of the main folders:

```text
src/
  app/
    auth/              # login and register flows
    common/            # shared UI, toast, breadcrumbs, layout
    core/              # guards, interceptors, shared services
    entities/          # entity-related models, components, resolver
    organizations/    # organization-related models, components, resolver
    participants/      # participant-related models and services
    sports/            # sport list/detail, models, sample data, services
```

---

## Notes

- The app currently stores sports data in browser local storage for demo and development purposes.
- The sample catalogue is seeded from the shared seed data service and can be reset from the UI.
- The current implementation is focused on administrative management rather than a full enterprise backend integration.
