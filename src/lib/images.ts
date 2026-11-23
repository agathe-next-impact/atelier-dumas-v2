import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

// Toutes les images de la médiathèque. Les fiches de contenu les désignent par
// leur chemin « /src/assets/uploads/fichier.webp », tel que l'écrit le CMS.
const fichiers = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/uploads/*.{webp,jpg,jpeg,png,avif}',
  { eager: true },
);

export function image(chemin: string): ImageMetadata {
  const trouve = fichiers[chemin];
  if (!trouve) {
    throw new Error(
      `Image introuvable dans la médiathèque : « ${chemin} ». Vérifiez que le fichier existe dans src/assets/uploads/.`,
    );
  }
  return trouve.default;
}

/** Adresse optimisée d'une image, pour les scripts qui changent d'image côté navigateur. */
export async function adresse(chemin: string, largeur = 1600): Promise<string> {
  const meta = image(chemin);
  const { src } = await getImage({ src: meta, width: Math.min(largeur, meta.width), format: 'webp' });
  return src;
}

export function portrait(chemin: string): boolean {
  const m = image(chemin);
  return m.height > m.width * 1.05;
}
