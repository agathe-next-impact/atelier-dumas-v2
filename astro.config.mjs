import { defineConfig } from 'astro/config';

// Renseigner SITE_URL (ex. https://www.exemple.fr) à la mise en ligne :
// l'adresse sert aux liens canoniques, à l'image de partage et aux données structurées.
export default defineConfig({
  site: process.env.SITE_URL || undefined,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
