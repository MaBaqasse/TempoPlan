// P1 (bonus) : fenêtre de confirmation, utile pour « Supprimer l’activité ? ».
//
//   <ConfirmDialog
//     open={toDelete !== null} onClose={() => setToDelete(null)}
//     onConfirm={() => { deleteActivity(toDelete); setToDelete(null) }}
//     title="Supprimer cette activité ?" message="Cette action est définitive."
//     confirmLabel="Supprimer" danger
//   />
import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  danger = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          {danger ? (
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center justify-center rounded-lg bg-danger px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
            >
              {confirmLabel}
            </button>
          ) : (
            <Button onClick={onConfirm}>{confirmLabel}</Button>
          )}
        </>
      }
    >
      {message && <p className="text-muted">{message}</p>}
    </Modal>
  )
}
