import { z } from 'astro/zod';
import { getCollection } from 'astro:content';

// Fiches uniques (réglages et pages) : validées au build.
// À garder synchronisé avec public/admin/config.yml.

const seo = z.object({ titre: z.string().max(70).default(''), description: z.string().max(170).default('') });
const visuel = { image: z.string(), alt: z.string().min(5), legende: z.string().max(70).default('') };
const titre = { titreLigne1: z.string().max(40), titreLigne2: z.string().max(40).default('') };
const ligne = z.object({ libelle: z.string().max(30), valeur: z.string().max(120) });

const reglages = z.object({
  nom: z.string(),
  baseline: z.string(),
  telephone: z.string(),
  telephoneLien: z.string().default(''),
  email: z.string().email(),
  siege: z.object({ rue: z.string(), codePostal: z.string(), ville: z.string() }),
  etablissement: z.object({ ville: z.string(), departement: z.string() }),
  horaires: z.array(z.object({ jours: z.string(), heures: z.string(), ferme: z.boolean().default(false) })).min(1),
  formeJuridique: z.string(),
  capital: z.string(),
  siren: z.string(),
  rcs: z.string(),
  tva: z.string().default(''),
  directionPublication: z.string().default(''),
  hebergeur: z.string().default(''),
  formulaireEndpoint: z.string().default(''),
  dossierCapacites: z.string().default(''),
  lienLinkedin: z.string().default(''),
  chargement: z.array(z.string().max(40)).min(2).max(10),
  appel: z.object({ surtitre: z.string().max(60), ...titre, bouton: z.string().max(40) }),
  pied: z.object({ lignes: z.array(z.string().max(60)).max(4), mention: z.string().max(60) }),
  seo: z.object({ titre: z.string().min(10).max(70), description: z.string().min(50).max(170), imagePartage: z.string() }),
});

const accueil = z.object({
  seo,
  hero: z.object({
    titreLigne1: z.string().max(28),
    titreLigne2: z.string().max(28),
    texte: z.string().max(260),
    bouton: z.string().max(40),
    coordonnees: z.string().max(40).default(''),
    diapos: z.array(z.object(visuel)).min(1).max(6),
  }),
  bandeau: z.array(z.string().max(40)).min(2).max(10),
  manifeste: z.object({ surtitre: z.string().max(60), texte: z.string().max(260), bouton: z.string().max(40), ...visuel }),
  metiers: z.object({ ...titre, texte: z.string().max(200) }),
  chiffres: z.object({
    surtitre: z.string().max(60),
    ...titre,
    texte: z.string().max(260),
    items: z
      .array(z.object({ valeur: z.number().int().min(0), prefixe: z.string().default(''), suffixe: z.string().default(''), libelle: z.string().max(60) }))
      .length(6),
  }),
  terrain: z.object({ titre: z.string().max(40), bouton: z.string().max(40), projets: z.array(z.string()).length(3) }),
});

const savoirFaire = z.object({
  seo,
  intro: z.object({ surtitre: z.string().max(60), ...titre, texte: z.string().max(320), ...visuel }),
  metiers: z
    .array(
      z.object({
        nom: z.string().max(20),
        accroche: z.string().max(60),
        resume: z.string().max(110),
        texte: z.string().max(260),
        points: z.array(z.string().max(60)).min(2).max(5),
        pictogramme: z.enum(['platrerie', 'isolation', 'peinture', 'revetements']),
        ...visuel,
      }),
    )
    .length(4),
  piedMetier: z.string().max(60).default(''),
  rge: z.object({
    surtitre: z.string().max(60),
    ...titre,
    texte: z.string().max(400),
    qualifications: z.array(z.object({ nom: z.string().max(80), code: z.string().max(20) })).min(1).max(8),
    validite: z.string().max(90),
    ...visuel,
  }),
  methode: z.object({
    titre: z.string().max(40),
    texte: z.string().max(160),
    etapes: z.array(z.object({ titre: z.string().max(30), texte: z.string().max(160) })).length(5),
  }),
});

const realisationsPage = z.object({
  seo,
  intro: z.object({ surtitre: z.string().max(60), ...titre, texte: z.string().max(320), aide: z.string().max(80).default('') }),
  sansPhoto: z.string().max(80),
});

const atelier = z.object({
  seo,
  equipe: z.object({ surtitre: z.string().max(60), ...titre, texte: z.string().max(400), fiche: z.array(ligne).max(5), ...visuel }),
  direction: z.object({
    etiquette: z.string().max(30),
    nom: z.string().max(60),
    citation: z.string().max(200),
    texte: z.string().max(300),
    distinction: z.string().max(200).default(''),
    parcours: z.array(z.object({ date: z.string().max(14), texte: z.string().max(90) })).length(4),
    ...visuel,
  }),
  territoire: z.object({
    surtitre: z.string().max(60),
    ...titre,
    texte: z.string().max(400),
    legendeCarte: z.string().max(90),
    villes: z
      .array(
        z.object({
          nom: z.string().max(40),
          latitude: z.number(),
          longitude: z.number(),
          type: z.enum(['siege', 'etablissement', 'chantier']),
          etiquetteAGauche: z.boolean().default(false),
        }),
      )
      .min(1),
  }),
  comptoir: z.object({
    surtitre: z.string().max(60),
    ...titre,
    texte: z.string().max(400),
    image1: z.string(),
    alt1: z.string().min(5),
    image2: z.string(),
    alt2: z.string().min(5),
  }),
});

const contact = z.object({
  seo,
  surtitre: z.string().max(60),
  ...titre,
  texte: z.string().max(260),
  profils: z.array(z.string().max(60)).min(1),
  travaux: z.array(z.string().max(60)).min(1),
  aideMessage: z.string().max(80),
  bouton: z.string().max(40),
  boutonEnvoi: z.string().max(40),
  noteMessagerie: z.string().max(200),
  noteSecours: z.string().max(260),
  confirmationTitre: z.string().max(60),
  confirmationTexte: z.string().max(260),
});

/** Espaces insécables avant la ponctuation double et dans les guillemets, hors chemins et adresses. */
function typo<T>(v: T): T {
  if (typeof v === 'string') {
    if (v.startsWith('/') || v.startsWith('http') || v.includes('@')) return v;
    return v.replace(/ ([:;!?»])/g, ' $1').replace(/« /g, '« ') as T;
  }
  if (Array.isArray(v)) return v.map(typo) as T;
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, typo(x)])) as T;
  return v;
}

const bruts = import.meta.glob('/src/content/{site,pages}/*.json', { eager: true, import: 'default' });

function lire<S extends z.ZodTypeAny>(chemin: string, schema: S): z.infer<S> {
  const brut = bruts[chemin];
  if (!brut) throw new Error(`Fiche de contenu introuvable : ${chemin}`);
  const r = schema.safeParse(brut);
  if (!r.success) {
    const detail = r.error.issues.map((i) => `  · ${i.path.join('.')} : ${i.message}`).join('\n');
    throw new Error(`Contenu invalide dans ${chemin}\n${detail}`);
  }
  return typo(r.data);
}

export const site = lire('/src/content/site/reglages.json', reglages);
export const pages = {
  accueil: lire('/src/content/pages/accueil.json', accueil),
  savoirFaire: lire('/src/content/pages/savoir-faire.json', savoirFaire),
  realisations: lire('/src/content/pages/realisations.json', realisationsPage),
  atelier: lire('/src/content/pages/atelier.json', atelier),
  contact: lire('/src/content/pages/contact.json', contact),
};

export async function chantiers() {
  const tous = await getCollection('realisations', ({ data }) => data.publie);
  return tous
    .sort((a, b) => a.data.ordre - b.data.ordre)
    .map((c) => ({ id: c.id, ...typo(c.data) }));
}

export const pad = (n: number) => String(n).padStart(2, '0');
export const tel = () => 'tel:' + (site.telephoneLien || site.telephone.replace(/\s/g, ''));
