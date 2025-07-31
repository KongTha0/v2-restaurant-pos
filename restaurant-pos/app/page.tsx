"use client"

import { useState, useEffect } from "react"
import { PinLoginScreen } from "../components/PinLoginScreen"
import { TimeclockScreen } from "../components/TimeclockScreen"
import { POSLayout } from "../components/POSLayout"
import { supabase } from "../lib/supabase"
import type { Employee } from "../lib/supabase"
import { SetupInstructions } from "../components/SetupInstructions"

export default function Home() {
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null)
  const [showTimeclock, setShowTimeclock] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())

  // Check if environment variables are configured
  const isSupabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Auto-logout after 2 minutes of inactivity
  useEffect(() => {
    const checkInactivity = () => {
      if (currentEmployee && Date.now() - lastActivity > 120000) {
        // 2 minutes
        handleLogout()
      }
    }

    const interval = setInterval(checkInactivity, 10000) // Check every 10 seconds
    return () => clearInterval(interval)
  }, [currentEmployee, lastActivity])

  // Track user activity
  useEffect(() => {
    const updateActivity = () => setLastActivity(Date.now())

    document.addEventListener("mousedown", updateActivity)
    document.addEventListener("keydown", updateActivity)
    document.addEventListener("touchstart", updateActivity)

    return () => {
      document.removeEventListener("mousedown", updateActivity)
      document.removeEventListener("keydown", updateActivity)
      document.removeEventListener("touchstart", updateActivity)
    }
  }, [])

  const handleLogin = (employee: Employee) => {
    setCurrentEmployee(employee)
    setLastActivity(Date.now())
  }

  const handleLogout = () => {
    setCurrentEmployee(null)
    setShowTimeclock(false)
  }

  const handleTimeclockAccess = () => {
    setShowTimeclock(true)
  }

  const handleTimeclockComplete = () => {
    setShowTimeclock(false)
  }

  if (!isSupabaseConfigured) {
    return <SetupInstructions />
  }

  if (showTimeclock) {
    return <TimeclockScreen onComplete={handleTimeclockComplete} supabase={supabase} />
  }

  if (!currentEmployee) {
    return <PinLoginScreen onLogin={handleLogin} onTimeclockAccess={handleTimeclockAccess} supabase={supabase} />
  }

  // Only allow cashier and manager to access POS
  if (currentEmployee.role !== "cashier" && currentEmployee.role !== "manager") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">Your role does not have access to the POS system.</p>
          <button onClick={handleLogout} className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return <POSLayout currentEmployee={currentEmployee} onLogout={handleLogout} supabase={supabase} />
}
