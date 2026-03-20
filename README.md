# ESC-GRPO Analytics

Interactive analytics dashboard for inspecting and visualizing ESC-GRPO rollout data. Built with React, TypeScript, and Vite.

## Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- npm >= 10

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

Load a JSONL file containing rollout data to begin inspection.

## Available Scripts

| Command                | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Start development server             |
| `npm run build`        | Type-check and build for production  |
| `npm run preview`      | Preview the production build locally |
| `npm run lint`         | Run ESLint                           |
| `npm run lint:fix`     | Run ESLint with auto-fix             |
| `npm run format`       | Format code with Prettier            |
| `npm run format:check` | Check formatting without writing     |
| `npm run typecheck`    | Run TypeScript type checking         |

## Code Quality

### Linting & Formatting

- **ESLint** — TypeScript and React linting via flat config (`eslint.config.js`)
- **Prettier** — Code formatting (`.prettierrc`)

### Pre-commit Hooks

[Husky](https://typicode.github.io/husky/) + [lint-staged](https://github.com/lint-staged/lint-staged) run automatically on `git commit`:

- `*.{ts,tsx}` — ESLint fix + Prettier
- `*.{json,css,md}` — Prettier

Hooks are installed automatically via the `prepare` script when you run `npm install`.

## Docker

Build and run the app in a container:

```bash
docker build -t esc-grpo-analytics .
docker run -p 8080:80 esc-grpo-analytics
```

Open [http://localhost:8080](http://localhost:8080).

The Dockerfile uses a multi-stage build:

1. **Build stage** — `node:20-alpine` installs dependencies and produces a production bundle
2. **Serve stage** — `nginx:alpine` serves the static files with SPA fallback routing

## CI/CD

GitHub Actions runs the following checks on every pull request to `main`:

1. **Lint** — `npm run lint`
2. **Format check** — `npm run format:check`
3. **Type-check** — `npm run typecheck`
4. **Build** — `npm run build`

See [`.github/workflows/pr.yml`](.github/workflows/pr.yml) for the workflow definition.

## Project Structure

```
src/
├── components/       # React components
│   ├── charts/       # Visualization components (heatmap, scatter, sparkline)
│   ├── layout/       # Layout and structural components
│   ├── sidebar/      # Sidebar navigation and filtering
│   ├── tabs/         # Tab content (Overview, Scaffold, Tokens, Group, Trends)
│   └── ui/           # Reusable UI primitives (Chip, Panel, Tooltip)
├── constants/        # Color palettes and metric configurations
├── context/          # React context providers (global app state)
├── hooks/            # Custom React hooks (data loading, filtering, settings)
├── utils/            # Utility functions (math, formatting, export)
├── types.ts          # TypeScript type definitions
├── App.tsx           # Root component
└── main.tsx          # Application entry point
```

## License

Private — not licensed for redistribution.
