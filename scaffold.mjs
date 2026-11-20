// TempoPlan - script d'initialisation de la structure frontend
// Usage : depuis la racine d'un projet Vite + React deja cree  ->  node scaffold.mjs
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
if (!fs.existsSync(path.join(root, 'package.json')) || !fs.existsSync(path.join(root, 'src'))) {
  console.error('Erreur : lancez ce script a la racine du projet Vite (package.json et src/ requis).')
  process.exit(1)
}

let created = 0
function write(rel, content, { overwrite = false } = {}) {
  const file = path.join(root, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  if (fs.existsSync(file) && !overwrite) return
  fs.writeFileSync(file, content)
  created++
}
function remove(rel) {
  const file = path.join(root, rel)
  if (fs.existsSync(file)) fs.rmSync(file, { recursive: true, force: true })
}

// ---------- generateurs de fichiers de depart ----------
const comp = (name, owner, desc) =>
  '// ' + owner + ' : ' + desc + '\n' +
  'export default function ' + name + '() {\n' +
  '  return (\n    <div className="p-4">\n      <h1 className="text-2xl font-bold text-slate-900">' + name + '</h1>\n' +
  '      <p className="text-slate-600">' + desc + '</p>\n    </div>\n  )\n}\n'

const page = (name, owner, desc) => comp(name, owner, desc)

const fn = (owner, desc, body) => '// ' + owner + ' : ' + desc + '\n' + body + '\n'

// ---------- config de base ----------
write('vite.config.js', [
  "import { defineConfig } from 'vite'",
  "import react from '@vitejs/plugin-react'",
  "import tailwindcss from '@tailwindcss/vite'",
  "import path from 'node:path'",
  '',
  'export default defineConfig({',
  '  plugins: [react(), tailwindcss()],',
  "  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },",
  '})',
  ''
].join('\n'), { overwrite: true })

write('jsconfig.json', JSON.stringify({ compilerOptions: { baseUrl: '.', paths: { '@/*': ['src/*'] } }, include: ['src'] }, null, 2) + '\n')
write('.prettierrc', JSON.stringify({ semi: false, singleQuote: true, trailingComma: 'es5', printWidth: 100 }, null, 2) + '\n')
write('.env.example', '# Copiez ce fichier en .env (jamais committe). Ne mettez JAMAIS de vraie cle ici.\nVITE_APP_NAME=TempoPlan\n')

// .gitignore : on s'assure que .env est ignore
const gi = path.join(root, '.gitignore')
const giTxt = fs.existsSync(gi) ? fs.readFileSync(gi, 'utf8') : ''
if (!/^\.env$/m.test(giTxt)) fs.writeFileSync(gi, giTxt + '\n# Variables d\'environnement\n.env\n.env.local\n')

// ---------- nettoyage des fichiers par defaut de Vite ----------
remove('src/App.css'); remove('src/index.css'); remove('src/assets/react.svg')

// ---------- point d'entree ----------
write('src/main.jsx', [
  "import { StrictMode } from 'react'",
  "import { createRoot } from 'react-dom/client'",
  "import './styles/index.css'",
  "import App from './App.jsx'",
  '',
  "createRoot(document.getElementById('root')).render(",
  '  <StrictMode>',
  '    <App />',
  '  </StrictMode>',
  ')',
  ''
].join('\n'), { overwrite: true })

write('src/App.jsx', [
  "import { BrowserRouter } from 'react-router-dom'",
  "import { Toaster } from 'react-hot-toast'",
  "import AppRoutes from './routes'",
  '',
  'export default function App() {',
  '  return (',
  '    <BrowserRouter>',
  '      <AppRoutes />',
  '      <Toaster position="top-right" />',
  '    </BrowserRouter>',
  '  )',
  '}',
  ''
].join('\n'), { overwrite: true })

// ---------- theme (Tailwind v4) ----------
write('src/styles/index.css', [
  '@import "tailwindcss";',
  '',
  '/* Design tokens TempoPlan : a utiliser partout (bg-primary, text-accent, etc.) */',
  '@theme {',
  '  --color-primary: #4f46e5;',
  '  --color-primary-dark: #4338ca;',
  '  --color-lavender: #eef0ff;',
  '  --color-accent: #f97316;',
  '  --color-success: #22c55e;',
  '  --color-danger: #ef4444;',
  '  --color-ink: #0f172a;',
  '  --font-sans: "Inter", "Poppins", system-ui, sans-serif;',
  '  --radius-card: 1rem;',
  '}',
  '',
  'body { @apply bg-white text-ink font-sans; }',
  ''
].join('\n'))

write('src/styles/tokens.md', [
  '# Guide de style TempoPlan',
  '',
  '- Couleurs : primary (indigo), lavender (fonds), accent (orange, actions), success (vert), danger (rouge : retards et conflits uniquement)',
  '- Une seule famille de police sans-serif, texte courant 16 px minimum',
  '- Coins arrondis 8 a 16 px, ombres legeres',
  '- Boutons, champs, cartes : toujours depuis src/components/ui',
  ''
].join('\n'))

// ---------- routes ----------
write('src/routes/index.jsx', [
  "import { Routes, Route, Navigate } from 'react-router-dom'",
  "import PublicLayout from '@/layouts/PublicLayout'",
  "import AuthLayout from '@/layouts/AuthLayout'",
  "import AppLayout from '@/layouts/AppLayout'",
  "import ProtectedRoute from './ProtectedRoute'",
  "import Landing from '@/pages/Landing'",
  "import Login from '@/pages/Login'",
  "import Register from '@/pages/Register'",
  "import ForgotPassword from '@/pages/ForgotPassword'",
  "import Onboarding from '@/pages/Onboarding'",
  "import Dashboard from '@/pages/Dashboard'",
  "import Planning from '@/pages/Planning'",
  "import Activities from '@/pages/Activities'",
  "import Goals from '@/pages/Goals'",
  "import Stats from '@/pages/Stats'",
  "import Assistant from '@/pages/Assistant'",
  "import Settings from '@/pages/Settings'",
  "import NotFound from '@/pages/NotFound'",
  '',
  'export default function AppRoutes() {',
  '  return (',
  '    <Routes>',
  '      <Route element={<PublicLayout />}>',
  '        <Route path="/" element={<Landing />} />',
  '      </Route>',
  '',
  '      <Route element={<AuthLayout />}>',
  '        <Route path="/login" element={<Login />} />',
  '        <Route path="/register" element={<Register />} />',
  '        <Route path="/forgot-password" element={<ForgotPassword />} />',
  '      </Route>',
  '',
  '      <Route element={<ProtectedRoute />}>',
  '        <Route path="/onboarding" element={<Onboarding />} />',
  '        <Route path="/app" element={<AppLayout />}>',
  '          <Route index element={<Dashboard />} />',
  '          <Route path="planning" element={<Planning />} />',
  '          <Route path="activities" element={<Activities />} />',
  '          <Route path="goals" element={<Goals />} />',
  '          <Route path="stats" element={<Stats />} />',
  '          <Route path="assistant" element={<Assistant />} />',
  '          <Route path="settings" element={<Settings />} />',
  '        </Route>',
  '      </Route>',
  '',
  '      <Route path="/home" element={<Navigate to="/" replace />} />',
  '      <Route path="*" element={<NotFound />} />',
  '    </Routes>',
  '  )',
  '}',
  ''
].join('\n'))

write('src/routes/ProtectedRoute.jsx', [
  '// P1 : bloque l\'acces a l\'application si l\'utilisateur n\'est pas connecte',
  "import { Navigate, Outlet } from 'react-router-dom'",
  "import { getSession } from '@/services/storage'",
  '',
  'export default function ProtectedRoute() {',
  '  // TODO (P1) : brancher sur authStore. Pour le developpement, mettre DEV_BYPASS a true.',
  '  const DEV_BYPASS = true',
  '  if (!DEV_BYPASS && !getSession()) return <Navigate to="/login" replace />',
  '  return <Outlet />',
  '}',
  ''
].join('\n'))

// ---------- layouts ----------
const layout = (name, owner, desc) => [
  '// ' + owner + ' : ' + desc,
  "import { Outlet } from 'react-router-dom'",
  '',
  'export default function ' + name + '() {',
  '  return (',
  '    <div className="min-h-screen">',
  '      {/* TODO : ' + desc + ' */}',
  '      <main>',
  '        <Outlet />',
  '      </main>',
  '    </div>',
  '  )',
  '}',
  ''
].join('\n')
write('src/layouts/PublicLayout.jsx', layout('PublicLayout', 'P1', 'navbar + footer de la landing page'))
write('src/layouts/AuthLayout.jsx', layout('AuthLayout', 'P1', 'carte centree pour connexion et inscription'))
write('src/layouts/AppLayout.jsx', layout('AppLayout', 'P1', 'sidebar + barre du haut de l\'application'))

// ---------- pages ----------
const landingSections = [
  ['Hero', 'Titre, sous-titre, boutons, visuel'],
  ['Features', 'Six cartes de fonctionnalites'],
  ['HowItWorks', 'Comment ca marche en 3 etapes'],
  ['AudienceCards', 'Pour qui ? (3 cartes)'],
  ['Faq', 'Accordeon de questions'],
  ['FinalCta', 'Appel a l\'action final'],
]
write('src/pages/Landing/index.jsx', [
  '// P1 : assemble les sections de la landing page dans l\'ordre',
  ...landingSections.map(([n]) => "import " + n + " from './sections/" + n + "'"),
  '',
  'export default function Landing() {',
  '  return (',
  '    <>',
  ...landingSections.map(([n]) => '      <' + n + ' />'),
  '    </>',
  '  )',
  '}',
  ''
].join('\n'))
landingSections.forEach(([n, d]) => write('src/pages/Landing/sections/' + n + '.jsx', comp(n, 'P1', d)))

const pages = [
  ['Login', 'P1', 'Formulaire de connexion'],
  ['Register', 'P1', 'Formulaire d\'inscription'],
  ['ForgotPassword', 'P1', 'Reinitialisation du mot de passe'],
  ['Onboarding', 'P1', 'Trois questions de personnalisation apres l\'inscription'],
  ['Dashboard', 'P2', 'Vue du jour, echeances, alertes, resume de la semaine'],
  ['Planning', 'P3', 'Calendrier jour / semaine / mois'],
  ['Activities', 'P2', 'Liste, ajout et modification des activites'],
  ['Goals', 'P3', 'Objectifs court et long terme, priorites'],
  ['Stats', 'P2', 'Suivi des progres : prevu vs realise'],
  ['Assistant', 'P5', 'Assistant de planification en langage naturel'],
  ['Settings', 'P1', 'Profil, disponibilites, notifications, cle API'],
  ['NotFound', 'P1', 'Page introuvable'],
]
pages.forEach(([n, o, d]) => write('src/pages/' + n + '.jsx', page(n, o, d)))

// ---------- features (un dossier par fonctionnalite du sujet) ----------
const features = {
  activities: ['P2', [['ActivityForm', 'Formulaire d\'activite (fixe ou flexible)'], ['ActivityCard', 'Carte d\'activite'], ['ConflictAlert', 'Alerte de conflit horaire']]],
  schedule: ['P3', [['WeekView', 'Vue semaine'], ['DayView', 'Vue jour'], ['MonthView', 'Vue mois'], ['GenerateButton', 'Bouton Generer mon planning']]],
  freeSlots: ['P4', [['SlotSuggestions', 'Propositions de creneaux libres']]],
  reschedule: ['P5', [['RescheduleModal', 'Modale Un imprevu ?'], ['ChangesPreview', 'Apercu des changements avant validation']]],
  goals: ['P3', [['GoalCard', 'Carte d\'objectif'], ['PriorityBadge', 'Badge de priorite'], ['SubtaskList', 'Liste de sous-taches']]],
  notifications: ['P1', [['NotificationBell', 'Cloche et panneau de notifications'], ['ReminderSettings', 'Reglages des rappels']]],
  progress: ['P2', [['PlannedVsDone', 'Graphique prevu vs realise'], ['LateTasksChart', 'Taches en retard']]],
  assistant: ['P5', [['AssistantChat', 'Interface de chat'], ['SlotProposal', 'Proposition accepter / modifier / refuser']]],
}
Object.entries(features).forEach(([dir, [owner, list]]) =>
  list.forEach(([n, d]) => write('src/features/' + dir + '/' + n + '.jsx', comp(n, owner, d))))

write('src/features/auth/useAuth.js', fn('P1', 'hook d\'authentification',
  "import { useAuthStore } from '@/store/authStore'\n\nexport function useAuth() {\n  return useAuthStore()\n}"))
write('src/features/activities/useActivities.js', fn('P2', 'hook des activites',
  "import { useActivitiesStore } from '@/store/activitiesStore'\n\nexport function useActivities() {\n  return useActivitiesStore()\n}"))

// ---------- composants partages ----------
write('src/components/ui/Button.jsx', [
  '// P1 : bouton partage (variantes primary / secondary / accent)',
  'const variants = {',
  "  primary: 'bg-primary text-white hover:bg-primary-dark',",
  "  secondary: 'bg-white text-ink border border-slate-300 hover:bg-lavender',",
  "  accent: 'bg-accent text-white hover:opacity-90',",
  '}',
  '',
  "export default function Button({ variant = 'primary', className = '', ...props }) {",
  '  return (',
  '    <button',
  '      className={"rounded-lg px-4 py-2 font-semibold transition " + variants[variant] + " " + className}',
  '      {...props}',
  '    />',
  '  )',
  '}',
  ''
].join('\n'))
;['Input', 'Select', 'Modal', 'Card', 'Badge', 'Tabs', 'Accordion', 'Skeleton'].forEach((n) =>
  write('src/components/ui/' + n + '.jsx', comp(n, 'P1', 'composant partage a completer')))
;['Logo', 'Navbar', 'Sidebar', 'Footer', 'EmptyState'].forEach((n) =>
  write('src/components/common/' + n + '.jsx', comp(n, 'P1', 'composant commun a completer')))

// ---------- stores (Zustand) ----------
const store = (hook, owner, initial) => fn(owner, 'etat global',
  "import { create } from 'zustand'\n\nexport const " + hook + ' = create(() => (' + initial + '))')
write('src/store/authStore.js', store('useAuthStore', 'P1', '{ user: null }'))
write('src/store/activitiesStore.js', store('useActivitiesStore', 'P2', '{ activities: [] }'))
write('src/store/scheduleStore.js', store('useScheduleStore', 'P3', '{ schedule: [] }'))
write('src/store/settingsStore.js', store('useSettingsStore', 'P1', '{ settings: {} }'))

// ---------- services (couche de donnees : seul endroit qui touche localStorage) ----------
write('src/services/storage.js', [
  '// P2 : acces unique a localStorage. Les pages n\'appellent JAMAIS localStorage directement.',
  '// Schema a valider par tout le groupe avant de coder (voir README).',
  "export const KEYS = {",
  "  users: 'tempoplan.users',",
  "  activities: 'tempoplan.activities',",
  "  goals: 'tempoplan.goals',",
  "  settings: 'tempoplan.settings',",
  "  session: 'tempoplan.session',",
  '}',
  '',
  'export function read(key, fallback = null) {',
  '  try {',
  '    const raw = localStorage.getItem(key)',
  '    return raw ? JSON.parse(raw) : fallback',
  '  } catch {',
  '    return fallback',
  '  }',
  '}',
  '',
  'export function write(key, value) {',
  '  try {',
  '    localStorage.setItem(key, JSON.stringify(value))',
  '    return true',
  '  } catch {',
  '    return false',
  '  }',
  '}',
  '',
  'export const getSession = () => read(KEYS.session)',
  ''
].join('\n'))
write('src/services/api.js', fn('P2', 'point d\'entree futur vers un vrai backend', '// Aujourd\'hui : tout passe par storage.js. Plus tard : fetch vers le backend ici.\nexport {}'))
write('src/services/authService.js', fn('P1', 'inscription / connexion simulees', 'export async function login(email, password) {\n  // TODO\n}\n\nexport async function register(data) {\n  // TODO\n}'))
write('src/services/activitiesService.js', fn('P2', 'CRUD des activites', 'export function createActivity(data) {\n  // TODO : valider, detecter les conflits, enregistrer\n}\n\nexport function listActivities() {\n  return []\n}'))
write('src/services/goalsService.js', fn('P3', 'CRUD des objectifs', 'export function listGoals() {\n  return []\n}'))

// ---------- lib : logique pure, sans React ----------
write('src/lib/conflicts.js', fn('P2', 'detection des conflits horaires', 'export function detectConflicts(activities) {\n  // TODO : renvoie les paires d\'activites qui se chevauchent\n  return []\n}'))
write('src/lib/priority.js', fn('P3', 'score de priorite de 0 a 100 (urgence, importance, echeance)', 'export function priorityScore(task, now = new Date()) {\n  // TODO : format du score a valider avec P4\n  return 0\n}'))
write('src/lib/freeSlots.js', fn('P4', 'recherche de creneaux libres', 'export function findFreeSlots(activities, settings, duration, deadline) {\n  // TODO : version factice au debut, vraie logique ensuite\n  return []\n}'))
write('src/lib/scheduler.js', fn('P4', 'generation automatique du planning', 'export function generateSchedule(activities, settings) {\n  // TODO : respecter les fixes, les echeances, les pauses et les marges\n  return []\n}'))
write('src/lib/rescheduler.js', fn('P4', 'reorganisation apres imprevu (sans toucher aux activites fixes)', 'export function reschedule(schedule, incident, settings) {\n  // TODO : renvoie les changements proposes (a valider par l\'utilisateur)\n  return { changes: [] }\n}'))
write('src/lib/nlParser.js', fn('P5', 'phrase en langage naturel vers tache (duree, echeance, priorite)', 'export function parseTask(text) {\n  // TODO v1 : regex. Repli obligatoire si l\'API IA est indisponible.\n  return null\n}'))
write('src/lib/dates.js', fn('P3', 'fonctions de dates partagees (date-fns)', 'export {}'))
write('src/lib/__tests__/conflicts.test.js', "import { describe, it, expect } from 'vitest'\nimport { detectConflicts } from '../conflicts'\n\ndescribe('detectConflicts', () => {\n  it('renvoie une liste vide sans activites', () => {\n    expect(detectConflicts([])).toEqual([])\n  })\n})\n")

// ---------- hooks, utils, data, assets ----------
write('src/hooks/useLocalStorage.js', fn('Tous', 'hook utilitaire', 'export {}'))
write('src/hooks/useMediaQuery.js', fn('Tous', 'hook utilitaire', 'export {}'))
write('src/hooks/useDebounce.js', fn('Tous', 'hook utilitaire', 'export {}'))
write('src/utils/constants.js', fn('Tous', 'constantes partagees', "export const PRIORITIES = ['basse', 'moyenne', 'haute']\nexport const ACTIVITY_TYPES = ['fixe', 'flexible']\nexport const CATEGORIES = ['cours', 'revision', 'reunion', 'projet', 'personnel', 'loisir']"))
write('src/utils/validators.js', fn('Tous', 'schemas Zod partages', 'export {}'))
write('src/data/seed.js', fn('P2', 'donnees de demonstration partagees par tout le groupe', 'export const seedActivities = []'))
write('src/assets/.gitkeep', '')

// ---------- README ----------
write('README.md', [
  '# TempoPlan',
  '',
  'Plateforme intelligente de gestion et d\'optimisation du temps. Projet de fin de module Developpement Frontend (FST Marrakech).',
  '',
  '## Demarrage',
  '',
  '```bash',
  'git clone <url-du-depot>',
  'cd tempoplan',
  'npm install',
  'npm run dev',
  '```',
  '',
  'Copiez `.env.example` en `.env` si besoin. Ne committez jamais `.env` ni une cle API.',
  '',
  '## Structure',
  '',
  '- `src/pages` : une page par ecran ; `src/pages/Landing/sections` : sections de la landing',
  '- `src/features` : un dossier par fonctionnalite du sujet (A a G + assistant)',
  '- `src/components/ui` : composants partages (boutons, champs, cartes) ; toujours les reutiliser',
  '- `src/lib` : logique pure sans React (planning, conflits, creneaux, priorite, parseur)',
  '- `src/services` : seul endroit qui accede a localStorage (storage.js)',
  '- `src/store` : etats globaux (Zustand)',
  '- `src/styles` : theme Tailwind (couleurs, police, rayons)',
  '',
  '## Repartition',
  '',
  '| Personne | Modules |',
  '|---|---|',
  '| P1 | Landing, auth, socle (layouts, routes, composants ui), parametres, notifications |',
  '| P2 | Donnees (storage.js), activites, conflits, suivi des progres, dashboard |',
  '| P3 | Vues du planning, objectifs et score de priorite |',
  '| P4 | Moteur de planification : generation, creneaux libres, reorganisation |',
  '| P5 | Assistant IA, validation des propositions, modale d\'imprevu |',
  '',
  'Chaque fichier de depart indique son responsable en commentaire (P1 a P5).',
  '',
  '## Schema des donnees (localStorage) : A VALIDER PAR TOUT LE GROUPE',
  '',
  'Cles : `tempoplan.users`, `tempoplan.activities`, `tempoplan.goals`, `tempoplan.settings`, `tempoplan.session`.',
  'Les champs de chaque objet sont a definir ici (P2 propose, tous valident) avant de coder les modules.',
  '',
  '## Fonctions partagees (contrats)',
  '',
  '- `findFreeSlots(activities, settings, duration, deadline)` : P4',
  '- `detectConflicts(activities)` : P2',
  '- `createActivity(data)` : P2',
  '- `priorityScore(task)` : P3 (nombre de 0 a 100)',
  '',
  'Chaque module publie d\'abord une version factice de ses fonctions, puis la remplace par la vraie.',
  '',
  '## Workflow Git',
  '',
  '- `main` : version stable, on ne pousse jamais directement dessus',
  '- Une branche par fonctionnalite : `feature/week-view`, `feature/activity-crud`, `fix/conflict-bug`',
  '- Commits courts au present, ex. : `feat: ajoute le formulaire d\'activite`',
  '- Pull request relue par une autre personne avant la fusion',
  '- Avant de commencer : `git pull origin main`',
  '',
  '## Conventions',
  '',
  '- Composants React : `PascalCase.jsx` ; fonctions et variables : `camelCase`',
  '- Pas d\'appel direct a `localStorage` hors de `services/`',
  '- Une seule palette et une seule police : voir `src/styles/index.css`',
  '',
  '## Cle API (assistant IA)',
  '',
  'La cle est saisie par l\'utilisateur dans les parametres et stockee dans son navigateur. Ne jamais la committer ni l\'afficher en demo.',
  ''
].join('\n'), { overwrite: true })

console.log('Structure creee : ' + created + ' fichiers ecrits.')
console.log('Etape suivante : npm install (si ce n\'est pas deja fait), puis npm run dev')
