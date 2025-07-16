import * as React from "react"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "../../lib/utils"
import { Toast as ToastType, useToastStore } from "../../stores/toast-store"
import { Button } from "./button"

const toastVariants = {
  info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
  success: "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
  error: "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
}

const toastIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle
}

interface ToastProps {
  toast: ToastType
}

export function Toast({ toast }: ToastProps) {
  const { removeToast } = useToastStore()
  const [isVisible, setIsVisible] = React.useState(false)
  const [isPaused, setIsPaused] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  const Icon = toastIcons[toast.type]

  React.useEffect(() => {
    setIsVisible(true)
    
    if (toast.duration && toast.duration > 0) {
      const startTimeout = () => {
        timeoutRef.current = setTimeout(() => {
          handleClose()
        }, toast.duration)
      }

      if (!isPaused) {
        startTimeout()
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }
  }, [toast.duration, isPaused])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => removeToast(toast.id), 300)
  }

  const handleMouseEnter = () => {
    setIsPaused(true)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleMouseLeave = () => {
    setIsPaused(false)
  }

  return (
    <div
      className={cn(
        "pointer-events-auto relative flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300",
        toastVariants[toast.type],
        isVisible ? "animate-toast-slide-in" : "animate-toast-slide-out"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1 space-y-1">
        {toast.title && (
          <div className="font-semibold text-sm">{toast.title}</div>
        )}
        <div className="text-sm opacity-90">{toast.message}</div>
        
        {toast.action && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toast.action.onClick}
            className="h-auto p-0 text-xs underline hover:no-underline"
          >
            {toast.action.label}
          </Button>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleClose}
        className="h-6 w-6 flex-shrink-0 opacity-70 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function ToastContainer() {
  const { toasts } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  )
}