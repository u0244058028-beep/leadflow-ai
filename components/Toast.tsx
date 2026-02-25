import { useEffect, useState, createContext, useContext } from 'react'
import ReactDOM from 'react-dom'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
  duration?: number
  onClose: () => void
}

function Toast({ message, type = 'info', duration = 4000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])
  
  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }
  
  return (
    <div className={`${colors[type]} border rounded-lg shadow-lg p-4 max-w-md animate-slide-up`}>
      <div className="flex items-center gap-3">
        <span className="text-xl">{icons[type]}</span>
        <p className="text-sm flex-1">{message}</p>
        <button 
          onClick={onClose} 
          className="text-gray-500 hover:text-gray-700 transition"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// Toast Context
interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: any }>>([])
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  
  const showToast = (message: string, type: any = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
  }
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }
  
  const contextValue: ToastContextType = {
    showToast,
    success: (msg: string) => showToast(msg, 'success'),
    error: (msg: string) => showToast(msg, 'error'),
    info: (msg: string) => showToast(msg, 'info'),
    warning: (msg: string) => showToast(msg, 'warning')
  }
  
  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {mounted && ReactDOM.createPortal(
        <div className="fixed bottom-4 right-4 space-y-2 z-[100]">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}