// P1 : champ de formulaire partagé (label, message d’erreur, bouton « afficher le mot de passe »).
// Compatible react-hook-form : <Input label="..." error={errors.x?.message} {...register('x')} />
import { forwardRef, useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const Input = forwardRef(function Input(
  { label, error, type = 'text', className = '', id, ...props },
  ref
) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = inputId + '-erreur'
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className={
            'w-full rounded-lg border border-primary-500 bg-white px-3 py-2.5 text-sm text-ink outline-none transition ' +
            'placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/30 ' +
            'aria-invalid:border-danger aria-invalid:focus:ring-danger/30 ' +
            (isPassword ? 'pr-11' : '')
          }
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-600 hover:text-primary-500"
          >
            {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
})

export default Input
