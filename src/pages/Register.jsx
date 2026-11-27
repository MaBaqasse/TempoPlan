// P1 : page d’inscription
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import AuthSplit from '@/components/common/AuthSplit'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'

const NEXT_PAGE = '/app' // TODO : passer à '/onboarding' quand la page Onboarding sera prête
const REQUIRED = 'Ce champ est obligatoire.'

const schema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, REQUIRED)
      .min(2, 'Le prénom doit contenir au moins 2 caractères.'),
    lastName: z.string().trim().min(1, REQUIRED),
    email: z
      .string()
      .trim()
      .min(1, REQUIRED)
      .email('Saisissez une adresse e-mail valide, par exemple vous@exemple.com.'),
    profile: z.string().min(1, 'Choisissez votre profil.'),
    password: z
      .string()
      .min(1, REQUIRED)
      .refine((v) => v.length >= 8 && /[A-Z]/.test(v) && /\d/.test(v), {
        message:
          'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.',
      }),
    confirmPassword: z.string().min(1, REQUIRED),
    terms: z
      .boolean()
      .refine((v) => v === true, { message: 'Vous devez accepter les conditions pour continuer.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  })

export default function Register() {
  const navigate = useNavigate()
  const signUp = useAuthStore((s) => s.signUp)
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched', // vérifie quand on quitte un champ, puis à chaque frappe
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      profile: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  })

  async function onSubmit(values) {
    setFormError('')
    const result = await signUp(values)

    if (!result.ok) {
      if (result.errors?.email) setError('email', { type: 'server', message: result.errors.email })
      else setFormError(result.errors?.form ?? 'Une erreur est survenue. Réessayez.')
      return
    }

    toast.success('Bienvenue, ' + result.user.firstName + '\u00A0! Votre compte est créé.')
    navigate(NEXT_PAGE, { replace: true })
  }

  return (
    <AuthSplit title="Créez votre compte" subtitle="Votre premier planning est à quelques minutes">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label={'Prénom\u00A0:'}
          placeholder="Salma"
          autoComplete="given-name"
          error={errors.firstName?.message}
          {...register('firstName')}
        />
        <Input
          label={'Nom\u00A0:'}
          placeholder="Alaoui"
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...register('lastName')}
        />
        <Input
          label={'Adresse e-mail\u00A0:'}
          type="email"
          placeholder="vous@exemple.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Select label={'Vous êtes\u00A0:'} error={errors.profile?.message} {...register('profile')}>
          <option value="">---- Choisir un profil ----</option>
          <option value="etudiant">Étudiant(e)</option>
          <option value="professionnel">Professionnel(le)</option>
          <option value="autre">Autre</option>
        </Select>
        <Input
          label={'Mot de passe\u00A0:'}
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label={'Confirmer le mot de passe\u00A0:'}
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Checkbox
          className="pt-1"
          label="J'accepte les conditions d'utilisation"
          error={errors.terms?.message}
          {...register('terms')}
        />

        {formError && (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full py-3 font-semibold">
          {isSubmitting ? 'Création en cours…' : 'Créer mon compte'}
        </Button>

        <p className="pt-2 text-center text-xs text-ink">
          Vous avez déjà un compte{'\u00A0'}?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary-500 underline underline-offset-2 hover:text-primary-700"
          >
            Se connecter
          </Link>
        </p>
      </form>
    </AuthSplit>
  )
}
