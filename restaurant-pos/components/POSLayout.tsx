"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LogOut, Plus, Minus, Trash2, PauseIcon as Hold, Play, CreditCard } from "lucide-react"
import { ModifierDialog } from "./ModifierDialog"
import { PaymentModal } from "./PaymentModal"
import { ManagerAuthDialog } from "./ManagerAuthDialog"
import { OnlineOrderToggle } from "./OnlineOrderToggle"
import { SPLHBanner } from "./SPLHBanner"
import { HoldResumeTicketModal } from "./HoldResumeTicketModal"
import { ReceiptPromptModal } from "./ReceiptPromptModal"
import type { Employee, MenuItem, Category, ModifierOption, OrderItem } from "../lib/supabase"
import { DatabaseStatus } from "./DatabaseStatus"

interface POSLayoutProps {
  currentEmployee: Employee
  onLogout: () => void
  supabase: any
}

export function POSLayout({ currentEmployee, onLogout, supabase }: POSLayoutProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [showModifierDialog, setShowModifierDialog] = useState<MenuItem | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showManagerAuth, setShowManagerAuth] = useState<{ action: string; itemId?: string } | null>(null)
  const [showHoldResume, setShowHoldResume] = useState(false)
  const [showReceiptPrompt, setShowReceiptPrompt] = useState(false)
  const [heldOrders, setHeldOrders] = useState<any[]>([])
  const [currentOrder, setCurrentOrder] = useState<any>(null)

  const subtotal = orderItems.reduce((sum, item) => sum + item.total_price, 0)
  const tax = subtotal * 0.08 // 8% tax rate
  const total = subtotal + tax

  useEffect(() => {
    loadCategories()
    loadMenuItems()
    loadHeldOrders()
  }, [])

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order")

    if (data) {
      setCategories(data)
      if (data.length > 0) {
        setSelectedCategory(data[0].id)
      }
    }
  }

  const loadMenuItems = async () => {
    const { data } = await supabase
      .from("menu_items")
      .select(`
        *,
        modifiers (
          *,
          modifier_options (*)
        )
      `)
      .eq("is_available", true)

    if (data) {
      setMenuItems(data)
    }
  }

  const loadHeldOrders = async () => {
    const { data } = await supabase.from("held_orders").select("*").eq("employee_id", currentEmployee.id)

    if (data) {
      setHeldOrders(data)
    }
  }

  const handleAddItem = (menuItem: MenuItem) => {
    // Check if item has modifiers and they exist
    if (menuItem.modifiers && menuItem.modifiers.length > 0) {
      setShowModifierDialog(menuItem)
    } else {
      addItemToOrder(menuItem, {})
    }
  }

  const addItemToOrder = (menuItem: MenuItem, modifiers: { [key: string]: ModifierOption[] }) => {
    const modifierPrice = Object.values(modifiers)
      .flat()
      .reduce((sum, option) => sum + option.price, 0)

    const totalPrice = menuItem.price + modifierPrice

    const existingItemIndex = orderItems.findIndex(
      (item) => item.menu_item.id === menuItem.id && JSON.stringify(item.modifiers) === JSON.stringify(modifiers),
    )

    if (existingItemIndex >= 0) {
      const updatedItems = [...orderItems]
      updatedItems[existingItemIndex].quantity += 1
      updatedItems[existingItemIndex].total_price += totalPrice
      setOrderItems(updatedItems)
    } else {
      const newItem: OrderItem = {
        id: Date.now().toString(),
        menu_item: menuItem,
        quantity: 1,
        modifiers,
        total_price: totalPrice,
      }
      setOrderItems([...orderItems, newItem])
    }
  }

  const handleQuantityChange = (itemId: string, change: number) => {
    const updatedItems = orderItems
      .map((item) => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + change)
          if (newQuantity === 0) {
            return null
          }
          const unitPrice = item.total_price / item.quantity
          return {
            ...item,
            quantity: newQuantity,
            total_price: unitPrice * newQuantity,
          }
        }
        return item
      })
      .filter(Boolean) as OrderItem[]

    setOrderItems(updatedItems)
  }

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(orderItems.filter((item) => item.id !== itemId))
  }

  const handleVoidOrder = () => {
    if (currentEmployee.role === "manager") {
      setOrderItems([])
    } else {
      setShowManagerAuth({ action: "void" })
    }
  }

  const handleMarkSoldOut = (itemId: string) => {
    if (currentEmployee.role === "manager") {
      markItemSoldOut(itemId)
    } else {
      setShowManagerAuth({ action: "soldout", itemId })
    }
  }

  const markItemSoldOut = async (itemId: string) => {
    await supabase.from("menu_items").update({ is_available: false }).eq("id", itemId)

    await supabase.from("override_logs").insert({
      employee_id: currentEmployee.id,
      action: "mark_sold_out",
      item_id: itemId,
      timestamp: new Date().toISOString(),
      shift_id: currentEmployee.current_shift_id,
    })

    loadMenuItems()
  }

  const handleHoldOrder = async () => {
    if (orderItems.length === 0) return

    const orderData = {
      employee_id: currentEmployee.id,
      items: orderItems,
      subtotal,
      tax,
      total,
      timestamp: new Date().toISOString(),
    }

    await supabase.from("held_orders").insert(orderData)

    setOrderItems([])
    loadHeldOrders()
  }

  const handleResumeOrder = (order: any) => {
    setOrderItems(order.items)
    setShowHoldResume(false)
  }

  const handlePayment = () => {
    if (orderItems.length === 0) return
    setShowPaymentModal(true)
  }

  const handlePaymentComplete = async (paymentData: any) => {
    // Save order to database
    const orderData = {
      employee_id: currentEmployee.id,
      shift_id: currentEmployee.current_shift_id,
      items: orderItems,
      subtotal,
      tax,
      total: paymentData.total,
      tip: paymentData.tip,
      payment_type: paymentData.payment_type,
      discount_percent: paymentData.discount_percent,
      timestamp: new Date().toISOString(),
    }

    const { data: order } = await supabase.from("orders").insert(orderData).select().single()

    if (order) {
      setCurrentOrder(order)
      setOrderItems([])
      setShowPaymentModal(false)
      setShowReceiptPrompt(true)
    }
  }

  const handleManagerAuthSuccess = (action: string, itemId?: string) => {
    if (action === "void") {
      setOrderItems([])
    } else if (action === "soldout" && itemId) {
      markItemSoldOut(itemId)
    }
    setShowManagerAuth(null)
  }

  const filteredItems = menuItems.filter((item) => item.category_id === selectedCategory)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Restaurant POS</h1>
            <Badge variant="secondary" className="capitalize">
              {currentEmployee.name} - {currentEmployee.role}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <OnlineOrderToggle currentEmployee={currentEmployee} supabase={supabase} />
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        <SPLHBanner currentEmployee={currentEmployee} supabase={supabase} />
        <DatabaseStatus />
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Panel - Categories */}
        <div className="w-64 bg-white border-r overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold mb-4">Categories</h2>
            <div className="space-y-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel - Menu Items */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleAddItem(item)}
              >
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
                    {item.image ? (
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-gray-400 text-4xl">🍽️</div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{item.name}</h3>
                  <p className="text-lg font-bold text-green-600">${item.price.toFixed(2)}</p>
                  {currentEmployee.role === "manager" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="mt-2 w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMarkSoldOut(item.id)
                      }}
                    >
                      Mark Sold Out
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Panel - Order Summary */}
        <div className="w-80 bg-white border-l flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">Current Order</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {orderItems.length === 0 ? (
              <p className="text-gray-500 text-center">No items in order</p>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{item.menu_item.name}</h4>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {Object.entries(item.modifiers).map(([modifierName, options]) => (
                      <div key={modifierName} className="text-sm text-gray-600 mb-1">
                        {modifierName}: {options.map((opt) => opt.name).join(", ")}
                      </div>
                    ))}

                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleQuantityChange(item.id, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-medium">{item.quantity}</span>
                        <Button variant="outline" size="sm" onClick={() => handleQuantityChange(item.id, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-bold">${item.total_price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="border-t p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleVoidOrder} disabled={orderItems.length === 0}>
                Void
              </Button>
              <Button variant="outline" onClick={handleHoldOrder} disabled={orderItems.length === 0}>
                <Hold className="h-4 w-4 mr-1" />
                Hold
              </Button>
              <Button variant="outline" onClick={() => setShowHoldResume(true)} disabled={heldOrders.length === 0}>
                <Play className="h-4 w-4 mr-1" />
                Resume
              </Button>
              <Button
                onClick={handlePayment}
                disabled={orderItems.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                Charge
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showModifierDialog && (
        <ModifierDialog
          menuItem={showModifierDialog}
          onConfirm={(modifiers) => {
            addItemToOrder(showModifierDialog, modifiers)
            setShowModifierDialog(null)
          }}
          onCancel={() => setShowModifierDialog(null)}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          subtotal={subtotal}
          tax={tax}
          total={total}
          currentEmployee={currentEmployee}
          onComplete={handlePaymentComplete}
          onCancel={() => setShowPaymentModal(false)}
          supabase={supabase}
        />
      )}

      {showManagerAuth && (
        <ManagerAuthDialog
          action={showManagerAuth.action}
          onSuccess={() => handleManagerAuthSuccess(showManagerAuth.action, showManagerAuth.itemId)}
          onCancel={() => setShowManagerAuth(null)}
          supabase={supabase}
        />
      )}

      {showHoldResume && (
        <HoldResumeTicketModal
          heldOrders={heldOrders}
          onResume={handleResumeOrder}
          onCancel={() => setShowHoldResume(false)}
          supabase={supabase}
        />
      )}

      {showReceiptPrompt && currentOrder && (
        <ReceiptPromptModal
          order={currentOrder}
          onComplete={() => {
            setShowReceiptPrompt(false)
            setCurrentOrder(null)
          }}
        />
      )}
    </div>
  )
}
