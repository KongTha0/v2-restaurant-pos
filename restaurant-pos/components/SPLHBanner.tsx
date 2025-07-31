"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Clock, DollarSign } from "lucide-react"
import type { Employee } from "@/lib/supabase"

interface SPLHBannerProps {
  currentEmployee: Employee
  supabase: any
}

export function SPLHBanner({ currentEmployee, supabase }: SPLHBannerProps) {
  const [splh, setSplh] = useState(0)
  const [totalSales, setTotalSales] = useState(0)
  const [totalHours, setTotalHours] = useState(0)

  useEffect(() => {
    calculateSPLH()
    const interval = setInterval(calculateSPLH, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const calculateSPLH = async () => {
    try {
      const today = new Date().toISOString().split("T")[0]

      // Get all shifts for today for cashier roles
      const { data: shifts } = await supabase
        .from("shifts")
        .select(`
          *,
          employees!inner(role)
        `)
        .gte("clock_in", `${today}T00:00:00`)
        .in("employees.role", ["cashier"])

      if (!shifts || shifts.length === 0) {
        setSplh(0)
        setTotalSales(0)
        setTotalHours(0)
        return
      }

      // Calculate total hours worked by cashiers today
      let hoursWorked = 0
      const now = new Date()

      shifts.forEach((shift) => {
        const clockIn = new Date(shift.clock_in)
        const clockOut = shift.clock_out ? new Date(shift.clock_out) : now
        const shiftHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
        hoursWorked += shiftHours
      })

      // Get total sales for today
      const { data: orders } = await supabase.from("orders").select("total").gte("timestamp", `${today}T00:00:00`)

      const salesTotal = orders?.reduce((sum, order) => sum + order.total, 0) || 0

      setTotalSales(salesTotal)
      setTotalHours(hoursWorked)
      setSplh(hoursWorked > 0 ? salesTotal / hoursWorked : 0)
    } catch (error) {
      console.error("Failed to calculate SPLH:", error)
    }
  }

  return (
    <Card className="mx-4 mb-4 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Live SPLH</span>
            </div>
            <div className="text-2xl font-bold text-green-600">${splh.toFixed(2)}</div>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span>Sales: ${totalSales.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Hours: {totalHours.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
