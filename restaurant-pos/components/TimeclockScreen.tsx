"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, ArrowLeft, Play, Pause, Square } from "lucide-react"
import type { Employee } from "../lib/supabase"

interface TimeclockScreenProps {
  onComplete: () => void
  supabase: any
}

export function TimeclockScreen({ onComplete, supabase }: TimeclockScreenProps) {
  const [pin, setPin] = useState("")
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      setPin(pin + digit)
    }
  }

  const handleClear = () => {
    setPin("")
    setEmployee(null)
    setError("")
  }

  const handlePinSubmit = async () => {
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits")
      return
    }

    setLoading(true)
    setError("")

    try {
      const { data: employeeData, error } = await supabase.from("employees").select("*").eq("pin", pin).single()

      if (error || !employeeData) {
        setError("Invalid PIN")
        setPin("")
        return
      }

      setEmployee(employeeData)
    } catch (err) {
      setError("Failed to verify PIN")
    } finally {
      setLoading(false)
    }
  }

  const handleClockIn = async () => {
    if (!employee) return

    setLoading(true)
    try {
      const now = new Date().toISOString()

      const { data: shift, error: shiftError } = await supabase
        .from("shifts")
        .insert({
          employee_id: employee.id,
          clock_in: now,
        })
        .select()
        .single()

      if (shiftError) throw shiftError

      await supabase
        .from("employees")
        .update({
          is_clocked_in: true,
          current_shift_id: shift.id,
        })
        .eq("id", employee.id)

      setEmployee({ ...employee, is_clocked_in: true, current_shift_id: shift.id })
    } catch (err) {
      setError("Failed to clock in")
    } finally {
      setLoading(false)
    }
  }

  const handleClockOut = async () => {
    if (!employee || !employee.current_shift_id) return

    setLoading(true)
    try {
      const now = new Date().toISOString()

      // Get shift start time to calculate total hours
      const { data: shift } = await supabase
        .from("shifts")
        .select("clock_in")
        .eq("id", employee.current_shift_id)
        .single()

      const clockInTime = new Date(shift.clock_in)
      const clockOutTime = new Date(now)
      const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60)

      await supabase
        .from("shifts")
        .update({
          clock_out: now,
          total_hours: totalHours,
        })
        .eq("id", employee.current_shift_id)

      await supabase
        .from("employees")
        .update({
          is_clocked_in: false,
          current_shift_id: null,
        })
        .eq("id", employee.id)

      setEmployee({ ...employee, is_clocked_in: false, current_shift_id: undefined })
    } catch (err) {
      setError("Failed to clock out")
    } finally {
      setLoading(false)
    }
  }

  const handleStartBreak = async () => {
    if (!employee || !employee.current_shift_id) return

    setLoading(true)
    try {
      const now = new Date().toISOString()

      await supabase.from("shifts").update({ break_start: now }).eq("id", employee.current_shift_id)
    } catch (err) {
      setError("Failed to start break")
    } finally {
      setLoading(false)
    }
  }

  const handleEndBreak = async () => {
    if (!employee || !employee.current_shift_id) return

    setLoading(true)
    try {
      const now = new Date().toISOString()

      await supabase.from("shifts").update({ break_end: now }).eq("id", employee.current_shift_id)
    } catch (err) {
      setError("Failed to end break")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-blue-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Clock className="h-6 w-6" />
            Timeclock
          </CardTitle>
          <p className="text-lg font-mono">{currentTime.toLocaleTimeString()}</p>
          <p className="text-sm text-gray-600">{currentTime.toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!employee ? (
            <>
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
                  onClick={handlePinSubmit}
                  disabled={loading || pin.length < 4}
                  className="h-16 text-xl bg-green-600 hover:bg-green-700"
                >
                  {loading ? "Verifying..." : "Submit"}
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl font-semibold">{employee.name}</h3>
                <p className="text-gray-600 capitalize">{employee.role}</p>
                <p className="text-sm">Status: {employee.is_clocked_in ? "Clocked In" : "Clocked Out"}</p>
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <div className="grid grid-cols-1 gap-3">
                {!employee.is_clocked_in ? (
                  <Button
                    onClick={handleClockIn}
                    disabled={loading}
                    className="h-16 text-xl bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <Play className="h-6 w-6" />
                    Clock In
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleClockOut}
                      disabled={loading}
                      className="h-16 text-xl bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <Square className="h-6 w-6" />
                      Clock Out
                    </Button>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={handleStartBreak}
                        disabled={loading}
                        variant="outline"
                        className="h-12 flex items-center justify-center gap-2 bg-transparent"
                      >
                        <Pause className="h-4 w-4" />
                        Start Break
                      </Button>
                      <Button
                        onClick={handleEndBreak}
                        disabled={loading}
                        variant="outline"
                        className="h-12 flex items-center justify-center gap-2 bg-transparent"
                      >
                        <Play className="h-4 w-4" />
                        End Break
                      </Button>
                    </div>
                  </>
                )}
              </div>

              <Button variant="secondary" onClick={handleClear} className="w-full">
                Switch Employee
              </Button>
            </div>
          )}

          <Button variant="ghost" onClick={onComplete} className="w-full flex items-center justify-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
