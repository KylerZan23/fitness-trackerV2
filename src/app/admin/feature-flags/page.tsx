'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Trash2, AlertTriangle, Settings, Users, BarChart3, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface FeatureFlagConfig {
  id: string
  flagName: string
  description?: string
  isEnabled: boolean
  rolloutPercentage: number
  adminOverrideEnabled?: boolean
  adminOverrideDisabled?: boolean
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
}

interface UserFeatureOverride {
  id: string
  userId: string
  flagName: string
  isEnabled: boolean
  reason?: string
  expiresAt?: string
  createdAt: string
}

export default function FeatureFlagsAdminPage() {
  const [flags, setFlags] = useState<FeatureFlagConfig[]>([])
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlagConfig | null>(null)
  const [userOverrides, setUserOverrides] = useState<UserFeatureOverride[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showEmergencyDialog, setShowEmergencyDialog] = useState(false)
  const [emergencyReason, setEmergencyReason] = useState('')
  const [newOverride, setNewOverride] = useState({ userId: '', reason: '' })
  const { addToast } = useToast()

  // Load feature flags on component mount
  useEffect(() => {
    loadFeatureFlags()
  }, [])

  // Load user overrides when a flag is selected
  useEffect(() => {
    if (selectedFlag) {
      loadUserOverrides(selectedFlag.flagName)
    }
  }, [selectedFlag])

  const loadFeatureFlags = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/feature-flags')
      const data = await response.json()
      
      if (response.ok) {
        setFlags(data.flags || [])
      } else {
        addToast({ type: 'error', title: 'Error', description: `Failed to load feature flags: ${data.error}` })
      }
    } catch (error) {
      console.error('Error loading feature flags:', error)
      addToast({ type: 'error', title: 'Error', description: 'Failed to load feature flags' })
    } finally {
      setLoading(false)
    }
  }

  const loadUserOverrides = async (flagName: string) => {
    try {
      const response = await fetch(`/api/admin/feature-flags/${flagName}/overrides`)
      const data = await response.json()
      
      if (response.ok) {
        setUserOverrides(data.overrides || [])
      } else {
        addToast({ type: 'error', title: 'Error', description: `Failed to load user overrides: ${data.error}` })
      }
    } catch (error) {
      console.error('Error loading user overrides:', error)
      addToast({ type: 'error', title: 'Error', description: 'Failed to load user overrides' })
    }
  }

  const updateFlag = async (flagName: string, updates: Partial<FeatureFlagConfig>) => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/feature-flags/${flagName}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      const data = await response.json()
      
      if (response.ok) {
        addToast({ type: 'success', title: 'Success', description: 'Feature flag updated successfully' })
        await loadFeatureFlags()
        
        // Update selected flag if it was the one we modified
        if (selectedFlag?.flagName === flagName) {
          const updatedFlag = flags.find(f => f.flagName === flagName)
          if (updatedFlag) setSelectedFlag(updatedFlag)
        }
      } else {
        addToast({ type: 'error', title: 'Error', description: `Failed to update feature flag: ${data.error}` })
      }
    } catch (error) {
      console.error('Error updating feature flag:', error)
      addToast({ type: 'error', title: 'Error', description: 'Failed to update feature flag' })
    } finally {
      setSaving(false)
    }
  }

  const emergencyRollback = async (flagName: string, reason: string) => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/feature-flags/${flagName}/emergency-rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })

      const data = await response.json()
      
      if (response.ok) {
        addToast({ type: 'success', title: 'Emergency Rollback', description: 'Emergency rollback executed successfully' })
        await loadFeatureFlags()
        setShowEmergencyDialog(false)
        setEmergencyReason('')
      } else {
        addToast({ type: 'error', title: 'Error', description: `Emergency rollback failed: ${data.error}` })
      }
    } catch (error) {
      console.error('Error during emergency rollback:', error)
      addToast({ type: 'error', title: 'Error', description: 'Emergency rollback failed' })
    } finally {
      setSaving(false)
    }
  }

  const addUserOverride = async (flagName: string, userId: string, isEnabled: boolean, reason: string) => {
    try {
      const response = await fetch(`/api/admin/feature-flags/${flagName}/overrides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isEnabled, reason })
      })

      const data = await response.json()
      
      if (response.ok) {
        addToast({ type: 'success', title: 'Success', description: 'User override added successfully' })
        await loadUserOverrides(flagName)
        setNewOverride({ userId: '', reason: '' })
      } else {
        addToast({ type: 'error', title: 'Error', description: `Failed to add user override: ${data.error}` })
      }
    } catch (error) {
      console.error('Error adding user override:', error)
      addToast({ type: 'error', title: 'Error', description: 'Failed to add user override' })
    }
  }

  const removeUserOverride = async (flagName: string, userId: string) => {
    try {
      const response = await fetch(`/api/admin/feature-flags/${flagName}/overrides/${userId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (response.ok) {
        addToast({ type: 'success', title: 'Success', description: 'User override removed successfully' })
        await loadUserOverrides(flagName)
      } else {
        addToast({ type: 'error', title: 'Error', description: `Failed to remove user override: ${data.error}` })
      }
    } catch (error) {
      console.error('Error removing user override:', error)
      addToast({ type: 'error', title: 'Error', description: 'Failed to remove user override' })
    }
  }

  const getStatusBadge = (flag: FeatureFlagConfig) => {
    if (flag.adminOverrideDisabled) {
      return <Badge variant="destructive">Force Disabled</Badge>
    }
    if (flag.adminOverrideEnabled) {
      return <Badge variant="secondary">Force Enabled</Badge>
    }
    if (flag.isEnabled) {
      return <Badge variant="default">{flag.rolloutPercentage}% Rollout</Badge>
    }
    return <Badge variant="outline">Disabled</Badge>
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Feature Flags Admin</h1>
          <p className="text-muted-foreground">
            Manage feature flags for safe rollouts and A/B testing
          </p>
        </div>
        <Button onClick={loadFeatureFlags} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feature Flags List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Feature Flags
              </CardTitle>
              <CardDescription>
                Click on a flag to view details and manage settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {flags.map((flag) => (
                <div
                  key={flag.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                    selectedFlag?.id === flag.id ? 'bg-accent border-primary' : ''
                  }`}
                  onClick={() => setSelectedFlag(flag)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{flag.flagName}</h3>
                    {getStatusBadge(flag)}
                  </div>
                  {flag.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {flag.description}
                    </p>
                  )}
                  <div className="mt-2">
                    <Progress value={flag.rolloutPercentage} className="h-2" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Flag Details */}
        <div className="lg:col-span-2">
          {selectedFlag ? (
            <Tabs defaultValue="settings" className="space-y-6">
              <TabsList>
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="overrides">User Overrides</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {selectedFlag.flagName}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowEmergencyDialog(true)}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Emergency Rollback
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Configure rollout settings and admin overrides
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Global Enable/Disable */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Global Enable</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable this flag globally (still subject to rollout percentage)
                        </p>
                      </div>
                      <Switch
                        checked={selectedFlag.isEnabled}
                        onCheckedChange={(checked) => 
                          updateFlag(selectedFlag.flagName, { isEnabled: checked })
                        }
                        disabled={saving}
                      />
                    </div>

                    {/* Rollout Percentage */}
                    <div className="space-y-2">
                      <Label>Rollout Percentage: {selectedFlag.rolloutPercentage}%</Label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedFlag.rolloutPercentage}
                        onChange={(e) => 
                          updateFlag(selectedFlag.flagName, { rolloutPercentage: parseInt(e.target.value) })
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        disabled={saving}
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Admin Overrides */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Force Enable All</Label>
                          <p className="text-xs text-muted-foreground">
                            Override for 100% of users
                          </p>
                        </div>
                        <Switch
                          checked={selectedFlag.adminOverrideEnabled || false}
                          onCheckedChange={(checked) => 
                            updateFlag(selectedFlag.flagName, { 
                              adminOverrideEnabled: checked,
                              adminOverrideDisabled: checked ? false : undefined
                            })
                          }
                          disabled={saving}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Force Disable All</Label>
                          <p className="text-xs text-muted-foreground">
                            Override to disable for all users
                          </p>
                        </div>
                        <Switch
                          checked={selectedFlag.adminOverrideDisabled || false}
                          onCheckedChange={(checked) => 
                            updateFlag(selectedFlag.flagName, { 
                              adminOverrideDisabled: checked,
                              adminOverrideEnabled: checked ? false : undefined
                            })
                          }
                          disabled={saving}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={selectedFlag.description || ''}
                        onChange={(e) => 
                          updateFlag(selectedFlag.flagName, { description: e.target.value })
                        }
                        placeholder="Describe what this feature flag controls..."
                        disabled={saving}
                      />
                    </div>

                    {/* Status Alert */}
                    {(selectedFlag.adminOverrideEnabled || selectedFlag.adminOverrideDisabled) && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Admin Override Active</AlertTitle>
                        <AlertDescription>
                          {selectedFlag.adminOverrideEnabled 
                            ? 'This flag is force-enabled for ALL users, ignoring rollout percentage.'
                            : 'This flag is force-disabled for ALL users.'
                          }
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="overrides" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      User Overrides
                    </CardTitle>
                    <CardDescription>
                      Manage user-specific overrides for {selectedFlag.flagName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Add New Override */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                      <Input
                        placeholder="User ID"
                        value={newOverride.userId}
                        onChange={(e) => setNewOverride({ ...newOverride, userId: e.target.value })}
                      />
                      <Input
                        placeholder="Reason (optional)"
                        value={newOverride.reason}
                        onChange={(e) => setNewOverride({ ...newOverride, reason: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => addUserOverride(selectedFlag.flagName, newOverride.userId, true, newOverride.reason)}
                          disabled={!newOverride.userId}
                        >
                          Enable
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addUserOverride(selectedFlag.flagName, newOverride.userId, false, newOverride.reason)}
                          disabled={!newOverride.userId}
                        >
                          Disable
                        </Button>
                      </div>
                    </div>

                    {/* Existing Overrides */}
                    <div className="space-y-2">
                      {userOverrides.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No user overrides for this flag
                        </p>
                      ) : (
                        userOverrides.map((override) => (
                          <div key={override.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <div className="flex items-center gap-2">
                                <code className="text-sm">{override.userId}</code>
                                <Badge variant={override.isEnabled ? 'default' : 'outline'}>
                                  {override.isEnabled ? 'Enabled' : 'Disabled'}
                                </Badge>
                              </div>
                              {override.reason && (
                                <p className="text-sm text-muted-foreground mt-1">{override.reason}</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeUserOverride(selectedFlag.flagName, override.userId)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Analytics & Usage
                    </CardTitle>
                    <CardDescription>
                      Usage statistics and performance metrics for {selectedFlag.flagName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Analytics integration coming soon
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select a feature flag to view details and manage settings
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Emergency Rollback Dialog */}
      <AlertDialog open={showEmergencyDialog} onOpenChange={setShowEmergencyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Emergency Rollback
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately disable "{selectedFlag?.flagName}" for ALL users. 
              This action should only be used in emergency situations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rollback-reason">Reason for rollback</Label>
            <Textarea
              id="rollback-reason"
              value={emergencyReason}
              onChange={(e) => setEmergencyReason(e.target.value)}
              placeholder="Describe the issue requiring emergency rollback..."
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedFlag && emergencyRollback(selectedFlag.flagName, emergencyReason)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!emergencyReason.trim() || saving}
            >
              {saving ? 'Executing...' : 'Execute Rollback'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}