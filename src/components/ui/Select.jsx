// P1 : liste déroulante partagée. Utilisation : <Select label="..." {...register('x')}><option>...</option></Select>
import { forwardRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(function Select(
  { label, error, className = '', id, children, ...props },
  ref
) {
  const autoId = useId()
  const selectId = id ?? autoId
  const errorId = selectId + '-erreur'

  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className={
            'w-full appearance-none rounded-lg border border-primary-500 bg-white px-3 py-2.5 pr-10 text-sm text-ink outline-none transition ' +
            'focus:ring-2 focus:ring-primary-500/30 aria-invalid:border-danger aria-invalid:focus:ring-danger/30'
          }
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-700"
          aria-hidden="true"
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
})

export default Select
