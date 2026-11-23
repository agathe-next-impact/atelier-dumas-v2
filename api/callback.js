// GET /api/callback : retour de GitHub. Vérifie le jeton anti-CSRF, échange le code
// contre un jeton d'accès et le remet au CMS.
import { ERREURS, domaines, identifiants, lireCsrf, page } from './_lib/oauth.js';

export async function GET(requete) {
  const url = new URL(requete.url);
  const liste = domaines(requete);
  const { fournisseur, jeton } = lireCsrf(requete);
  if (fournisseur !== 'github') return page(ERREURS.fournisseur, liste);
  const code = url.searchParams.get('code'), state = url.searchParams.get('state');
  if (!code || !state) return page({ fournisseur, ...ERREURS.code }, liste);
  if (!jeton || state !== jeton) return page({ fournisseur, ...ERREURS.csrf }, liste);
  const { id, secret } = identifiants();
  if (!id || !secret) return page({ fournisseur, ...ERREURS.reglage }, liste);

  let reponse;
  try {
    reponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, client_id: id, client_secret: secret }),
    });
  } catch {
    return page({ fournisseur, ...ERREURS.jeton }, liste);
  }
  let donnees;
  try {
    donnees = await reponse.json();
  } catch {
    return page({ fournisseur, ...ERREURS.reponse }, liste);
  }
  return page({ fournisseur, token: donnees.access_token, error: donnees.error }, liste);
}
