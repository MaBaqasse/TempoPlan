// P1 : fenêtre modale accessible (basée sur l’élément natif <dialog> : focus géré, Échap, fond inactif).
//
//   const [open, setOpen] = useState(false)
//   <Modal
//     open={open} onClose={() => setOpen(false)}
//     title="Un imprévu ?" description="Dites-nous ce qui a changé." size="md"
//     footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Annuler</Button><Button>Valider</Button></>}
//   >
//     ...contenu (formulaire, aperçu...)...
//   </Modal>
//
// Le contenu n’est affiché que lorsque la fenêtre est ouverte (un formulaire repart donc à zéro à chaque ouverture).
import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  children,
}) {
  const ref = useRef(null)
  const titleId = useId()
  const descId = useId()

  // Ouvre ou ferme le <dialog> natif selon la valeur de "open"
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Empêche la page de défiler derrière la fenêtre
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault() // Échap : on laisse React fermer la fenêtre
        onClose()
      }}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose()
      }}
      className={
        'm-auto w-[calc(100%-2rem)] overflow-hidden rounded-2xl bg-white p-0 text-ink shadow-2xl backdrop:bg-primary-950/50 ' +
        'translate-y-2 opacity-0 transition duration-200 open:translate-y-0 open:opacity-100 starting:open:translate-y-2 starting:open:opacity-0 ' +
        'motion-reduce:transition-none ' +
        sizes[size]
      }
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-4 border-b border-primary-100 px-6 py-4">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-ink">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-sm text-muted">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="-mr-2 rounded-lg p-2 text-slate-600 transition-colors hover:bg-primary-50 hover:text-primary-600"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="overflow-y-auto px-6 py-5">{children}</div>

          {footer && (
            <div className="flex flex-wrap justify-end gap-3 border-t border-primary-100 bg-primary-50/50 px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  )
}
