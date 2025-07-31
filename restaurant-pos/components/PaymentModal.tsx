"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { X, CreditCard, DollarSign, Percent } from "lucide-react"
import { ManagerAuthDialog } from "./ManagerAuthDialog"
import type { Employee } from "../lib/supabase"

interface PaymentModalProps {
  subtotal: number
  tax: number
  total: number
  currentEmployee: Employee
  onComplete: (paymentData: any) => void
  onCancel: () => void
  supabase: any
}

export function PaymentModal({
  subtotal,
  tax,
  total,
  currentEmployee,
  onComplete,
  onCancel,
  supabase,
}: PaymentModalProps) {
  const [paymentType, setPaymentType] = useState<"cash" | "card" | "split">("card")
  const [tipAmount, setTipAmount] = useState(0)
  const [tipType, setTipType] = useState<"percent" | "amount">("percent")
  const [customTip, setCustomTip] = useState("")
  const [discountPercent, setDiscountPercent] = useState(0)
  const [customDiscount, setCustomDiscount] = useState("")
  const [cashAmount, setCashAmount] = useState("")
  const [cardAmount, setCardAmount] = useState("")
  const [showManagerAuth, setShowManagerAuth] = useState(false)
  const [pendingDiscount, setPendingDiscount] = useState(0)

  const handleTipPreset = (percent: number) => {
    setTipType("percent")
    setTipAmount(total * (percent / 100))
    setCustomTip("")
  }

  const handleCustomTip = (value: string) => {
    setCustomTip(value)
    const amount = Number.parseFloat(value) || 0
    if (tipType === "percent") {
      setTipAmount(total * (amount / 100))
    } else {
      setTipAmount(amount)
    }
  }

  const handleDiscountChange = (value: string) => {
    setCustomDiscount(value)
    const discount = Number.parseFloat(value) || 0

    if (discount > 20 && currentEmployee.role !== "manager") {
      setPendingDiscount(discount)
      setShowManagerAuth(true)
    } else {
      setDiscountPercent(discount)
    }
  }

  const handleManagerAuthSuccess = () => {
    setDiscountPercent(pendingDiscount)
    setShowManagerAuth(false)
    setPendingDiscount(0)
  }

  const calculateFinalTotal = () => {
    const discountAmount = total * (discountPercent / 100)
    const discountedTotal = total - discountAmount
    return discountedTotal + tipAmount
  }

  const handlePayment = async () => {
    const finalTotal = calculateFinalTotal()

    // Log discount if applied
    if (discountPercent > 0) {
      await supabase.from("override_logs").insert({
        employee_id: currentEmployee.id,
        action: "discount_applied",
        discount_percent: discountPercent,
        amount: total * (discountPercent / 100),
        reason: "Manual discount",
        timestamp: new Date().toISOString(),
        shift_id: currentEmployee.current_shift_id,
      })
    }

    const paymentData = {
      payment_type: paymentType,
      subtotal,
      tax,
      total: finalTotal,
      tip: tipAmount,
      discount_percent: discountPercent,
      cash_amount: paymentType === "cash" || paymentType === "split" ? Number.parseFloat(cashAmount) || 0 : 0,
      card_amount: paymentType === "card" || paymentType === "split" ? Number.parseFloat(cardAmount) || finalTotal : 0,
    }

    onComplete(paymentData)
  }

  const discountAmount = total * (discountPercent / 100)
  const discountedTotal = total - discountAmount
  const finalTotal = calculateFinalTotal()

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Payment</CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount ({discountPercent}%):</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span>Order Total:</span>
                <span>${discountedTotal.toFixed(2)}</span>
              </div>
              {tipAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Tip:</span>
                  <span>+${tipAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Final Total:</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Discount */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Discount %
              </Label>
              <Input
                type="number"
                placeholder="Enter discount percentage"
                value={customDiscount}
                onChange={(e) => handleDiscountChange(e.target.value)}
                min="0"
                max="100"
              />
              {discountPercent > 20 && (
                <p className="text-sm text-orange-600">Discounts over 20% require manager approval</p>
              )}
            </div>

            {/* Tip */}
            <div className="space-y-3">
              <Label>Tip</Label>
              <div className="grid grid-cols-4 gap-2">
                <Button variant={tipAmount === total * 0.1 ? "default" : "outline"} onClick={() => handleTipPreset(10)}>
                  10%
                </Button>
                <Button
                  variant={tipAmount === total * 0.15 ? "default" : "outline"}
                  onClick={() => handleTipPreset(15)}
                >
                  15%
                </Button>
                <Button variant={tipAmount === total * 0.2 ? "default" : "outline"} onClick={() => handleTipPreset(20)}>
                  20%
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTipAmount(0)
                    setCustomTip("")
                  }}
                >
                  No Tip
                </Button>
              </div>
              <div className="flex gap-2">
                <RadioGroup
                  value={tipType}
                  onValueChange={(value) => setTipType(value as "percent" | "amount")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percent" id="tip-percent" />
                    <Label htmlFor="tip-percent">%</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="amount" id="tip-amount" />
                    <Label htmlFor="tip-amount">$</Label>
                  </div>
                </RadioGroup>
                <Input
                  type="number"
                  placeholder={tipType === "percent" ? "Tip %" : "Tip $"}
                  value={customTip}
                  onChange={(e) => handleCustomTip(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <Label>Payment Method</Label>
              <RadioGroup value={paymentType} onValueChange={(value) => setPaymentType(value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Card
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Cash
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="split" id="split" />
                  <Label htmlFor="split">Split Payment</Label>
                </div>
              </RadioGroup>

              {paymentType === "cash" && (
                <Input
                  type="number"
                  placeholder="Cash amount received"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  step="0.01"
                />
              )}

              {paymentType === "split" && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Cash amount"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    step="0.01"
                  />
                  <Input
                    type="number"
                    placeholder="Card amount"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(e.target.value)}
                    step="0.01"
                  />
                </div>
              )}
            </div>

            {/* Change Due */}
            {paymentType === "cash" && cashAmount && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between font-bold">
                  <span>Change Due:</span>
                  <span>${Math.max(0, Number.parseFloat(cashAmount) - finalTotal).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={
                  (paymentType === "cash" && (!cashAmount || Number.parseFloat(cashAmount) < finalTotal)) ||
                  (paymentType === "split" &&
                    (!cashAmount ||
                      !cardAmount ||
                      Number.parseFloat(cashAmount) + Number.parseFloat(cardAmount) < finalTotal))
                }
              >
                Complete Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {showManagerAuth && (
        <ManagerAuthDialog
          action="high_discount"
          onSuccess={handleManagerAuthSuccess}
          onCancel={() => {
            setShowManagerAuth(false)
            setPendingDiscount(0)
            setCustomDiscount("")
          }}
          supabase={supabase}
        />
      )}
    </>
  )
}
