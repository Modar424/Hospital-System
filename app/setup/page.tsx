"use client"

import { useMutation, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, CheckCircle2, AlertCircle, Stethoscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import Link from 'next/link'

export default function SetupPage() {
  const bootstrapAdmin = useMutation(api.patients.bootstrapAdmin)
  const user = useQuery(api.patients.getUser)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleBootstrap = async () => {
    setLoading(true)
    try {
      await bootstrapAdmin()
      setDone(true)
      toast.success('You are now an admin!')
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-8 max-w-md w-full shadow-xl text-center space-y-6"
      >
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8 text-primary" />
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">Admin Setup</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This page is for first-time setup only. If no admin exists yet, you can claim the admin role here.
            Once an admin exists, this page will no longer work.
          </p>
        </div>

        {user ? (
          <div className="bg-muted/50 rounded-xl p-4 text-left">
            <p className="text-xs text-muted-foreground mb-1">Signed in as</p>
            <p className="font-medium text-sm">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            {user.role === 'admin' ? (
              <div className="mt-2 flex items-center gap-1.5 text-primary text-xs font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Already an admin
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-1.5 text-muted-foreground text-xs">
                <AlertCircle className="w-4 h-4" />
                Current role: {user.role}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">
            Please sign in first before claiming admin role.
          </div>
        )}

        {done || user?.role === 'admin' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-primary font-medium">
              <CheckCircle2 className="w-5 h-5" />
              Admin access granted!
            </div>
            <Link href="/admin">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-full gap-2">
                <Stethoscope className="w-4 h-4" />
                Go to Admin Dashboard
              </Button>
            </Link>
          </div>
        ) : (
          <Button
            onClick={handleBootstrap}
            disabled={loading || !user}
            className="w-full bg-primary hover:bg-primary/90 text-white rounded-full"
          >
            {loading ? 'Setting up…' : 'Claim Admin Role'}
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          ⚠️ This URL should be kept private. Remove or protect this page after initial setup.
        </p>
      </motion.div>
    </div>
  )
}
