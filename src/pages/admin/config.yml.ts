import type { APIRoute } from 'astro';
import source from '../../cms/config.yml?raw';

// Sert /admin/config.yml à partir de src/cms/config.yml.
// En production, l'adresse du service de connexion GitHub est ajoutée automatiquement :
// ce sont les fonctions api/auth et api/callback, hébergées avec le site et exposées
// sur /auth et /callback par vercel.json.
// Sans adresse connue (développement local), le CMS travaille sur le dépôt local.
const domaineVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const base = (process.env.SITE_URL || (domaineVercel ? `https://${domaineVercel}` : '')).replace(/\/+$/, '');

export const GET: APIRoute = () => {
  let yaml: string = source;
  if (base) {
    yaml = yaml
      .replace(/^(\s*)branch: main$/m, `$1branch: main\n$1base_url: ${base}`)
      .replace(/^site_url: .*$/m, `site_url: ${base}`);
  }
  return new Response(yaml, { headers: { 'Content-Type': 'text/yaml; charset=utf-8' } });
};
