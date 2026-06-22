import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  onOk?: () => void
  okText?: string
  cancelText?: string
  hideCancel?: boolean
  width?: string | number
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export default function Modal({
  open,
  title,
  onClose,
  onOk,
  okText = '确定',
  cancelText = '取消',
  hideCancel = false,
  width = 520,
  children,
  footer,
  className,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative bg-white rounded-lg shadow-xl flex flex-col max-h-[90vh]',
          className
        )}
        style={{ width: typeof width === 'number' ? `${width}px` : width }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {footer !== undefined ? (
          footer
        ) : (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
            {!hideCancel && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md text-sm text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                {cancelText}
              </button>
            )}
            {onOk && (
              <button
                onClick={onOk}
                className="px-4 py-2 rounded-md text-sm text-white bg-[#1e3a5f] hover:bg-[#163049] transition-colors"
              >
                {okText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
