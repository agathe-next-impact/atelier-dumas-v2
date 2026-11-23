// Service d'authentification GitHub pour Sveltia CMS, hébergé sur Vercel.
// Reprend le protocole du service officiel sveltia-cms-auth (fenêtre surgissante,
// jeton anti-CSRF en cookie, échange par postMessage), limité à GitHub.

const PORTEES_PERMISES = ['repo', 'public_repo', 'user', 'read:user', 'user:email'];
const PORTEE_PAR_DEFAUT = 'repo,user';
const COOKIE = 'csrf-token';

const echapper = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Domaines autorisés à obtenir un jeton. Sans ALLOWED_DOMAINS : uniquement le domaine du service lui-même. */
export function domaines(requete) {
  const liste = (process.env.ALLOWED_DOMAINS || '').split(',').map((d) => d.trim()).filter(Boolean);
  return liste.length ? liste : [new URL(requete.url).hostname];
}

const motif = (domaine) => new RegExp('^' + domaine.split('*').map(echapper).join('.+') + '$');
export const autorise = (hote, liste) => !!hote && liste.some((d) => motif(d).test(hote));

export function portee(demande) {
  const voulues = (demande || '').split(/[,\s]+/).filter(Boolean);
  if (!voulues.length || !voulues.every((p) => PORTEES_PERMISES.includes(p))) return PORTEE_PAR_DEFAUT;
  return voulues.join(',');
}

export const identifiants = () => ({ id: process.env.GITHUB_CLIENT_ID, secret: process.env.GITHUB_CLIENT_SECRET });

export const cookieCsrf = (jeton) => `${COOKIE}=github_${jeton}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax; Secure`;
export function lireCsrf(requete) {
  const m = (requete.headers.get('cookie') || '').match(/\bcsrf-token=([a-z-]+?)_([0-9a-f]{32})\b/);
  return m ? { fournisseur: m[1], jeton: m[2] } : {};
}

/**
 * Page renvoyée dans la fenêtre surgissante : elle remet le jeton (ou l'erreur) au CMS
 * par postMessage, uniquement vers une origine autorisée.
 */
export function page({ fournisseur = 'unknown', token, error, errorCode }, liste) {
  const etat = error ? 'error' : 'success';
  const contenu = error ? { provider: fournisseur, error, errorCode } : { provider: fournisseur, token };
  const donnees = JSON.stringify({ fournisseur, etat, contenu, liste, aJeton: !!token }).replace(/</g, '\\u003c');
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Connexion</title></head><body><script>
(() => {
  const d = ${donnees};
  const echapper = (s) => s.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
  const permis = (hote) => d.liste.some((p) => new RegExp('^' + p.split('*').map(echapper).join('.+') + '$').test(hote));
  window.addEventListener('message', ({ data, origin }) => {
    if (data !== 'authorizing:' + d.fournisseur) return;
    if (d.aJeton && !permis(new URL(origin).hostname)) return;
    window.opener?.postMessage('authorization:' + d.fournisseur + ':' + d.etat + ':' + JSON.stringify(d.contenu), origin);
  });
  window.opener?.postMessage('authorizing:' + d.fournisseur, '*');
})();
</script></body></html>`;
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-store',
      'Set-Cookie': `${COOKIE}=deleted; HttpOnly; Max-Age=0; Path=/; SameSite=Lax; Secure`,
    },
  });
}

export const ERREURS = {
  fournisseur: { error: 'Your Git backend is not supported by the authenticator.', errorCode: 'UNSUPPORTED_BACKEND' },
  domaine: { error: 'Your domain is not allowed to use the authenticator.', errorCode: 'UNSUPPORTED_DOMAIN' },
  reglage: { error: 'OAuth app client ID or secret is not configured.', errorCode: 'MISCONFIGURED_CLIENT' },
  code: { error: 'Failed to receive an authorization code. Please try again later.', errorCode: 'AUTH_CODE_REQUEST_FAILED' },
  csrf: { error: 'Potential CSRF attack detected. Authentication flow aborted.', errorCode: 'CSRF_DETECTED' },
  jeton: { error: 'Failed to request an access token. Please try again later.', errorCode: 'TOKEN_REQUEST_FAILED' },
  reponse: { error: 'Server responded with malformed data. Please try again later.', errorCode: 'MALFORMED_RESPONSE' },
};
