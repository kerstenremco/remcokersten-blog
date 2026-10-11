// @ts-check

import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import tailwindcss from "@tailwindcss/vite";

import expressiveCode from "astro-expressive-code";
import remarkGithubAlerts from "remark-github-alerts";

// https://astro.build/config
export default defineConfig({
  site: "https://www.remcokersten.nl",
  integrations: [expressiveCode(), mdx(), sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkGithubAlerts],
    }),
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
