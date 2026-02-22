import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'

interface Field {
  id?: string
  field_type: string
  label: string
  placeholder: string
  required: boolean
  sort_order: number
}

export default function EditLandingPage() {
  const router = useRouter()
  const { id } = router.query
  const [activeTab, setActiveTab] = useState<'settings' | 'fields' | 'preview'>('fields')
  const [page, setPage] = useState<any>(null)
  const [fields, setFields] = useState<Field[]>([])
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
    setLoading(true)
    try {
      // Hent page data
      const { data: pageData, error: pageError } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('id', id)
        .single()

      if (pageError || !pageData) {
        console.error('Page error:', pageError)
        router.push('/landing-pages')
        return
      }

      setPage(pageData)
      setTitle(pageData.title || '')
      setDescription(pageData.description || '')
      setPrimaryColor(pageData.primary_color || '#3b82f6')
      setTemplate(pageData.template || 'modern')

      // Hent fields
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('landing_page_fields')
        .select('*')
        .eq('landing_page_id', id)
        .order('sort_order')

      if (fieldsError) {
        console.error('Fields error:', fieldsError)
      }

      setFields(fieldsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function addField() {
    const newField = {
      landing_page_id: id,
      field_type: 'text',
      label: 'New Field',
      placeholder: '',
      required: true,
      sort_order: fields.length
    }

    const { data, error } = await supabase
      .from('landing_page_fields')
      .insert(newField)
      .select()
      .single()

    if (!error && data) {
      setFields([...fields, data])
    }
  }

  async function updateField(fieldId: string, updates: Partial<Field>) {
    const { error } = await supabase
      .from('landing_page_fields')
      .update(updates)
      .eq('id', fieldId)

    if (!error) {
      setFields(fields.map(f => 
        f.id === fieldId ? { ...f, ...updates } : f
      ))
    }
  }

  async function deleteField(fieldId: string) {
    if (!confirm('Delete this field?')) return
    const { error } = await supabase
      .from('landing_page_fields')
      .delete()
      .eq('id', fieldId)

    if (!error) {
      setFields(fields.filter(f => f.id !== fieldId))
    }
  }

  async function moveField(index: number, direction: 'up' | 'down') {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === fields.length - 1) return

    const newFields = [...fields]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    
    // Swap i UI
    ;[newFields[index], newFields[swapIndex]] = [newFields[swapIndex], newFields[index]]
    
    // Oppdater sort_order i UI
    newFields.forEach((f, i) => f.sort_order = i)
    setFields(newFields)

    // Oppdater i databasen
    await Promise.all([
      supabase.from('landing_page_fields').update({ sort_order: swapIndex }).eq('id', fields[index].id),
      supabase.from('landing_page_fields').update({ sort_order: index }).eq('id', fields[swapIndex].id)
    ])
  }

  async function saveSettings() {
    setSaving(true)
    const { error } = await supabase
      .from('landing_pages')
      .update({ 
        title, 
        description, 
        primary_color: primaryColor, 
        template 
      })
      .eq('id', id)

    if (!error) {
      alert('Settings saved!')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading page editor...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!page) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-500">Page not found</p>
          <button
            onClick={() => router.push('/landing-pages')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Back to Pages
          </button>
        </div>
      </Layout>
    )
  }

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
        <nav className="flex">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'settings'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⚙️ Settings
          </button>
          <button
            onClick={() => setActiveTab('fields')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'fields'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📄 Form Fields
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'preview'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            👁️ Preview
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Form Fields</h2>
              <button
                onClick={addField}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                + Add Field
              </button>
            </div>

            <div className="space-y-2 max-w-xl">
              {fields.map((field, index) => (
                <div key={field.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveField(index, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveField(index, 'down')}
                        disabled={index === fields.length - 1}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                    <select
                      value={field.field_type}
                      onChange={(e) => updateField(field.id!, { field_type: e.target.value })}
                      className="text-sm border rounded p-1"
                    >
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="tel">Phone</option>
                      <option value="textarea">Textarea</option>
                    </select>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(field.id!, { label: e.target.value })}
                      className="flex-1 text-sm border rounded p-1"
                      placeholder="Field label"
                    />
                    <label className="flex items-center gap-1 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => {
                          console.log('Checkbox clicked:', e.target.checked)
                          updateField(field.id!, { required: e.target.checked })
                        }}
                        className="cursor-pointer"
                      />
                      Required
                    </label>
                    <button
                      onClick={() => deleteField(field.id!)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      🗑️
                    </button>
                  </div>
                  <input
                    type="text"
                    value={field.placeholder || ''}
                    onChange={(e) => updateField(field.id!, { placeholder: e.target.value })}
                    className="w-full text-sm border rounded p-1"
                    placeholder="Placeholder text (optional)"
                  />
                </div>
              ))}

              {fields.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                  No fields yet. Click "Add Field" to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="flex justify-center">
            <div className="max-w-md w-full border rounded-lg p-6" style={{ backgroundColor: '#f9fafb' }}>
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
                  {field.field_type === 'textarea' ? (
                    <textarea
                      placeholder={field.placeholder}
                      className="w-full border rounded-md p-2"
                      rows={4}
                      disabled
                    />
                  ) : (
                    <input
                      type={field.field_type}
                      placeholder={field.placeholder}
                      className="w-full border rounded-md p-2"
                      disabled
                    />
                  )}
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
      </div>
    </Layout>
  )
}