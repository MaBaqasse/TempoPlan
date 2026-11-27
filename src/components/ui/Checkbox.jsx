// P1 : case à cocher partagée. Utilisation : <Checkbox label="..." {...register('x')} />
import { forwardRef, useId } from 'react'

const Checkbox = forwardRef(function Checkbox({ label, error, className = '', id, ...props }, ref) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = inputId + '-erreur'

  return (
    <div className={className}>
      <label htmlFor={inputId} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-4 w-4 shrink-0 cursor-pointer rounded accent-primary-500"
          {...props}
        />
        {label}
      </label>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
})

export default Checkbox
