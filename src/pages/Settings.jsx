// P1 : page « Paramètres et profil »
import { useState } from 'react'
import toast from 'react-hot-toast'
import Tabs, { TabPanel } from '@/components/ui/Tabs'
import ProfileSection from '@/features/settings/ProfileSection'
import AvailabilitySection from '@/features/settings/AvailabilitySection'
import NotificationsSection from '@/features/settings/NotificationsSection'
import AiSection from '@/features/settings/AiSection'
import DataSection from '@/features/settings/DataSection'
import { getSettings, saveSettings } from '@/services/settingsService'

const tabs = [
  { id: 'profil', label: 'Profil' },
  { id: 'disponibilites', label: 'Disponibilités' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'ia', label: 'Assistant IA' },
  { id: 'donnees', label: 'Données' },
]

export default function Settings() {
  const [tab, setTab] = useState('profil')
  const [settings, setSettings] = useState(() => getSettings())

  function save(patch) {
    const next = saveSettings(patch)
    if (!next) return toast.error('Session expirée. Reconnectez-vous.')
    setSettings(next)
    toast.success('Paramètres enregistrés.')
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">Paramètres et profil</h1>
        <p className="mt-1 text-muted">Personnalisez TempoPlan selon votre rythme.</p>
      </header>

      <Tabs
        idPrefix="parametres"
        ariaLabel="Sections des paramètres"
        tabs={tabs}
        value={tab}
        onChange={setTab}
      />

      <TabPanel idPrefix="parametres" value={tab}>
        {tab === 'profil' && <ProfileSection />}
        {tab === 'disponibilites' && <AvailabilitySection settings={settings} onSave={save} />}
        {tab === 'notifications' && <NotificationsSection settings={settings} onSave={save} />}
        {tab === 'ia' && <AiSection settings={settings} onSave={save} />}
        {tab === 'donnees' && <DataSection />}
      </TabPanel>
    </div>
  )
}
