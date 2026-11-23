// GET /api/auth : départ de la connexion. Vérifie le domaine demandeur, pose le jeton
// anti-CSRF et redirige vers la page d'autorisation de GitHub.
import { ERREURS, autorise, cookieCsrf, domaines, identifiants, page, portee } from './_lib/oauth.js';

export function GET(requete) {
  const url = new URL(requete.url);
  const liste = domaines(requete);
  if (url.searchParams.get('provider') !== 'github') return page(ERREURS.fournisseur, liste);
  const fournisseur = 'github';
  if (!autorise(url.searchParams.get('site_id'), liste)) return page({ fournisseur, ...ERREURS.domaine }, liste);
  const { id, secret } = identifiants();
  if (!id || !secret) return page({ fournisseur, ...ERREURS.reglage }, liste);

  const jeton = crypto.randomUUID().replaceAll('-', '');
  const cible = new URL('https://github.com/login/oauth/authorize');
  cible.search = new URLSearchParams({ client_id: id, scope: portee(url.searchParams.get('scope')), state: jeton }).toString();
  return new Response(null, {
    status: 302,
    headers: { Location: cible.href, 'Set-Cookie': cookieCsrf(jeton), 'Cache-Control': 'no-store' },
  });
}
