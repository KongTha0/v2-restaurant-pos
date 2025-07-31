"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database, AlertCircle, CheckCircle } from "lucide-react"
import { supabase } from "../lib/supabase"

export function DatabaseStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase.from("employees").select("count").limit(1)

      if (error) {
        setIsConnected(false)
        setError(error.message)
      } else {
        setIsConnected(true)
        setError(null)
      }
    } catch (err) {
      setIsConnected(false)
      setError("Failed to connect to database")
    }
  }

  if (isConnected === null) {
    return (
      <Card className="mx-4 mb-4 bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-yellow-600" />
            <span className="text-yellow-800">Checking database connection...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!isConnected) {
    return (
      <Card className="mx-4 mb-4 bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-800">Database connection failed</span>
            </div>
            <Badge variant="destructive">Offline</Badge>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">Error: {error}</p>}
          <p className="text-sm text-red-600 mt-2">
            Please ensure Supabase is configured with the correct environment variables.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-4 mb-4 bg-green-50 border-green-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-800">Database connected</span>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Online
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
