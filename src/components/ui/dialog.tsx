'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Info } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'info'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-sm bg-background/90 backdrop-blur-2xl border border-border/60 rounded-3xl shadow-2xl p-7 flex flex-col gap-5">
              {/* Icon + Title */}
              <div className="flex items-start gap-4">
                <div className={`mt-0.5 shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center ${
                  variant === 'danger' ? 'bg-destructive/10' : 'bg-primary/10'
                }`}>
                  {variant === 'danger'
                    ? <AlertTriangle size={18} className="text-destructive" />
                    : <Info size={18} className="text-primary" />
                  }
                </div>
                <div>
                  <p className="font-medium text-foreground leading-tight">{title}</p>
                  <p className="mt-1 text-sm font-light text-muted-foreground leading-relaxed">{message}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onCancel}
                  className="px-5 py-2.5 text-sm font-medium rounded-full border border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className={`px-5 py-2.5 text-sm font-medium rounded-full transition-all ${
                    variant === 'danger'
                      ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}


interface ToastProps {
  isOpen: boolean
  message: string
  variant?: 'error' | 'success' | 'info'
  onClose: () => void
}

export function Toast({ isOpen, message, variant = 'error', onClose }: ToastProps) {
  const colors = {
    error: 'bg-destructive/10 border-destructive/20 text-destructive',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500',
    info: 'bg-primary/10 border-primary/20 text-primary',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-auto max-w-sm"
        >
          <div
            onClick={onClose}
            className={`cursor-pointer px-5 py-3 rounded-2xl border backdrop-blur-xl text-sm font-light shadow-lg ${colors[variant]}`}
          >
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
