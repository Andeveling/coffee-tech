# Repository Guidelines

## How to Use This Guide

- Start here for cross-project norms. Prowler is a monorepo with several components.
- Each component has an `AGENTS.md` file with specific guidelines (e.g., `api/AGENTS.md`, `ui/AGENTS.md`).
- Component docs override this file when guidance conflicts.
- No `src` folder — all code is in root, example: `app/`, `lib/`, `db/`.

## Available Skills

Use these skills for detailed patterns on-demand:

### Generic Skills (Any Project)

| Skill | Description | URL |
|-------|-------------|-----|
| `typescript` | Const types, flat interfaces, utility types | [SKILL.md](skills/typescript/SKILL.md) |
| `react-19` | No useMemo/useCallback, React Compiler | [SKILL.md](skills/react-19/SKILL.md) |
| `nextjs-16` | App Router, Server Actions, proxy.ts, streaming | [SKILL.md](skills/nextjs-16/SKILL.md) |
| `tailwind-4` | cn() utility, no var() in className | [SKILL.md](skills/tailwind-4/SKILL.md) |
| `zod-4` | New API (z.email(), z.uuid()) | [SKILL.md](skills/zod-4/SKILL.md) |
| `zustand-5` | Persist, selectors, slices | [SKILL.md](skills/zustand-5/SKILL.md) |
| `openspec-explore` | Explore sdd specs | [SKILL.md](skills/openspec-explore/SKILL.md) |
| `openspec-propose` | Propose sdd spec changes | [SKILL.md](skills/openspec-propose/SKILL.md) |
| `openspec-apply-change` | Apply sdd spec changes | [SKILL.md](skills/openspec-apply-change/SKILL.md) |
| `openspec-archive-change` | Archive sdd spec changes | [SKILL.md](skills/openspec-archive-change/SKILL.md) |
| `engram-memory-protocol` | Memory learn protocol | [SKILL.md](skills/engram-memory-protocol/SKILL.md) |



### Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action | Skill |
|--------|-------|
| App Router / Server Actions | `nextjs-16` |
| Creating Zod schemas | `zod-4` |
| Creating a git commit | `commit` |
| Using Zustand stores | `zustand-5` |
| Working on task | `tdd` |
| Working with Tailwind classes | `tailwind-4` |
| Writing React components | `react-19` |
| Writing TypeScript types/interfaces | `typescript` |

---

## Commit & Pull Request Guidelines

Follow conventional-commit style: `<type>[scope]: <description>`

**Types:** `feat`, `fix`, `docs`, `chore`, `perf`, `refactor`, `style`, `test`

Before creating a PR:
1. Complete checklist in `.github/pull_request_template.md`
2. Run all relevant tests and linters
3. Link screenshots for UI changes

## CLI tools

### mmx search
```bash
mmx search --help

Usage: mmx search <command> [flags]

Commands:
  search query  Search the web via MiniMax
  search web    Search the web via MiniMax
```

### ctx7
```bash
ctx7 --help
Usage: ctx7 [options] [command]
Context7 CLI - Manage AI coding skills and documentation context
Commands:
  library [options] <name> [query]    Resolve a library name to a Context7 library ID
  docs [options] <libraryId> <query>  Query documentation for a library
  skills|skill Manage AI coding skills
```
