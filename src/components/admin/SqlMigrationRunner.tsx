/**
 * SQL Migration Runner Component
 * ------------------------------------------------
 * This component allows users with admin privileges to run
 * SQL migrations directly from the application interface.
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface SqlMigrationRunnerProps {
  adminOnly?: boolean
  defaultSql?: string
  description?: string
  migrationName?: string
}

export const SqlMigrationRunner = ({
  adminOnly = true,
  defaultSql = '',
  description = 'Run SQL migrations to fix database issues',
  migrationName = 'Custom SQL Migration'
}: SqlMigrationRunnerProps) => {
  const [sql, setSql] = useState(defaultSql || PROFILE_PICTURE_MIGRATION)
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<null | {
    success: boolean
    message: string
    details?: string
  }>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  // Check if user has admin role
  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setIsAdmin(false)
        return false
      }
      
      // Get user's roles from profiles table or from auth metadata
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
        return false
      }
      
      // Check if role is admin
      const isUserAdmin = profile?.role === 'admin'
      setIsAdmin(isUserAdmin)
      return isUserAdmin
    } catch (err) {
      console.error('Error in admin check:', err)
      setIsAdmin(false)
      return false
    }
  }

  // Run the SQL migration
  const runMigration = async () => {
    if (adminOnly && !isAdmin) {
      setResult({
        success: false,
        message: 'Admin privileges required to run SQL migrations'
      })
      return
    }
    
    setIsRunning(true)
    setResult(null)
    
    try {
      // Use RPC function to run SQL with admin privileges
      const { error } = await supabase.rpc('run_sql_migration', { 
        sql_script: sql,
        migration_name: migrationName 
      })
      
      if (error) {
        // Fallback to individual SQL commands if RPC fails
        console.error('RPC migration failed:', error)
        
        // Try to run profile picture specific migrations
        if (sql.includes('profile_picture_url')) {
          // Add column
          const { error: columnError } = await supabase.rpc('add_profile_picture_column')
          
          if (columnError) {
            throw new Error(`Failed to add column: ${columnError.message}`)
          }
          
          setResult({
            success: true,
            message: 'Profile picture column added successfully',
            details: 'The database has been updated to support profile pictures.'
          })
        } else {
          throw new Error(`Migration failed: ${error.message}`)
        }
      } else {
        setResult({
          success: true,
          message: 'SQL migration completed successfully',
          details: 'The database has been updated with the requested changes.'
        })
      }
    } catch (err) {
      console.error('Error running migration:', err)
      let errorMessage = 'An error occurred while running the SQL migration'
      
      if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        errorMessage = err.message
      }
      
      setResult({
        success: false,
        message: 'Migration failed',
        details: errorMessage
      })
    } finally {
      setIsRunning(false)
    }
  }
  
  // Run specific profile picture fix
  const runProfilePictureFix = async () => {
    setSql(PROFILE_PICTURE_MIGRATION)
    await runMigration()
  }
  
  // Effect to check admin status on mount
  useEffect(() => {
    checkAdminStatus()
  }, [])
  
  if (adminOnly && isAdmin === false) {
    return null // Don't render for non-admins if adminOnly is true
  }
  
  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <h3 className="text-lg font-medium mb-2">{migrationName || 'Database Migration Tool'}</h3>
      <p className="text-white/60 mb-4 text-sm">{description}</p>
      
      {showEditor && (
        <div className="mb-4">
          <textarea
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            className="w-full h-64 bg-black/50 text-white/90 p-3 font-mono text-xs rounded-md border border-white/10"
            placeholder="Enter SQL migration script..."
            disabled={isRunning}
          />
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={runProfilePictureFix}
          disabled={isRunning}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 transition-colors rounded-lg text-sm font-medium"
        >
          {isRunning ? 'Running...' : 'Fix Profile Pictures'}
        </button>
        
        <button
          type="button"
          onClick={() => setShowEditor(!showEditor)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-sm font-medium"
        >
          {showEditor ? 'Hide SQL Editor' : 'Show SQL Editor'}
        </button>
        
        {showEditor && (
          <button
            type="button"
            onClick={runMigration}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg text-sm font-medium"
          >
            {isRunning ? 'Running Custom SQL...' : 'Run Custom SQL'}
          </button>
        )}
      </div>
      
      {result && (
        <div className={`mt-4 p-3 rounded-lg ${
          result.success 
            ? 'bg-green-900/20 border border-green-500/30' 
            : 'bg-red-900/20 border border-red-500/30'
        }`}>
          <p className={`text-sm font-medium ${
            result.success ? 'text-green-400' : 'text-red-400'
          }`}>
            {result.message}
          </p>
          {result.details && (
            <p className="text-white/60 text-xs mt-1">{result.details}</p>
          )}
        </div>
      )}
    </div>
  )
}

// Default Profile Picture Migration SQL
const PROFILE_PICTURE_MIGRATION = `-- Add profile_picture_url column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Create add_profile_picture_column function
CREATE OR REPLACE FUNCTION add_profile_picture_column()
RETURNS VOID AS $$
BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_profile_picture_column() TO authenticated;
GRANT EXECUTE ON FUNCTION add_profile_picture_column() TO anon;
GRANT EXECUTE ON FUNCTION add_profile_picture_column() TO service_role;

-- Create update_profile_picture function
CREATE OR REPLACE FUNCTION update_profile_picture(
  user_id UUID,
  picture_url TEXT
) RETURNS VOID AS $$
BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
  UPDATE profiles 
  SET profile_picture_url = picture_url 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_profile_picture TO authenticated;
GRANT EXECUTE ON FUNCTION update_profile_picture TO anon;
GRANT EXECUTE ON FUNCTION update_profile_picture TO service_role;`; 