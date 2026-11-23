// Comportements du site : apparitions, pagination, diaporama, galeries, formulaire,
// transition de page à volets et écran de chargement.
// Le routeur client d'Astro conserve ce script d'une page à l'autre :
// tout ce qui dépend du contenu de la page est relancé dans `initPage`.

const $ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) => c.querySelector<T>(s);
const $$ = <T extends Element = HTMLElement>(s: string, c: ParentNode = document) => Array.from(c.querySelectorAll<T>(s));
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (n: number) => (n < 10 ? '0' : '') + n;
const root = document.documentElement;

/* ------------------------------------------------------------------ titres découpés en mots */
function decouper(el: HTMLElement) {
  if (el.dataset.fait) return;
  el.dataset.fait = '1';
  let d = 0;
  const fill = el.hasAttribute('data-fill');
  (function walk(node: Node) {
    Array.from(node.childNodes).forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        (n.textContent || '').split(/([ \t\n\r]+)/).forEach((t) => {
          if (!t) return;
          if (/^[ \t\n\r]+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          const i = document.createElement('span');
          if (fill) i.className = 'f';
          i.style.setProperty('--d', String(d++)); i.textContent = t;
          w.appendChild(i); frag.appendChild(w);
        });
        node.replaceChild(frag, n);
      } else if (n.nodeType === 1 && (n as Element).tagName !== 'BR') walk(n);
    });
  })(el);
}

/* ------------------------------------------------------------------ apparitions */
function compter(panel: Element) {
  $$('[data-count]', panel).forEach((el) => {
    const to = Number(el.getAttribute('data-count'));
    if (reduce || el.dataset.fait) return;
    el.dataset.fait = '1';
    let t0: number | null = null;
    el.textContent = '0';
    requestAnimationFrame(function step(t) {
      if (t0 === null) t0 = t;
      const k = Math.min(1, (t - t0) / 1100);
      el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    });
  });
}
const io = new IntersectionObserver(
  (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); compter(e.target); io.unobserve(e.target); } }),
  { threshold: 0.22 },
);
function montrer(panel: Element | null) {
  if (!panel || panel.classList.contains('in')) return;
  io.unobserve(panel); panel.classList.add('in'); compter(panel);
}

/* ------------------------------------------------------------------ pagination des écrans */
let tick = false;
function paginer() {
  const pager = $('#pager'); if (!pager) return;
  const ps = $$('.view .panel'), y = window.scrollY + window.innerHeight / 2;
  let n = 1;
  ps.forEach((p, i) => { if (p.offsetTop <= y) n = i + 1; });
  pager.innerHTML = '<b>' + pad(n) + '</b> / ' + pad(ps.length);
}
window.addEventListener('scroll', () => { if (tick) return; tick = true; requestAnimationFrame(() => { paginer(); tick = false; }); }, { passive: true });

/* ------------------------------------------------------------------ diaporama d'accueil */
let diapo = 0;
function diaporama() {
  clearInterval(diapo);
  const imgs = $$<HTMLImageElement>('#stage img');
  if (reduce || imgs.length < 2) return;
  let i = 0;
  diapo = window.setInterval(() => {
    if (!document.body.contains(imgs[0])) { clearInterval(diapo); return; }
    if (window.scrollY > window.innerHeight * 0.6 || verrou) return;
    imgs[i].classList.remove('on'); i = (i + 1) % imgs.length; imgs[i].classList.add('on');
    $('#stagecap')!.textContent = imgs[i].getAttribute('data-cap');
    $('#stagen')!.textContent = '[Fig. ' + pad(i + 1) + ']';
  }, 5200);
}

/* ------------------------------------------------------------------ galeries de chantier */
interface Photo { src: string; legende: string; alt: string; portrait: boolean }
function galeries() {
  $$('.proj[data-galerie]').forEach((sec) => {
    const photos: Photo[] = JSON.parse(sec.dataset.galerie || '[]');
    const img = $<HTMLImageElement>('.main img', sec);
    if (!img || photos.length < 2) return;
    const ths = $$('.thumbs button', sec);
    let j = 0;
    img.addEventListener('load', () => img.classList.remove('out'));
    const voir = (n: number) => {
      n = (n + photos.length) % photos.length;
      if (n === j) return;
      j = n; img.classList.add('out');
      setTimeout(() => {
        img.alt = photos[j].alt; img.removeAttribute('srcset'); img.removeAttribute('sizes');
        img.classList.toggle('fit', photos[j].portrait); img.src = photos[j].src;
      }, reduce ? 0 : 220);
      $('.cap .n', sec)!.textContent = '[Fig. ' + pad(j + 1) + ' / ' + pad(photos.length) + ']';
      $('.cap .c', sec)!.textContent = photos[j].legende;
      ths.forEach((t, k) => t.classList.toggle('on', k === j));
      const t = ths[j], box = t.parentElement!;
      box.scrollLeft = t.offsetLeft - box.clientWidth / 2 + t.offsetWidth / 2;
    };
    ths.forEach((t) => t.addEventListener('click', () => voir(Number(t.dataset.j))));
    $$('.arrows button', sec).forEach((b) => b.addEventListener('click', () => voir(j + Number(b.dataset.dir))));
  });
}

/* ------------------------------------------------------------------ formulaire de contact */
function formulaire() {
  const f = $<HTMLFormElement>('#form'); if (!f) return;
  f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const note = $('#formnote')!;
    const v = (n: string) => ((f.elements.namedItem(n) as HTMLInputElement | null)?.value || '').trim();
    const erreur = (msg: string, champ: string) => { note.textContent = msg; note.style.color = 'var(--accent)'; (f.elements.namedItem(champ) as HTMLElement).focus(); };
    if (!v('nom')) return erreur('Indiquez au moins votre nom pour préparer le message.', 'nom');
    const endpoint = f.dataset.endpoint || '';
    if (endpoint) {
      if (!/^\S+@\S+\.\S+$/.test(v('email'))) return erreur('Indiquez une adresse e-mail valide pour que nous puissions vous répondre.', 'email');
      if (v('site_web')) return; // champ piège : envoi automatisé ignoré
      note.style.color = ''; note.textContent = 'Envoi en cours…';
      try {
        const r = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(f) });
        if (!r.ok) throw new Error(String(r.status));
        window.location.href = '/merci/';
      } catch {
        note.style.color = 'var(--accent)';
        note.textContent = "L'envoi n'a pas abouti. Écrivez à " + f.dataset.email + ' ou appelez le ' + f.dataset.telephone + '.';
      }
      return;
    }
    const corps = 'Bonjour,\n\n' + v('message') + '\n\nProfil : ' + v('profil') + '\nTravaux : ' + v('travaux') + '\nCommune du chantier : ' + v('commune') + '\nNom : ' + v('nom') + '\nTéléphone : ' + v('telephone');
    note.style.color = ''; note.textContent = f.dataset.secours || '';
    try {
      window.location.href = 'mailto:' + f.dataset.email + '?subject=' + encodeURIComponent('Demande de devis · ' + v('travaux')) + '&body=' + encodeURIComponent(corps);
    } catch { /* la note de secours reste affichée */ }
  });
}

/* ------------------------------------------------------------------ transition de page à volets
   Quatre volets opaques, portés par les quatre filets du cadre, se referment sur la page
   jusqu'à se croiser au centre, puis s'écartent vers les bords opposés.
   Filets et volets partagent la même transformation : ils ne peuvent pas se décaler.
   p = 0 au bord, 0.5 croisés au centre, 1 au bord opposé. */
let anims: Animation[] = [];
function viser(p0: number, p1: number, ms: number, ease: string): Promise<void> {
  const deco = $('.deco');
  if (!deco || !deco.animate) return Promise.resolve();
  const els = $$('.ln,.cv', deco);
  const W = deco.clientWidth - 1, H = deco.clientHeight - 1, anciennes = anims;
  const f = (p: number) => {
    const a = ['translateY(' + p * H + 'px)', 'translateY(' + -p * H + 'px)', 'translateX(' + p * W + 'px)', 'translateX(' + -p * W + 'px)'];
    return a.concat(a);
  };
  const A = f(p0), B = f(p1);
  deco.classList.toggle('closing', p1 <= 0.5); deco.classList.toggle('opening', p1 > 0.5);
  anims = els.map((l, i) => l.animate([{ transform: A[i] }, { transform: B[i] }], { duration: ms, easing: ease, fill: 'forwards' }));
  anciennes.forEach((a) => a.cancel());
  return new Promise((ok) => {
    anims[0].onfinish = () => {
      if (p1 === 1) { anims.forEach((a) => a.cancel()); anims = []; deco.classList.remove('opening'); }
      ok();
    };
  });
}
const fermer = (ms = 780) => viser(0, 0.5, ms, 'cubic-bezier(.65,0,.35,1)');
const ouvrir = () => viser(0.5, 1, 820, 'cubic-bezier(.16,1,.3,1)');

/* le défilement est neutralisé pendant la transition, sans retirer la barre de défilement */
let verrou = false, echange = false, lockY = 0;
function verrouiller() { lockY = window.scrollY; verrou = true; root.classList.add('moving'); }
function liberer() { verrou = false; root.classList.remove('moving'); }
(['wheel', 'touchmove'] as const).forEach((t) => window.addEventListener(t, (e) => { if (verrou) e.preventDefault(); }, { passive: false }));
window.addEventListener('keydown', (e) => {
  if (!verrou || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as Element).tagName)) return;
  if ([' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
});
window.addEventListener('scroll', () => { if (verrou && !echange && Math.abs(window.scrollY - lockY) > 1) window.scrollTo(0, lockY); });

/* ------------------------------------------------------------------ cycle de navigation */
let ferme = false;       // les volets sont croisés au centre, la page est masquée
let premiere = true;     // premier affichage : écran de chargement

function initPage() {
  $$('[data-split]').forEach(decouper);
  $$('.view .panel').forEach((p) => { if (!p.classList.contains('in')) io.observe(p); });
  diaporama(); galeries(); formulaire(); paginer();
  $('#burger')?.addEventListener('click', function (this: HTMLElement) {
    const o = $('#menu')!.classList.toggle('open'); this.setAttribute('aria-expanded', String(o));
  });
  // l'écran visible à l'arrivée (premier écran, ou ancre demandée) lance ses apparitions tout de suite
  const cible = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  montrer(cible && cible.classList.contains('panel') ? cible : $('.view .panel'));
}

document.addEventListener('astro:before-preparation', (ev) => {
  const e = ev as Event & { loader: () => Promise<void>; from: URL; to: URL };
  $('#menu')?.classList.remove('open');
  if (reduce || e.from.pathname === e.to.pathname) return;
  const charger = e.loader;
  e.loader = async () => {
    verrouiller();
    await Promise.all([charger(), fermer()]);
    ferme = true;
  };
});
document.addEventListener('astro:before-swap', () => { echange = true; });
document.addEventListener('astro:after-swap', () => { if (verrou) root.classList.add('moving'); });
document.addEventListener('astro:page-load', () => {
  initPage();
  if (premiere) { premiere = false; demarrer(); return; }
  lockY = window.scrollY; echange = false;
  if (!ferme) { liberer(); return; }
  ferme = false;
  requestAnimationFrame(() => requestAnimationFrame(() => { lockY = window.scrollY; ouvrir().then(liberer); }));
});

/* ------------------------------------------------------------------ chargement initial */
function demarrer() {
  const boot = $('#boot');
  if (!boot || boot.classList.contains('off')) return;
  if (reduce || !boot.animate) { boot.classList.add('off'); return; }
  const etapes: string[] = JSON.parse(boot.dataset.etapes || '[]');
  const pas = 130, ms = etapes.length * pas + 160;
  let fini = false;
  const fin = () => {
    if (fini) return; fini = true;
    boot.classList.add('off');
    setTimeout(() => { lockY = window.scrollY; ouvrir().then(liberer); }, 160);
  };
  verrouiller();
  fermer(ms).then(fin);
  let i = 0;
  const t = setInterval(() => {
    if (i >= etapes.length) { clearInterval(t); return; }
    $('#bootn')!.textContent = '00' + (i + 1); $('#bootstep')!.textContent = etapes[i]; i++;
    $('#bootpc')!.textContent = String(Math.round((i / etapes.length) * 100));
  }, pas);
  setTimeout(fin, ms + 900);
}
