import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Layout from '@/components/Layout'

export default function EditLandingPage() {
  const router = useRouter()
  const { id } = router.query
  const [page, setPage] = useState<any>(null)
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) loadData()
  }, [id])

  async function loadData() {
    const { data: pageData } = await supabase
      .from('landing_pages')
      .select('*')
      .eq('id', id)
      .single()

    const { data: fieldsData } = await supabase
      .from('landing_page_fields')
      .select('*')
      .eq('landing_page_id', id)
      .order('sort_order')

    setPage(pageData)
    setFields(fieldsData || [])
    setLoading(false)
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

    const { data } = await supabase
      .from('landing_page_fields')
      .insert(newField)
      .select()
      .single()

    setFields([...fields, data])
  }

  if (loading || !page) return <Layout>Loading...</Layout>

  return (
    <Layout>
      <div className="mb-4">
        <button onClick={() => router.back()} className="text-blue-600">
          ← Back
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-6">Edit: {page.title}</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Venstre: Innstillinger */}
        <div className="col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-4">Page Settings</h2>
          {/* Settings form her */}
        </div>

        {/* Midten: Forhåndsvisning */}
        <div className="col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold mb-4">Preview</h2>
          <div className="border rounded-lg p-6" style={{ backgroundColor: '#f9fafb' }}>
            <h3 style={{ color: page.primary_color }} className="text-xl font-bold mb-4">
              {page.title}
            </h3>
            {fields.map(field => (
              <div key={field.id} className="mb-4">
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
              style={{ backgroundColor: page.primary_color }}
            >
              Submit
            </button>
          </div>
        </div>

        {/* Høyre: Felter */}
        <div className="col-span-1 bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Form Fields</h2>
            <button
              onClick={addField}
              className="text-sm px-2 py-1 bg-blue-600 text-white rounded"
            >
              + Add Field
            </button>
          </div>
          
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="p-2 border rounded bg-gray-50">
                <input
                  type="text"
                  value={field.label}
                  onChange={async (e) => {
                    await supabase
                      .from('landing_page_fields')
                      .update({ label: e.target.value })
                      .eq('id', field.id)
                    loadData()
                  }}
                  className="w-full text-sm border rounded p-1 mb-1"
                />
                <select
                  value={field.field_type}
                  onChange={async (e) => {
                    await supabase
                      .from('landing_page_fields')
                      .update({ field_type: e.target.value })
                      .eq('id', field.id)
                    loadData()
                  }}
                  className="w-full text-sm border rounded p-1"
                >
                  <option value="text">Text</option>
                  <option value="email">Email</option>
                  <option value="tel">Phone</option>
                  <option value="textarea">Textarea</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}