# Hanami — Site vitrine

Site vitrine d'un restaurant japonais fictif de quartier, **Hanami** (Paris 11e).
Statique, sans build : **HTML, CSS et JavaScript** natifs.

## Aperçu

Direction artistique zen et chaleureuse : papier washi, encre sumi, accent vermillon
(le rouge des torii). Mise en page éditoriale, animations légères au défilement,
version mobile soignée.

## Lancer le site

Aucune dépendance à installer. Ouvrez `index.html` dans un navigateur, ou servez le
dossier pour un rendu fidèle (les polices et la carte se chargent mieux via HTTP) :

```bash
# Python
python3 -m http.server 8000
# puis http://localhost:8000

# ou Node
npx serve .
```

## Structure

```
.
├── index.html              # Page unique (toutes les sections)
├── css/
│   └── styles.css          # Design system + responsive + reduced-motion
├── js/
│   └── main.js             # Nav, menu mobile, reveal, lightbox, formulaire
├── assets/
│   ├── favicon.svg
│   └── images/             # Photos optimisées en WebP
└── README.md
```

## Sections

Accueil (héros), Le restaurant, La carte, Spécialités, Galerie, Horaires & accès,
Réservation, Footer. Navigation par ancres avec lien actif au défilement.

## Choix techniques

- **Polices** : Shippori Mincho (titres, serif mincho japonais) + Zen Kaku Gothic New
  (texte), via Google Fonts. Icônes : Phosphor Icons (CDN).
- **Images** : photos libres (Unsplash) téléchargées puis converties en **WebP**
  (`cwebp`), redimensionnées par section. Total ≈ 1,2 Mo. `loading="lazy"` partout
  sauf le héros (`fetchpriority="high"` + `preload`).
- **Animations** : `IntersectionObserver` uniquement (aucun listener `scroll`),
  transitions `transform`/`opacity`. Tout est désactivé sous
  `prefers-reduced-motion`.
- **Carte** : iframe OpenStreetMap (sans clé d'API).
- **Formulaire** : validation côté client et message de confirmation. Pas de backend ;
  pour recevoir les demandes, brancher l'action du formulaire sur un service d'envoi.

## Personnalisation

Les couleurs, rayons, ombres et espacements sont centralisés dans les variables CSS
`:root` en haut de `css/styles.css`. Le contenu (carte, horaires, adresse) se modifie
directement dans `index.html`.

## Crédits images

Photographies sous licence Unsplash. Remplacez-les par vos propres visuels avant une
mise en production réelle.
