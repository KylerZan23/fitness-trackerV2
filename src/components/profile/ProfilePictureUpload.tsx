/**
 * Profile Picture Upload Component
 * ------------------------------------------------
 * This component handles profile picture uploads and displays
 */

import { useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
const supabase = createClient()
import Image from 'next/image'

interface ProfilePictureUploadProps {
  userId: string
  existingUrl: string | null
  onUploadComplete: (url: string) => void
}

export const ProfilePictureUpload = ({
  userId,
  existingUrl,
  onUploadComplete,
}: ProfilePictureUploadProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingUrl)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createBucketIfNotExists = async (bucketName: string): Promise<boolean> => {
    try {
      // First check if the bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()

      if (listError) {
        console.error('Error listing buckets:', listError)
        throw listError
      }

      // Check if our bucket exists in the list
      const bucketExists = buckets.some(bucket => bucket.name === bucketName)

      if (!bucketExists) {
        console.log(`Bucket '${bucketName}' not found, creating it...`)
        // Create the bucket with public access
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 2097152, // 2MB in bytes
        })

        if (createError) {
          console.error('Error creating bucket:', createError)
          throw createError
        }

        // Create a policy to allow authenticated users to upload
        try {
          const { error: policyError } = await supabase.rpc('create_storage_policy', {
            bucket_name: bucketName,
            policy_name: 'Avatar Upload Policy',
            definition: '(auth.uid() IS NOT NULL)',
          })

          if (policyError) {
            console.error('Error creating policy (continuing anyway):', policyError)
          }
        } catch (policyErr) {
          console.error('Policy creation error (continuing anyway):', policyErr)
          // Continue anyway as policy management might require admin rights
        }
      }

      return true
    } catch (err) {
      console.error('Error in bucket creation:', err)
      return false
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image size must be less than 2MB')
      return
    }

    // Create a temporary URL for preview first
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    try {
      setIsUploading(true)
      setError(null)

      // Proceed with saving image as data URI
      const reader = new FileReader()
      reader.onload = async e => {
        try {
          const dataUrl = e.target?.result as string

          // Update the profile with the data URI using RPC call
          const { error: updateError } = await supabase.rpc('update_profile_picture', {
            user_id: userId,
            picture_url: dataUrl,
          })

          if (updateError) {
            console.error('Profile update error:', updateError)
            throw updateError
          }

          // Notify parent component
          onUploadComplete(dataUrl)

          console.log('Profile picture updated successfully as data URI')
        } catch (err) {
          console.error('Error saving profile picture:', err)
          
          // Log detailed error for developers
          if (err && typeof err === 'object') {
            console.error('Detailed error information:', {
              message: 'message' in err ? err.message : 'Unknown error',
              code: 'code' in err ? err.code : 'No error code',
              details: 'details' in err ? err.details : 'No additional details',
              hint: 'hint' in err ? err.hint : 'No hint available'
            })
          }

          // Set generic user-friendly error message
          setError('Could not upload profile picture. Please try again later or contact support if the issue persists.')
          setPreviewUrl(existingUrl)
        } finally {
          setIsUploading(false)
        }
      }

      reader.onerror = () => {
        console.error('FileReader error occurred')
        setError('Could not read the selected file. Please try again.')
        setPreviewUrl(existingUrl)
        setIsUploading(false)
      }

      // Read the file as a data URL
      reader.readAsDataURL(file)
    } catch (err) {
      console.error('Error in file handling:', err)
      
      // Log detailed error for developers
      if (err && typeof err === 'object') {
        console.error('Detailed error information:', {
          message: 'message' in err ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : 'No stack trace'
        })
      }

      // Set generic user-friendly error message
      setError('Could not process the selected file. Please try again later or contact support if the issue persists.')
      setPreviewUrl(existingUrl)
      setIsUploading(false)

      // Revoke the temporary URL to avoid memory leaks
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="mb-6">
      <div className="flex flex-col items-center">
        <div
          className="w-32 h-32 rounded-full overflow-hidden bg-white/5 border border-white/10 relative mb-4 cursor-pointer"
          onClick={triggerFileInput}
        >
          {previewUrl ? (
            <Image src={previewUrl} alt="Profile" fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
          )}

          {/* Overlay with camera icon */}
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        </div>

        <button
          type="button"
          onClick={triggerFileInput}
          disabled={isUploading}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-sm font-medium"
        >
          {isUploading ? 'Uploading...' : 'Change Profile Picture'}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg, image/png, image/gif, image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
