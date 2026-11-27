// P1 : page de connexion
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import AuthSplit from '@/components/common/AuthSplit'
import Input from '@/components/ui/Input'
import Checkbox from '@/components/ui/Checkbox'
import Button from '@/components/ui/Button'
import { useAuthStore } from '@/store/authStore'

const REQUIRED = 'Ce champ est obligatoire.'

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, REQUIRED)
    .email('Saisissez une adresse e-mail valide, par exemple vous@exemple.com.'),
  password: z.string().min(1, REQUIRED),
  remember: z.boolean(),
})

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const signIn = useAuthStore((s) => s.signIn)
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '', remember: false },
  })

  async function onSubmit(values) {
    setFormError('')
    const result = await signIn(values.email, values.password, values.remember)

    if (!result.ok) {
      setFormError(result.error)
      return
    }
    // Retour à la page demandée avant la redirection vers la connexion, sinon à l’application
    navigate(location.state?.from?.pathname ?? '/app', { replace: true })
  }

  return (
    <AuthSplit
      title="Content de vous revoir"
      subtitle="Connectez-vous pour retrouver votre planning"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input
          label={'Adresse e-mail\u00A0:'}
          type="email"
          placeholder="vous@exemple.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <Input
            label={'Mot de passe\u00A0:'}
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Link
            to="/forgot-password"
            className="mt-2 inline-block text-xs text-primary-500 underline underline-offset-2 hover:text-primary-700"
          >
            Mot de passe oublié{'\u00A0'}?
          </Link>
        </div>

        <Checkbox label="Se souvenir de moi" {...register('remember')} />

        {formError && (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {formError}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full py-3 font-semibold">
          {isSubmitting ? 'Connexion…' : 'Se connecter'}
        </Button>

        <p className="pt-4 text-center text-xs text-ink">
          Pas encore de compte{'\u00A0'}?{' '}
          <Link
            to="/register"
            className="font-semibold text-primary-500 underline underline-offset-2 hover:text-primary-700"
          >
            Créer un compte
          </Link>
        </p>
      </form>
    </AuthSplit>
  )
}
