import { useState } from 'react'
import Button from './Button'

interface Props {
  message: string
  details?: string
  onRetry?: () => void
  className?: string
}

export default function ErrorMessage({ message, details, onRetry, className = '' }: Props) {
  const [showDetails, setShowDetails] = useState(false)
  
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="text-red-600 text-xl mt-0.5">⚠️</div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-1">
            {message}
          </h3>
          
          {details && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-red-600 hover:text-red-800 underline mb-2 inline-block"
            >
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
          )}
          
          {showDetails && details && (
            <pre className="text-xs bg-red-100 p-3 rounded-lg overflow-x-auto mb-3 font-mono">
              {details}
            </pre>
          )}
          
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="danger"
              size="sm"
            >
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}