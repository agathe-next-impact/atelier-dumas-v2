import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Collection « Réalisations » : une fiche JSON par chantier.
// À garder synchronisé avec public/admin/config.yml.
const realisations = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/realisations' }),
  schema: z.object({
    titre: z.string().min(2).max(70),
    lieu: z.string().max(90),
    categorie: z.enum(['Public', 'Privé']),
    type: z.enum(['Construction', 'Rénovation', 'Réhabilitation', 'Aménagement']),
    periode: z.string().max(20),
    texte: z.string().max(420),
    fiche: z.array(z.object({ libelle: z.string().max(30), valeur: z.string().max(120) })).max(6).default([]),
    photos: z
      .array(z.object({ image: z.string(), legende: z.string().max(60), alt: z.string().min(5) }))
      .max(12)
      .default([]),
    schemaPlafond: z.boolean().default(false),
    ordre: z.number().int().default(10),
    publie: z.boolean().default(true),
  }),
});

export const collections = { realisations };
