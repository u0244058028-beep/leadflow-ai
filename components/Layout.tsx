import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const getUser = async () => {
      const user = (await supabase.auth.getUser()).data.user
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()
        if (data) setUserName(data.full_name)
      }
    }
    getUser()

    // Lukk dropdown når man klikker utenfor
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link href="/" className="flex items-center font-semibold text-gray-900">
                LeadFlow
              </Link>
              <div className="ml-10 flex items-center space-x-4">
                <Link href="/leads" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Leads
                </Link>
                <Link href="/tasks" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Tasks
                </Link>
              </div>
            </div>
            
            {/* Brukermeny med dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                <span className="text-sm text-gray-700">
                  {userName || 'User'}
                </span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDropdown(false)}
                  >
                    Your Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}