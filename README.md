# Atelier Dumas · site vitrine

Site statique construit avec [Astro](https://astro.build) et administré avec [Sveltia CMS](https://github.com/sveltia/sveltia-cms).
Cinq pages (Accueil, Savoir-faire, Réalisations, L'atelier, Contact), chacune découpée en écrans de la hauteur de la fenêtre, avec une transition de page à volets.

## Commandes

| Commande | Effet |
| --- | --- |
| `npm install` | Installe les dépendances |
| `npm run dev` | Serveur de développement sur `localhost:4321` |
| `npm run build` | Construit le site dans `dist/` |
| `npm run preview` | Sert le site construit |

À la mise en ligne, définir la variable d'environnement `SITE_URL` (ex. `https://www.exemple.fr`) : elle alimente les liens canoniques, l'image de partage et les données structurées.

## Organisation

| Dossier | Contenu |
| --- | --- |
| `src/pages/` | Une page par fichier, plus `merci`, `mentions-legales`, `confidentialite` et `404` |
| `src/layouts/Base.astro` | Coque commune : balises, en-tête, cadre, écran de chargement, appel final et pied de page |
| `src/components/` | En-tête, cadre et volets, figure, carte du territoire, schéma de plafond, pied de page |
| `src/styles/site.css` | Feuille de style unique (charte : noir, terracotta `#9C654E`, blanc, Arimo et DM Sans) |
| `src/scripts/site.ts` | Apparitions, galeries, formulaire, transition de page, chargement |
| `src/content/` | Tous les contenus, en JSON |
| `src/assets/uploads/` | Médiathèque du CMS |
| `src/assets/brand/` | Logo et symbole |
| `public/admin/` | Sveltia CMS |

## Contenus

| Rubrique dans le CMS | Fichiers | Nature |
| --- | --- | --- |
| Réglages du site | `src/content/site/reglages.json` | Fiche unique |
| Pages | `src/content/pages/*.json` | Cinq fiches uniques |
| Réalisations | `src/content/realisations/*.json` | Collection, une fiche par chantier |

La structure est définie à trois endroits, **à modifier ensemble** :

| Fichier | Rôle |
| --- | --- |
| `public/admin/config.yml` | Formulaires du CMS et limites vérifiées à la saisie |
| `src/lib/content.ts` | Validation au build des réglages et des pages |
| `src/content.config.ts` | Validation au build des réalisations |

Règles à connaître :

- **Limites de longueur.** Un contenu trop long fait échouer le build avec un message qui nomme le champ. La version en ligne reste alors inchangée.
- **Images.** Chemin de la forme `/src/assets/uploads/fichier.webp`. Une image absente de la médiathèque fait échouer le build.
- **Ponctuation.** Les espaces avant `: ; ! ?` et dans les guillemets sont rendues insécables automatiquement.
- **Réalisations.** La première photo sert de couverture. Une fiche sans photo affiche la mention « à venir », ou le schéma de plafond si la case est cochée. `publie` décoché masque la fiche sans la supprimer.
- **Accueil.** Les trois réalisations de « Sur le terrain » doivent être publiées et avoir au moins une photo.

## Formulaire de contact

Tant que `formulaireEndpoint` est vide dans les réglages, le formulaire ouvre la messagerie du visiteur avec un e-mail prérempli.
Une fois l'adresse d'un service de formulaire renseignée (Formspree, Web3Forms, Basin, ou une fonction maison), il envoie les champs en `POST` puis redirige vers `/merci/`. Un champ piège écarte les envois automatisés.

## Sveltia CMS

L'interface est servie sur `/admin/`. Elle écrit directement dans la branche `main` du dépôt GitHub : chaque enregistrement déclenche un build chez l'hébergeur.
La connexion demande un compte GitHub ayant accès au dépôt, et soit un jeton d'accès personnel, soit un service OAuth à déployer une fois (voir la documentation de Sveltia CMS).

## Transition de page

Le routeur client d'Astro (`<ClientRouter />`) charge les pages sans rechargement complet. `src/scripts/site.ts` s'y branche :

1. `astro:before-preparation` : les quatre volets du cadre se referment pendant que la page suivante se charge ;
2. échange du contenu, volets fermés ;
3. `astro:page-load` : les volets s'ouvrent sur la nouvelle page.

L'élément `.deco` est conservé d'une page à l'autre (`transition:persist`) pour que l'animation ne soit pas interrompue. La préférence système « mouvement réduit » désactive la transition, l'écran de chargement et les apparitions.

## À compléter

- `SITE_URL` et hébergement.
- Réglages : `hebergeur`, `formulaireEndpoint`, `dossierCapacites`, `lienLinkedin`.
- Mentions légales : assurance décennale. Données personnelles : durée de conservation, mesure d'audience.
- Réalisation « Salle socio-culturelle » d'Ydes : photos du chantier.
