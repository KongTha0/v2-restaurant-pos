"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Globe } from "lucide-react"
import type { Employee } from "@/lib/supabase"

interface OnlineOrderToggleProps {
  currentEmployee: Employee
  supabase: any
}

export function OnlineOrderToggle({ currentEmployee, supabase }: OnlineOrderToggleProps) {
  const [isEnabled, setIsEnabled] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadOnlineOrderingStatus()
  }, [])

  const loadOnlineOrderingStatus = async () => {
    try {
      const { data } = await supabase
        .from("settings")
        .select("online_ordering_enabled")
        .eq("key", "online_ordering")
        .single()

      if (data) {
        setIsEnabled(data.online_ordering_enabled)
      }
    } catch (error) {
      console.error("Failed to load online ordering status:", error)
    }
  }

  const handleToggle = async (enabled: boolean) => {
    if (currentEmployee.role !== "manager" && currentEmployee.role !== "cashier") {
      return
    }

    setLoading(true)
    try {
      await supabase.from("settings").upsert({
        key: "online_ordering",
        online_ordering_enabled: enabled,
      })

      // Log the change
      await supabase.from("override_logs").insert({
        employee_id: currentEmployee.id,
        action: enabled ? "enable_online_ordering" : "disable_online_ordering",
        timestamp: new Date().toISOString(),
        shift_id: currentEmployee.current_shift_id,
      })

      setIsEnabled(enabled)
    } catch (error) {
      console.error("Failed to update online ordering status:", error)
    } finally {
      setLoading(false)
    }
  }

  if (currentEmployee.role !== "manager" && currentEmployee.role !== "cashier") {
    return null
  }

  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-4 w-4" />
      <Label htmlFor="online-ordering">Online Orders</Label>
      <Switch id="online-ordering" checked={isEnabled} onCheckedChange={handleToggle} disabled={loading} />
    </div>
  )
}
