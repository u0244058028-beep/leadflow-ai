import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'
import Link from 'next/link'

export default function LandingPages() {
  const [pages, setPages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPages()
  }, [])

  async function loadPages() {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    const { data } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setPages(data || [])
    setLoading(false)
  }

  async function togglePublish(pageId: string, current: boolean) {
    await supabase
      .from('landing_pages')
      .update({ 
        is_published: !current,
        published_at: !current ? new Date().toISOString() : null
      })
      .eq('id', pageId)
    loadPages()
  }

  async function deletePage(pageId: string) {
    if (!confirm('Are you sure? This will delete the page and all its leads.')) return
    await supabase.from('landing_pages').delete().eq('id', pageId)
    loadPages()
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Landing Pages</h1>
        <div className="flex gap-2">
          <Link
            href="/landing-pages/ai-generate"
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90 flex items-center gap-2"
          >
            🤖 AI Generate
          </Link>
          <Link
            href="/landing-pages/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + Create Manually
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading pages...</p>
        </div>
      ) : pages.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">You haven't created any landing pages yet.</p>
          <div className="flex gap-2 justify-center">
            <Link
              href="/landing-pages/ai-gener