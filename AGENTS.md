# AGENTS.md

## Project Rules

- This is the standalone personal blog repository `Facefall/humbleone-blog`.
- Do not merge this site into `stock-community-summary`.
- Use Node `24.14.0`. Before local work, run `nvm use`.
- Use `pnpm@9.15.5`.
- Do not add React for v1. VitePress custom UI should stay in Vue components.
- Do not commit secrets, OAuth client secrets, access tokens, or private notes.
- Do not rollback user changes unless explicitly requested.

## Content Model

- `posts/**/*.md` contains long-form articles.
- `notes/**/*.md` contains structured learning notes.
- Markdown is the source of truth for blog content.
- Keep public content suitable for a public GitHub Pages site.

## Comments

- Comments use Giscus and GitHub Discussions in `Facefall/humbleone-blog`.
- The configured category is `General`.
- Comments are enabled only for article and note pages.

## Verification

Run these before claiming success:

```powershell
nvm use
pnpm install --frozen-lockfile
pnpm build
pnpm serve
```
