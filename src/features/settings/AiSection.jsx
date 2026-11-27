// P1 : réglages de l’assistant IA (lus par l’assistant de P5 dans settings.ai)
import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Switch from '@/components/ui/Switch'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { testGeminiKey } from '@/services/aiKeyService'

export default function AiSection({ settings, onSave }) {
  const [rulesOnly, setRulesOnly] = useState(settings.ai.mode !== 'ai')
  const [apiKey, setApiKey] = useState(settings.ai.apiKey ?? '')
  const [error, setError] = useState('')
  const [test, setTest] = useState(null) // { ok, message }
  const [testing, setTesting] = useState(false)

  const aiActive = settings.ai.mode === 'ai' && String(settings.ai.apiKey ?? '').trim() !== ''

  async function handleTest() {
    setTesting(true)
    setTest(null)
    setTest(await testGeminiKey(apiKey))
    setTesting(false)
  }

  function handleSave(e) {
    e.preventDefault()
    const key = apiKey.trim()
    if (!rulesOnly && !key) {
      setError('Saisissez une clé API pour activer le mode IA, ou activez « Mode règles uniquement ».')
      return
    }
    setError('')
    onSave({ ai: { mode: rulesOnly ? 'rules' : 'ai', apiKey: key } })
  }

  function handleRemoveKey() {
    setApiKey('')
    setRulesOnly(true)
    setTest(null)
    setError('')
    onSave({ ai: { mode: 'rules', apiKey: '' } })
  }

  return (
    <Card
      title="Assistant IA"
      description="L’assistant fonctionne toujours en mode règles, sans clé. Avec une clé Gemini, il comprend aussi des phrases plus libres."
      action={<Badge variant={aiActive ? 'success' : 'neutral'} dot>{aiActive ? 'Mode IA actif' : 'Mode règles'}</Badge>}
    >
      <form onSubmit={handleSave} noValidate className="space-y-5">
        <Switch
          label="Mode règles uniquement"
          description="Aucun appel à l’IA, même si une clé est enregistrée."
          checked={rulesOnly}
          onChange={setRulesOnly}
        />

        <div>
          <Input
            label={'Clé API Gemini\u00A0:'}
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="Collez votre clé ici"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            error={error}
          />
          <p className="mt-1.5 text-sm text-muted">Vous pouvez créer une clé gratuite dans Google AI Studio.</p>
        </div>

        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>
            <strong>Cette clé reste dans votre navigateur.</strong> Elle est envoyée uniquement à Google pour interroger Gemini.
            Ne la partagez pas, ne la mettez jamais dans Git et ne l’affichez pas pendant une démonstration.
          </p>
        </div>

        {test && (
          <p role="status" className={'rounded-lg px-3 py-2 text-sm ' + (test.ok ? 'bg-success/10 text-green-800' : 'bg-danger/10 text-danger')}>
            {test.message}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit">Enregistrer</Button>
          <Button variant="secondary" onClick={handleTest} disabled={testing || !apiKey.trim()}>
            {testing ? 'Test en cours…' : 'Tester la clé'}
          </Button>
          {settings.ai.apiKey && (
            <Button variant="secondary" onClick={handleRemoveKey}>
              Supprimer la clé
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}
