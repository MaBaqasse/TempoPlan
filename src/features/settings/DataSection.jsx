// P1 : données de démonstration, export, réinitialisation et suppression du compte
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { exportUserData, downloadJson, resetUserData, loadDemoData } from '@/services/dataService'
import { useAuthStore } from '@/store/authStore'

function Row({ title, text, children }) {
  return (
    <div className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium text-ink">{title}</p>
        <p className="text-sm text-muted">{text}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

export default function DataSection() {
  const navigate = useNavigate()
  const deleteAccount = useAuthStore((s) => s.deleteAccount)
  const [confirm, setConfirm] = useState(null) // 'reset' | 'delete' | null

  async function handleDemo() {
    const result = await loadDemoData()
    if (result === 'added') toast.success('Données de démonstration ajoutées.')
    else if (result === 'already') toast('Vous avez déjà des activités : rien n’a été ajouté.')
    else toast.error('Les données de démonstration ne sont pas disponibles.')
  }

  function handleExport() {
    const data = exportUserData()
    if (!data) return toast.error('Session expirée. Reconnectez-vous.')
    downloadJson('tempoplan-donnees.json', data)
    toast.success('Export téléchargé (sans votre clé API).')
  }

  function handleReset() {
    const { activities, goals } = resetUserData()
    setConfirm(null)
    toast.success(activities + ' activité(s) et ' + goals + ' objectif(s) supprimé(s).')
  }

  function handleDelete() {
    setConfirm(null)
    navigate('/', { replace: true })
    deleteAccount()
    toast.success('Votre compte a été supprimé.')
  }

  return (
    <>
      <Card title="Données" description="Tout est enregistré dans votre navigateur, sur cet appareil.">
        <div className="divide-y divide-primary-100">
          <Row title="Données de démonstration" text="Ajoute des activités et des objectifs d’exemple (seulement si vous n’en avez aucun).">
            <Button variant="secondary" onClick={handleDemo}>
              Charger la démonstration
            </Button>
          </Row>
          <Row title="Exporter mes données" text="Télécharge un fichier JSON avec votre profil, vos activités et vos objectifs.">
            <Button variant="secondary" onClick={handleExport}>
              Exporter
            </Button>
          </Row>
          <Row title="Réinitialiser le planning" text="Supprime toutes vos activités et tous vos objectifs. Votre compte est conservé.">
            <Button variant="secondary" onClick={() => setConfirm('reset')}>
              Réinitialiser
            </Button>
          </Row>
          <Row title="Supprimer mon compte" text="Supprime votre compte et toutes vos données, définitivement.">
            <button
              type="button"
              onClick={() => setConfirm('delete')}
              className="inline-flex items-center justify-center rounded-lg border border-danger px-5 py-2.5 text-base font-medium text-danger transition-colors hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
            >
              Supprimer
            </button>
          </Row>
        </div>
      </Card>

      <ConfirmDialog
        open={confirm === 'reset'}
        onClose={() => setConfirm(null)}
        onConfirm={handleReset}
        title="Réinitialiser le planning ?"
        message="Toutes vos activités et tous vos objectifs seront supprimés. Cette action est définitive."
        confirmLabel="Réinitialiser"
        danger
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        title="Supprimer votre compte ?"
        message="Votre compte et toutes vos données seront supprimés de cet appareil. Cette action est définitive."
        confirmLabel="Supprimer mon compte"
        danger
      />
    </>
  )
}
