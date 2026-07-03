import { defineConfig } from "vitepress";
import { readFileSync } from "node:fs";

const REPO = "https://github.com/Codebucket-Solutions/PagiHelp";

// GitHub Pages serves under /PagiHelp/; override with DOCS_BASE (e.g. "/") for a domain root.
const base = process.env.DOCS_BASE || "/PagiHelp/";

// Version badge: live from the npm registry at build time, package.json as offline fallback.
const pkg = JSON.parse(
  readFileSync(new URL("../../../package.json", import.meta.url), "utf8")
);
async function libVersion() {
  try {
    const res = await fetch("https://registry.npmjs.org/pagi-help/latest", {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) return (await res.json()).version;
  } catch {}
  return pkg.version;
}
const version = await libVersion();

export default defineConfig({
  base,
  title: "PagiHelp",
  description:
    "Pagination query builder for MySQL and PostgreSQL — filters, search, sorting, unions, and cursor pagination.",
  lang: "en-US",
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: false,

  // Dark-first identity; the appearance toggle still offers light mode.
  appearance: "dark",

  markdown: {
    theme: { light: "github-light", dark: "tokyo-night" },
  },

  head: [
    ["link", { rel: "icon", href: `${base}favicon.svg`, type: "image/svg+xml" }],
    ["meta", { name: "theme-color", content: "#7c5cff" }],
    ["meta", { property: "og:title", content: "PagiHelp" }],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Pagination that compiles to SQL — for MySQL and PostgreSQL.",
      },
    ],
  ],

  themeConfig: {
    logo: "/logo.svg",

    nav: [
      { text: "Guide", link: "/guide/getting-started", activeMatch: "/guide/" },
      { text: "API", link: "/v2/overview", activeMatch: "/v2/" },
      { text: "Dialects", link: "/dialects/mysql", activeMatch: "/dialects/" },
      {
        text: "Examples",
        link: "/examples/filtering",
        activeMatch: "/examples/",
      },
      { text: "Demo", link: "/examples/sample-data" },
      { text: "Playground", link: "/playground" },
      { text: "Reference", link: "/api/reference" },
      {
        text: "v" + version,
        items: [
          { text: "npm", link: "https://www.npmjs.com/package/pagi-help" },
          { text: "Migrating to v2", link: "/guide/migration" },
        ],
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Installation", link: "/guide/installation" },
          ],
        },
        {
          text: "Migration",
          items: [
            { text: "Migrating to v2", link: "/guide/migration" },
          ],
        },
      ],
      "/v2/": [
        {
          text: "API",
          items: [
            { text: "Overview", link: "/v2/overview" },
            { text: "Constructor", link: "/v2/constructor" },
            { text: "paginate()", link: "/v2/paginate" },
            { text: "Cursor Pagination", link: "/v2/cursor-pagination" },
            {
              text: "Filters & Operators",
              link: "/v2/filters-and-operators",
            },
            { text: "Sorting", link: "/v2/sorting" },
            { text: "Search", link: "/v2/search" },
            { text: "Return Shape", link: "/v2/return-shape" },
          ],
        },
      ],
      "/dialects/": [
        {
          text: "Dialects",
          items: [
            { text: "MySQL", link: "/dialects/mysql" },
            { text: "PostgreSQL", link: "/dialects/postgres" },
          ],
        },
      ],
      "/examples/": [
        {
          text: "By Feature",
          items: [
            { text: "Filtering", link: "/examples/filtering" },
            { text: "Searching", link: "/examples/searching" },
            { text: "Sorting", link: "/examples/sorting" },
            { text: "Pagination", link: "/examples/pagination" },
          ],
        },
        {
          text: "By Query Shape",
          items: [
            { text: "Single Table", link: "/examples/single-table" },
            { text: "Joined Table", link: "/examples/joined-table" },
            { text: "Multi-Table Union", link: "/examples/multi-table-union" },
            { text: "Cursor Pagination", link: "/examples/cursor" },
          ],
        },
        {
          text: "Interactive",
          items: [
            { text: "Interactive Demo", link: "/examples/sample-data" },
            { text: "Playground", link: "/playground" },
          ],
        },
      ],
      "/api/": [
        {
          text: "Reference",
          items: [{ text: "API Reference", link: "/api/reference" }],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: REPO, ariaLabel: "GitHub repository" },
      {
        icon: {
          svg: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>npm</title><path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/></svg>',
        },
        link: "https://www.npmjs.com/package/pagi-help",
        ariaLabel: "npm package",
      },
    ],

    search: {
      provider: "local",
    },

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © Codebucket Solutions · Author: Abhinav Gautam",
    },
  },
});
