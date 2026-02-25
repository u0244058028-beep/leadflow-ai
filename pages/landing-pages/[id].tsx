import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'

export default function EditLandingPage() {
  const router = useRouter()
  const { id } = router.query
  const [activeTab, setActiveTab] = useState<'settings' | 'fields' | 'preview' | 'mobile'>('preview')
  const [page, setPage] = useState<any>(null)
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Settings state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [template, setTemplate] = useState('modern')

  useEffect(() => {
    if (id) loadData()
  }, [id])

  async function loadData() {
    const { data: pageData } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('id', id)
      .single()

    if (!pageData) {
      router.push('/landing-pages')
      return
    }

    setPage(pageData)
    setTitle(pageData.title)
    setDescription(pageData.description || '')
    setPrimaryColor(pageData.primary_color || '#3b82f6')
    setTemplate(pageData.template || 'modern')

    const { data: fieldsData } = await supabase
      .from('landing_page_fields')
      .select('*')
      .eq('landing_page_id', id)
      .order('sort_order')

    setFields(fieldsData || [])
    setLoading(false)
  }

  async function saveSettings() {
    setSaving(true)
    await supabase
      .from('landing_pages')
      .update({ title, description, primary_color: primaryColor, template })
      .eq('id', id)
    setSaving(false)
    alert('Settings saved!')
  }

  if (loading || !page) return <Layout>Loading...</Layout>

  return (
    <Layout>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button 
          onClick={() => router.push('/landing-pages')} 
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          ← Back to Pages
        </button>
        <button
          onClick={saveSettings}
          disabled={saving}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-lg border-b border-gray-200">
        <nav className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚙️ Settings
          </button>
          <button
            onClick={() => setActiveTab('fields')}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'fields'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📄 Form Fields
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'preview'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            👁️ Desktop Preview
          </button>
          <button
            onClick={() => setActiveTab('mobile')}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
              activeTab === 'mobile'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📱 Mobile View
          </button>
        </nav>
      </div>

      {/* Main content */}
      <div className="bg-white rounded-b-lg shadow p-6">
        {activeTab === 'settings' && (
          <div className="space-y-4 max-w-xl">
            <h2 className="text-lg font-semibold mb-4">Page Settings</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1">Page Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border rounded-md p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded-md p-2"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Template</label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full border rounded-md p-2"
              >
                <option value="modern">Modern</option>
                <option value="minimal">Minimal</option>
                <option value="professional">Professional</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-10 border rounded"
                />
                <span className="text-sm text-gray-600">{primaryColor}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fields' && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Form Fields</h2>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium">{field.label}</span>
                    {field.required && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Required</span>}
                  </div>
                  <input
                    type={field.field_type}
                    placeholder={field.placeholder}
                    className="w-full border rounded-md p-2 bg-white"
                    disabled
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="flex justify-center">
            <div className="max-w-2xl w-full border rounded-lg p-6" style={{ backgroundColor: '#f9fafb' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: primaryColor }}>
                {title || 'My Lead Assistant'}
              </h2>
              {description && (
                <p className="text-gray-600 mb-6">{description}</p>
              )}
              
              {fields.map((field, index) => (
                <div key={index} className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={field.field_type}
                    placeholder={field.placeholder}
                    className="w-full border rounded-md p-2"
                    disabled
                  />
                </div>
              ))}
              
              <button
                className="w-full py-2 text-white rounded-md"
                style={{ backgroundColor: primaryColor }}
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {activeTab === 'mobile' && (
          <div className="flex justify-center">
            {/* Mobil-telefon-ramme */}
            <div className="bg-gray-900 rounded-[40px] p-3 shadow-2xl max-w-[380px] w-full">
              <div className="bg-white rounded-[32px] overflow-hidden h-[700px] overflow-y-auto">
                <div className="p-4" style={{ backgroundColor: '#f9fafb' }}>
                  <h2 className="text-lg font-bold mb-3" style={{ color: primaryColor }}>
                    {title || 'My Lead Assistant'}
                  </h2>
                  {description && (
                    <p className="text-sm text-gray-600 mb-4">{description}</p>
                  )}
                  
                  {fields.map((field, index) => (
                    <div key={index} className="mb-3">
                      <label className="block text-xs font-medium mb-1">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type={field.field_type}
                        placeholder={field.placeholder}
                        className="w-full border rounded-md p-2 text-sm"
                        disabled
                      />
                    </div>
                  ))}
                  
                  <button
                    className="w-full py-2 text-sm text-white rounded-md"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}