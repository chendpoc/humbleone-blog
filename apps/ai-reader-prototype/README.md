# AI Reader Prototype

Throwaway Next.js prototype for the AI Builder Daily reader.

Prototype question:

> Can the three-pane reading surface `[Source Desk] [Today Timeline] [Newspaper Reader]` support a comfortable daily AI / Agent / Coding Agent information diet?

Run from the repository root:

```powershell
pnpm reader:dev
```

Variant URLs:

- `/?variant=A`
- `/?variant=B`
- `/?variant=C`

Boundaries:

- No real RSS/API fetching.
- No persistence.
- Typed mock data only.
- React / Next.js stays inside `apps/ai-reader-prototype`.
- Do not modify the VitePress blog theme from this app.

