# Mossling

A Svelte SPA built with Vite+, TypeScript (@tsconfig/strictest), and Fallow static intelligence.

## Stack

- **Framework**: [Svelte 5](https://svelte.dev/) (SPA)
- **Build Tool**: [Vite](https://vite.dev/) + [Vite+](https://viteplus.dev/)
- **TypeScript**: [@tsconfig/strictest](https://www.npmjs.com/package/@tsconfig/strictest)
- **Static Intelligence**: [Fallow](https://docs.fallow.tools/)
- **Git Hooks**: [Husky](https://typicode.github.io/husky/)

## Scripts

| Command             | Description                    |
| ------------------- | ------------------------------ |
| `pnpm dev`          | Start dev server               |
| `pnpm build`        | Production build               |
| `pnpm preview`      | Preview production build       |
| `pnpm check`        | Type-check Svelte + TypeScript |
| `pnpm check:fallow` | Run Fallow static analysis     |
| `pnpm check:all`    | Run all checks                 |

## Pre-commit Checks

Husky runs `pnpm check:all` before every commit, which includes:

- Svelte type-checking (`svelte-check`)
- TypeScript node config check (`tsc`)
- Fallow static intelligence analysis

## Getting Started

```bash
pnpm install
pnpm dev
```

## Vite+ CLI

This project is compatible with the [Vite+](https://viteplus.dev/) unified toolchain:

```bash
vp dev      # dev server
vp check    # lint + format + type-check
vp build    # production build
vp test     # run tests
```
