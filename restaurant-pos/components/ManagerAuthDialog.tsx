"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { X, Shield } from "lucide-react"

interface ManagerAuthDialogProps {
  action: string
  onSuccess: () => void
  onCancel: () => void
  supabase: any
}

export function ManagerAuthDialog({ action, onSuccess, onCancel, supabase }: ManagerAuthDialogProps) {
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

  const handleAuth = async () => {
    if (pin.length < 4) {
      setError("PIN must be at least 4 digits")
      return
    }

    setLoading(true)
    setError("")

    try {
      const { data: manager, error } = await supabase
        .from("employees")
        .select("*")
        .eq("pin", pin)
        .eq("role", "manager")
        .single()

      if (error || !manager) {
        setError("Invalid manager PIN")
        setPin("")
        return
      }

      onSuccess()
    } catch (err) {
      setError("Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  const getActionText = () => {
    switch (action) {
      case "void":
        return "void this order"
      case "soldout":
        return "mark item as sold out"
      case "high_discount":
        return "apply discount over 20%"
      default:
        return "perform this action"
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manager Authorization
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">Manager PIN required to {getActionText()}</p>

          <div className="text-center">
            <Input
              type="password"
              value={pin}
              placeholder="Enter Manager PIN"
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
              onClick={handleAuth}
              disabled={loading || pin.length < 4}
              className="h-16 text-xl bg-green-600 hover:bg-green-700"
            >
              {loading ? "Verifying..." : "Authorize"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
