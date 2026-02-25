import React from 'react'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'white' | 'gray'
  className?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'blue',
  className = '' 
}: Props) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3'
  }
  
  const colorClasses = {
    blue: 'border-blue-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-300 border-t-gray-600'
  }
  
  return (
    <div 
      className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="loading"
    />
  )
}