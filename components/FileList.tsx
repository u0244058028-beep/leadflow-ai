import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface FileItem {
  id: string
  file_name: string
  file_size: number
  file_type: string
  storage_path: string
  is_image: boolean
  created_at: string
}

interface Props {
  leadId: string
  onFileDeleted: () => void
}

export default function FileList({ leadId, onFileDeleted }: Props) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadFiles()
  }, [leadId])

  async function loadFiles() {
    setLoading(true)
    const { data, error } = await supabase
      .from('lead_files')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setFiles(data)
    }
    setLoading(false)
  }

  async function deleteFile(fileId: string, storagePath: string) {
    if (!confirm('Are you sure you want to delete this file?')) return

    setDeleting(fileId)
    
    try {
      // Slett fra Storage
      const { error: storageError } = await supabase.storage
        .from('lead-files')
        .remove([storagePath])

      if (storageError) throw storageError

      // Slett metadata fra database
      const { error: dbError } = await supabase
        .from('lead_files')
        .delete()
        .eq('id', fileId)

      if (dbError) throw dbError

      await loadFiles()
      onFileDeleted()
      
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete file')
    } finally {
      setDeleting(null)
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  function getFileIcon(fileType: string) {
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType.includes('pdf')) return '📄'
    if (fileType.includes('word') || fileType.includes('document')) return '📝'
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊'
    if (fileType.includes('zip') || fileType.includes('rar')) return '🗜️'
    return '📎'
  }

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Loading files...</div>
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
        <p>No files uploaded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {files.map((file) => {
        const { data: { publicUrl } } = supabase.storage
          .from('lead-files')
          .getPublicUrl(file.storage_path)

        return (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl">{getFileIcon(file.file_type)}</span>
              
              {file.is_image ? (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline truncate"
                >
                  {file.file_name}
                </a>
              ) : (
                <a
                  href={publicUrl}
                  download
                  className="text-blue-600 hover:underline truncate"
                >
                  {file.file_name}
                </a>
              )}
              
              <span className="text-xs text-gray-500 flex-shrink-0">
                {formatFileSize(file.file_size)}
              </span>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
              {file.is_image && (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-gray-500 hover:text-blue-600"
                  title="View"
                >
                  👁️
                </a>
              )}
              <a
                href={publicUrl}
                download
                className="p-1 text-gray-500 hover:text-green-600"
                title="Download"
              >
                ⬇️
              </a>
              <button
                onClick={() => deleteFile(file.id, file.storage_path)}
                disabled={deleting === file.id}
                className="p-1 text-gray-500 hover:text-red-600 disabled:opacity-50"
                title="Delete"
              >
                {deleting === file.id ? '...' : '🗑️'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}