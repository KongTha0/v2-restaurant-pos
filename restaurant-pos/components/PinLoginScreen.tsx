"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, User } from "lucide-react"
import type { Employee } from "../lib/supabase"

interface PinLoginScreenProps {
  onLogin: (employee: Employee) => void
  onTimeclockAccess: () => void
  supabase: any
}

export function PinLoginScreen({ onLogin, onTimeclockAccess, supabase }: PinLoginScreenProps) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      setPin(pin + digit)
    }
  }

  const handleClear = () => {
    setPin("")
    setError("")
  }

  const handleLogin = async () => {
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits")
      return
    }

    setLoading(true)
    setError("")

    try {
      const { data: employee, error } = await supabase.from("employees").select("*").eq("pin", pin).single()

      if (error || !employee) {
        setError("Invalid PIN")
        setPin("")
        return
      }

      // Check if employee has been clocked in for over 9 hours
      if (employee.is_clocked_in && employee.current_shift_id) {
        const { data: shift } = await supabase
          .from("shifts")
          .select("clock_in")
          .eq("id", employee.current_shift_id)
          .single()

        if (shift) {
          const clockInTime = new Date(shift.clock_in)
          const now = new Date()
          const hoursWorked = (now.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)

          if (hoursWorked > 9) {
            // Auto clock out
            await supabase
              .from("shifts")
              .update({
                clock_out: now.toISOString(),
                total_hours: hoursWorked,
              })
              .eq("id", employee.current_shift_id)

            await supabase
              .from("employees")
              .update({
                is_clocked_in: false,
                current_shift_id: null,
              })
              .eq("id", employee.id)

            employee.is_clocked_in = false
            employee.current_shift_id = null
          }
        }
      }

      onLogin(employee)
    } catch (err) {
      setError("Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <User className="h-6 w-6" />
            Employee Login
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <Input
              type="password"
              value={pin}
              placeholder="Enter PIN"
              className="text-center text-2xl tracking-widest"
              readOnly
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <Button
                key={digit}
                variant="outline"
                size="lg"
                onClick={() => handlePinInput(digit.toString())}
                className="h-16 text-xl"
              >
                {digit}
              </Button>
            ))}
            <Button variant="outline" size="lg" onClick={handleClear} className="h-16 text-xl bg-transparent">
              Clear
            </Button>
            <Button variant="outline" size="lg" onClick={() => handlePinInput("0")} className="h-16 text-xl">
              0
            </Button>
            <Button
              size="lg"
              onClick={handleLogin}
              disabled={loading || pin.length < 4}
              className="h-16 text-xl bg-green-600 hover:bg-green-700"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </div>

          <Button
            variant="secondary"
            onClick={onTimeclockAccess}
            className="w-full flex items-center justify-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Timeclock
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
