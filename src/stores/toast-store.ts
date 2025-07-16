import { create } from 'zustand'
import { generateId } from '../lib/utils'

export interface Toast {
  id: string
  title?: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = generateId()
    const newToast: Toast = {
      id,
      duration: 5000, // 5 seconds default
      ...toast
    }

    set((state) => ({
      toasts: [...state.toasts, newToast]
    }))

    // Auto-remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, newToast.duration)
    }
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(toast => toast.id !== id)
  })),

  clearToasts: () => set({ toasts: [] })
}))

// Convenience functions for different toast types
export const toast = {
  info: (message: string, options?: Partial<Toast>) => 
    useToastStore.getState().addToast({ message, type: 'info', ...options }),
  
  success: (message: string, options?: Partial<Toast>) => 
    useToastStore.getState().addToast({ message, type: 'success', ...options }),
  
  warning: (message: string, options?: Partial<Toast>) => 
    useToastStore.getState().addToast({ message, type: 'warning', ...options }),
  
  error: (message: string, options?: Partial<Toast>) => 
    useToastStore.getState().addToast({ message, type: 'error', ...options })
}