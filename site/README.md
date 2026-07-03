# PagiHelp Documentation Site

The documentation website for [`pagi-help`](https://github.com/Codebucket-Solutions/PagiHelp), built with [VitePress](https://vitepress.dev) — live at **https://codebucket-solutions.github.io/PagiHelp/**.

This folder is self-contained and is **not** published to npm with the library.

## Local development

```bash
cd site
npm install
npm run docs:dev      # start local dev server
npm run docs:build    # production build -> docs/.vitepress/dist
npm run docs:preview  # preview the production build
```

## Deployment

Pushing changes under `site/` to `master` triggers [`deploy-site.yml`](../.github/workflows/deploy-site.yml), which builds and publishes the site to GitHub Pages. The demo/playground bundle the published `pagi-help` npm package — Dependabot opens a PR when a new version is released, and merging it updates the live site.
