import { useEffect, useRef } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  leadName: string
  leadEmail?: string
  userName: string
}

declare global {
  interface Window {
    Cal?: any
  }
}

export default function BookingModal({ isOpen, onClose, leadName, leadEmail, userName }: Props) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Last inn Cal.com script hvis det ikke finnes
    if (!document.querySelector('script[src*="cal.com/embed.js"]')) {
      const script = document.createElement('script')
      script.src = 'https://app.cal.com/embed.js'
      script.async = true
      document.body.appendChild(script)

      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://app.cal.com/embed.css'
      document.body.appendChild(link)
    }

    // Initialiser Cal når scriptet er lastet
    const checkCal = setInterval(() => {
      if (window.Cal) {
        clearInterval(checkCal)
        window.Cal("init", {
          origin: "https://app.cal.com",
        })
      }
    }, 100)

    return () => clearInterval(checkCal)
  }, [])

  useEffect(() => {
    // Lukk modal når man klikker utenfor
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // DIN personlige Cal.com-link – preutfyller lead-info
  const calLink = `https://cal.com/cosmic-encounters-i4baji/15min`
  const calUrl = `${calLink}?name=${encodeURIComponent(leadName)}&email=${encodeURIComponent(leadEmail || '')}&guests=${encodeURIComponent(leadEmail || '')}`

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 opacity-100"
      >
        {/* Header med gradient */}
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              📅
            </span>
            Schedule a meeting with {leadName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 h-[600px]">
          <iframe
            src={calUrl}
            className="w-full h-full border-0 rounded-lg"
            title="Schedule meeting"
          />
        </div>
      </div>
    </div>
  )
}