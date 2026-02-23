import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabaseClient'

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

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

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (path: string) => {
    return router.pathname === path || router.pathname.startsWith(path + '/')
  }

  // Ikke vis Layout på landing page, login, onboarding
  if (router.pathname === '/' || router.pathname === '/login' || router.pathname === '/onboarding') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo – alltid synlig */}
            <Link href="/" className="flex items-center font-semibold text-gray-900">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LeadFlow
              </span>
            </Link>

            {/* Desktop-navigasjon (skjules på mobil) */}
            <div className="hidden md:flex items-center space-x-1">
              <Link 
                href="/dashboard" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive('/dashboard')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                href="/leads" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive('/leads')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Leads
              </Link>
              <Link 
                href="/tasks" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive('/tasks')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Tasks
              </Link>
              <Link 
                href="/landing-pages" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive('/landing-pages')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Pages
              </Link>
              <Link 
                href="/reports" 
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive('/reports')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Reports
              </Link>
            </div>

            {/* Høyre side – brukermeny og mobilmeny-knapp */}
            <div className="flex items-center gap-2">
              {/* Hamburger-meny for mobil */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showMobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              {/* Bruker-dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {userName || 'User'}
                  </span>
                  <svg 
                    className={`w-4 h-4 text-gray-500 transition-transform hidden sm:block ${showDropdown ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{userName || 'User'}</p>
                      <p className="text-xs text-gray-500 mt-1">Signed in</p>
                    </div>
                    
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      onClick={() => setShowDropdown(false)}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Your Profile
                      </div>
                    </Link>
                    
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      onClick={() => setShowDropdown(false)}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                      </div>
                    </Link>
                    
                    <div className="border-t border-gray-100 my-1"></div>
                    
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobilmeny (dropdown) */}
          {showMobileMenu && (
            <div 
              ref={mobileMenuRef}
              className="md:hidden absolute left-0 right-0 bg-white border-t border-gray-200 shadow-lg py-2 px-4"
            >
              <div className="space-y-1">
                <Link 
                  href="/dashboard" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/dashboard')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/leads" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/leads')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Leads
                </Link>
                <Link 
                  href="/tasks" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/tasks')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Tasks
                </Link>
                <Link 
                  href="/landing-pages" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/landing-pages')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Pages
                </Link>
                <Link 
                  href="/reports" 
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive('/reports')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  Reports
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500 text-center">
            © {new Date().getFullYear()} LeadFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}