# TempoPlan

Plateforme intelligente de gestion et d'optimisation du temps. Projet de fin de module Developpement Frontend (FST Marrakech).

## Prerequis

- Node.js 20.19 ou plus recent (ou 22.12+), installe de preference avec nvm
- Git, configure avec votre nom et votre e-mail GitHub :
  `git config --global user.name "Votre Nom"` et `git config --global user.email "votre-email"`
- Un compte GitHub ayant accepte l'invitation au depot, et connecte a Git (par exemple avec `gh auth login`)

## Demarrage

```bash
git clone https://github.com/VOTRE-COMPTE/tempoplan.git
npm install
npm run dev
```

Ouvrez l'adresse affichee (souvent http://localhost:5173). Copiez `.env.example` en `.env` si besoin.
Ne committez jamais `.env` ni une cle API.

## Commandes utiles

- `npm run dev` : lance le site en local
- `npm test` : lance les tests (Vitest)
- `npm run build` : verifie que le projet compile

## Structure

- `src/pages` : une page par ecran ; `src/pages/Landing/sections` : sections de la landing
- `src/features` : un dossier par fonctionnalite du sujet (A a G + assistant)
- `src/components/ui` : composants partages (boutons, champs, cartes) ; toujours les reutiliser
- `src/lib` : logique pure sans React (planning, conflits, creneaux, priorite, parseur)
- `src/services` : seul endroit qui accede a localStorage (storage.js)
- `src/store` : etats globaux (Zustand)
- `src/styles` : theme Tailwind (couleurs, police, rayons)

## Repartition

| Personne | Modules                                                                          |
| -------- | -------------------------------------------------------------------------------- |
| P1       | Landing, auth, socle (layouts, routes, composants ui), parametres, notifications |
| P2       | Donnees (storage.js), activites, conflits, suivi des progres, dashboard          |
| P3       | Vues du planning, objectifs et score de priorite                                 |
| P4       | Moteur de planification : generation, creneaux libres, reorganisation            |
| P5       | Assistant IA, validation des propositions, modale d'imprevu                      |

Chaque fichier de depart indique son responsable en commentaire (P1 a P5).

## Schema des donnees (localStorage)

A valider par tout le groupe.

### Conventions

- `id` : chaine unique, generee avec `crypto.randomUUID()`
- Dates et heures : texte ISO 8601 local, ex. `"2026-11-24T14:00"` ; durees en **minutes**
- Noms de champs en anglais `camelCase` ; valeurs fixes definies dans `src/utils/constants.js`
- Chaque objet porte un `userId` et un `createdAt` ; on filtre toujours par utilisateur connecte
- Ce qui se calcule ne se stocke pas : le **retard** (echeance depassee et non terminee), le **score de priorite** et la **progression d'un objectif**

### Cles

`tempoplan.users`, `tempoplan.session`, `tempoplan.activities`, `tempoplan.goals`, `tempoplan.settings`, `tempoplan.notifications`

### users (liste)

`id`, `firstName`, `lastName`, `email`, `password` (simule, pour la demo uniquement), `profile` (`etudiant` | `professionnel` | `autre`), `onboardingDone` (booleen), `createdAt`

### session (objet)

`userId`, `loggedInAt`

### activities (liste)

| Champ                            | Valeurs                                                             |
| -------------------------------- | ------------------------------------------------------------------- |
| `id`, `userId`, `title`, `notes` | texte                                                               |
| `type`                           | `fixe` ou `flexible`                                                |
| `category`                       | `cours`, `revision`, `reunion`, `projet`, `personnel`, `loisir`     |
| `priority`                       | `basse`, `moyenne`, `haute`                                         |
| `start`                          | date et heure de debut ; `null` pour une flexible pas encore placee |
| `durationMin`                    | nombre de minutes                                                   |
| `deadline`                       | echeance (flexibles), sinon `null`                                  |
| `status`                         | `a_faire`, `en_cours`, `terminee`, `annulee`                        |
| `goalId`                         | id de l'objectif lie, ou `null`                                     |
| `postponedCount`                 | nombre de reports (pour le suivi)                                   |
| `recurrence`                     | `null` ou regle simple (ex. `"weekly"`)                             |
| `completedAt`, `createdAt`       | dates                                                               |

Exemple :

```json
{
  "id": "a1",
  "userId": "u1",
  "title": "Reviser les reseaux",
  "type": "flexible",
  "category": "revision",
  "priority": "haute",
  "start": "2026-11-25T14:00",
  "durationMin": 120,
  "deadline": "2026-11-27T18:00",
  "status": "a_faire",
  "goalId": "g1",
  "postponedCount": 0,
  "createdAt": "2026-11-20T09:00"
}
```

### goals (liste)

`id`, `userId`, `title`, `description`, `type` (`court_terme` | `long_terme`), `deadline`, `importance` (1 a 5), `createdAt`.
Les sous-taches sont des **activites** avec `goalId` ; la progression est calculee a partir d'elles.

### settings (un objet par utilisateur)

```json
{
  "userId": "u1",
  "availability": { "days": [1, 2, 3, 4, 5], "startTime": "08:00", "endTime": "20:00" },
  "breakMinutes": 15,
  "bufferPercent": 15,
  "notifications": {
    "browserAlerts": true,
    "reminderMinutesBefore": 30,
    "deadlines": true,
    "overdue": true,
    "conflicts": true
  },
  "ai": { "mode": "rules", "apiKey": "" }
}
```

`days` : 1 = lundi ... 7 = dimanche.

### notifications (liste)

`id`, `userId`, `type` (`echeance` | `retard` | `conflit`), `message`, `relatedId`, `read` (booleen), `createdAt`

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
