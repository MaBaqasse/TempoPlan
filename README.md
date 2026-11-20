# TempoPlan

Plateforme intelligente de gestion et d'optimisation du temps. Projet de fin de module Developpement Frontend (FST Marrakech).

## Demarrage

```bash
git clone <url-du-depot>
cd tempoplan
npm install
npm run dev
```

Copiez `.env.example` en `.env` si besoin. Ne committez jamais `.env` ni une cle API.

## Structure

- `src/pages` : une page par ecran ; `src/pages/Landing/sections` : sections de la landing
- `src/features` : un dossier par fonctionnalite du sujet (A a G + assistant)
- `src/components/ui` : composants partages (boutons, champs, cartes) ; toujours les reutiliser
- `src/lib` : logique pure sans React (planning, conflits, creneaux, priorite, parseur)
- `src/services` : seul endroit qui accede a localStorage (storage.js)
- `src/store` : etats globaux (Zustand)
- `src/styles` : theme Tailwind (couleurs, police, rayons)

## Repartition

| Personne | Modules |
|---|---|
| P1 | Landing, auth, socle (layouts, routes, composants ui), parametres, notifications |
| P2 | Donnees (storage.js), activites, conflits, suivi des progres, dashboard |
| P3 | Vues du planning, objectifs et score de priorite |
| P4 | Moteur de planification : generation, creneaux libres, reorganisation |
| P5 | Assistant IA, validation des propositions, modale d'imprevu |

Chaque fichier de depart indique son responsable en commentaire (P1 a P5).

## Schema des donnees (localStorage) : A VALIDER PAR TOUT LE GROUPE

Cles : `tempoplan.users`, `tempoplan.activities`, `tempoplan.goals`, `tempoplan.settings`, `tempoplan.session`.
Les champs de chaque objet sont a definir ici (P2 propose, tous valident) avant de coder les modules.

## Fonctions partagees (contrats)

- `findFreeSlots(activities, settings, duration, deadline)` : P4
- `detectConflicts(activities)` : P2
- `createActivity(data)` : P2
- `priorityScore(task)` : P3 (nombre de 0 a 100)

Chaque module publie d'abord une version factice de ses fonctions, puis la remplace par la vraie.

## Workflow Git

- `main` : version stable, on ne pousse jamais directement dessus
- Une branche par fonctionnalite : `feature/week-view`, `feature/activity-crud`, `fix/conflict-bug`
- Commits courts au present, ex. : `feat: ajoute le formulaire d'activite`
- Pull request relue par une autre personne avant la fusion
- Avant de commencer : `git pull origin main`

## Conventions

- Composants React : `PascalCase.jsx` ; fonctions et variables : `camelCase`
- Pas d'appel direct a `localStorage` hors de `services/`
- Une seule palette et une seule police : voir `src/styles/index.css`

## Cle API (assistant IA)

La cle est saisie par l'utilisateur dans les parametres et stockee dans son navigateur. Ne jamais la committer ni l'afficher en demo.
