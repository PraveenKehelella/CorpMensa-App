import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  /** max-w-2xl vs max-w-3xl */
  size?: 'md' | 'lg'
}

export function Modal({ open, title, onClose, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [open, onClose])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const maxW = size === 'lg' ? 'max-w-3xl max-h-[92vh]' : 'max-w-2xl max-h-[90vh]'

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${open ? '' : 'modal-hidden'}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="modal-backdrop absolute inset-0 bg-slate-900/40 cursor-default border-0 p-0"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div
        className={`modal-panel relative bg-white rounded-2xl shadow-xl ${maxW} w-full overflow-y-auto border border-slate-200`}
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            type="button"
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            onClick={onClose}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
