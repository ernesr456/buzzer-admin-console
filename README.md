# BuzzerAdminConsole

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.2.

---

## Prerequisites & Setup

Before you start, ensure you have Node.js (LTS) installed. Clone the repository and install dependencies:

```bash
npm install
```

After installation, Git hooks (Husky) are automatically enabled via the `prepare` script. These hooks enforce linting and commit message rules before every commit and push.

---

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

---

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

---

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

---

## Linting & Code Quality

We use **ESLint** (via `ng lint`) to enforce consistent code style and catch errors early.

To run the linter manually:

```bash
ng lint
```

To automatically fix fixable issues:

```bash
ng lint --fix
```

**Note:** The CI/CD pipeline (branch protection rules) requires `ng lint` to pass successfully before any pull request can be merged to `staging` or `main`.

---

## Git Workflow & Commit Convention

This repository follows the **Angular Conventional Commits** standard. Commit messages **must** follow this format:

```
<type>(<scope>): <subject>
```

Common types include:
- `feat`: A new feature
- `fix`: A bug fix
- `chore`: Maintenance tasks (dependencies, configs, tooling)
- `docs`: Documentation updates
- `style`: Code style changes (formatting, no logic changes)
- `refactor`: Code refactoring
- `test`: Adding or updating tests

Example valid commit messages:
```bash
feat(auth): add login component using AWS Cognito
fix(dashboard): resolve memory leak in charts
chore(config): add rootDir to tsconfig.spec.json
```

**Enforcement:**  
- **Husky** prevents commits if linting fails.  
- **commitlint** validates your commit message format. If your message doesn't match the standard above, the commit will be rejected.

---


## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

---

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.