"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Printer, Mail, X } from "lucide-react"

interface ReceiptPromptModalProps {
  order: any
  onComplete: () => void
}

export function ReceiptPromptModal({ order, onComplete }: ReceiptPromptModalProps) {
  const [email, setEmail] = useState("")
  const [showEmailInput, setShowEmailInput] = useState(false)

  const handlePrintReceipt = () => {
    // In a real implementation, this would trigger the receipt printer
    console.log("Printing receipt for order:", order.id)
    onComplete()
  }

  const handleEmailReceipt = () => {
    if (!email) {
      setShowEmailInput(true)
      return
    }

    // In a real implementation, this would send an email receipt
    console.log("Sending email receipt to:", email, "for order:", order.id)
    onComplete()
  }

  const handleNoReceipt = () => {
    onComplete()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Receipt Options</CardTitle>
          <p className="text-gray-600">Order completed successfully!</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="font-semibold text-green-800">Order Total: ${order.total?.toFixed(2)}</p>
            <p className="text-sm text-green-600">Order ID: {order.id}</p>
          </div>

          {showEmailInput && (
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <Button onClick={handlePrintReceipt} className="flex items-center justify-center gap-2 h-12">
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>

            <Button
              variant="outline"
              onClick={handleEmailReceipt}
              className="flex items-center justify-center gap-2 h-12 bg-transparent"
            >
              <Mail className="h-4 w-4" />
              {showEmailInput ? "Send Email Receipt" : "Email Receipt"}
            </Button>

            <Button variant="ghost" onClick={handleNoReceipt} className="flex items-center justify-center gap-2 h-12">
              <X className="h-4 w-4" />
              No Receipt
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
