import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '@/lib/supabaseClient'

interface Props {
  leadId: string
  onUploadComplete: () => void
}

export default function FileUpload({ leadId, onUploadComplete }: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const user = (await supabase.auth.getUser()).data.user
    if (!user) return

    for (const file of acceptedFiles) {
      setUploading(true)
      setUploadProgress(0)

      try {
        // Generer unikt filnavn
        const fileExt = file.name.split('.').pop()
        const fileName = `${leadId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        // Last opp til Supabase Storage
        const { error: uploadError, data } = await supabase.storage
          .from('lead-files')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) throw uploadError

        // Hent public URL
        const { data: { publicUrl } } = supabase.storage
          .from('lead-files')
          .getPublicUrl(filePath)

        // Lagre metadata i databasen
        const { error: dbError } = await supabase
          .from('lead_files')
          .insert({
            lead_id: leadId,
            user_id: user.id,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            storage_path: filePath,
            is_image: file.type.startsWith('image/')
          })

        if (dbError) throw dbError

        setUploadProgress(100)
        setTimeout(() => {
          setUploadProgress(0)
          onUploadComplete()
        }, 1000)

      } catch (error: any) {
        // Løsning: type-casting for å håndtere error.message
        const errorMessage = error?.message || 'Unknown error occurred'
        console.error('Upload error:', errorMessage)
        alert('Failed to upload file: ' + errorMessage)
      } finally {
        setUploading(false)
      }
    }
  }, [leadId, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled: uploading
  })

  return (
    <div className="mt-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
          </div>
        ) : (
          <>
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {isDragActive ? (
              <p className="text-blue-600">Drop files here...</p>
            ) : (
              <div>
                <p className="text-gray-700 mb-1">Drag & drop files here</p>
                <p className="text-sm text-gray-500">or click to select (max 50MB)</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}