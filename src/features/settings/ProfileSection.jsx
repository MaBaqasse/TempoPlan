// P1 : profil (prénom, nom, profil) et changement de mot de passe
import { useState } from 'react'
import toast from 'react-hot-toast'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'

const REQUIRED = 'Ce champ est obligatoire.'
const PASSWORD_RULE = 'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.'

export default function ProfileSection() {
  const user = useAuthStore((s) => s.user)
  const updateProfile = useAuthStore((s) => s.updateProfile)
  const changePassword = useAuthStore((s) => s.changePassword)

  // ----- Profil -----
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    profile: user?.profile ?? '',
  })
  const [errors, setErrors] = useState({})
  const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  function submitProfile(e) {
    e.preventDefault()
    const next = {}
    if (!form.firstName.trim()) next.firstName = REQUIRED
    else if (form.firstName.trim().length < 2) next.firstName = 'Le prénom doit contenir au moins 2 caractères.'
    if (!form.lastName.trim()) next.lastName = REQUIRED
    if (!form.profile) next.profile = 'Choisissez votre profil.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const result = updateProfile(form)
    if (result.ok) toast.success('Profil enregistré.')
    else toast.error(result.error)
  }

  // ----- Mot de passe -----
  const emptyPw = { currentPassword: '', newPassword: '', confirmPassword: '' }
  const [pw, setPw] = useState(emptyPw)
  const [pwErrors, setPwErrors] = useState({})
  const [pwBusy, setPwBusy] = useState(false)
  const setPwField = (field) => (e) => setPw((p) => ({ ...p, [field]: e.target.value }))

  async function submitPassword(e) {
    e.preventDefault()
    const next = {}
    if (!pw.currentPassword) next.currentPassword = REQUIRED
    if (!pw.newPassword) next.newPassword = REQUIRED
    else if (pw.newPassword.length < 8 || !/[A-Z]/.test(pw.newPassword) || !/\d/.test(pw.newPassword)) next.newPassword = PASSWORD_RULE
    if (!pw.confirmPassword) next.confirmPassword = REQUIRED
    else if (pw.confirmPassword !== pw.newPassword) next.confirmPassword = 'Les mots de passe ne correspondent pas.'
    setPwErrors(next)
    if (Object.keys(next).length > 0) return

    setPwBusy(true)
    const result = await changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword })
    setPwBusy(false)

    if (!result.ok) {
      setPwErrors({ currentPassword: result.error })
      return
    }
    setPw(emptyPw)
    toast.success('Mot de passe modifié.')
  }

  return (
    <div className="space-y-6">
      <Card title="Profil" description="Ces informations s’affichent dans votre espace.">
        <form onSubmit={submitProfile} noValidate className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={'Prénom\u00A0:'} autoComplete="given-name" value={form.firstName} onChange={setField('firstName')} error={errors.firstName} />
            <Input label={'Nom\u00A0:'} autoComplete="family-name" value={form.lastName} onChange={setField('lastName')} error={errors.lastName} />
          </div>
          <Input label={'Adresse e-mail\u00A0:'} type="email" value={user?.email ?? ''} disabled readOnly className="opacity-70" />
          <Select label={'Vous êtes\u00A0:'} value={form.profile} onChange={setField('profile')} error={errors.profile}>
            <option value="">---- Choisir un profil ----</option>
            <option value="etudiant">Étudiant(e)</option>
            <option value="professionnel">Professionnel(le)</option>
            <option value="autre">Autre</option>
          </Select>
          <p className="text-sm text-muted">L’adresse e-mail ne peut pas être modifiée pour le moment.</p>
          <Button type="submit">Enregistrer le profil</Button>
        </form>
      </Card>

      <Card title="Mot de passe" description="Choisissez un mot de passe que vous n’utilisez nulle part ailleurs.">
        <form onSubmit={submitPassword} noValidate className="space-y-4">
          <Input label={'Mot de passe actuel\u00A0:'} type="password" autoComplete="current-password" value={pw.currentPassword} onChange={setPwField('currentPassword')} error={pwErrors.currentPassword} />
          <Input label={'Nouveau mot de passe\u00A0:'} type="password" autoComplete="new-password" value={pw.newPassword} onChange={setPwField('newPassword')} error={pwErrors.newPassword} />
          <Input label={'Confirmer le nouveau mot de passe\u00A0:'} type="password" autoComplete="new-password" value={pw.confirmPassword} onChange={setPwField('confirmPassword')} error={pwErrors.confirmPassword} />
          <Button type="submit" disabled={pwBusy}>
            {pwBusy ? 'Modification…' : 'Changer le mot de passe'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
