"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Clock, DollarSign } from "lucide-react"

interface HoldResumeTicketModalProps {
  heldOrders: any[]
  onResume: (order: any) => void
  onCancel: () => void
  supabase: any
}

export function HoldResumeTicketModal({ heldOrders, onResume, onCancel, supabase }: HoldResumeTicketModalProps) {
  const handleResume = async (order: any) => {
    // Remove from held orders
    await supabase.from("held_orders").delete().eq("id", order.id)

    onResume(order)
  }

  const handleDelete = async (orderId: string) => {
    await supabase.from("held_orders").delete().eq("id", orderId)

    // Refresh the component by calling onCancel and reopening
    onCancel()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Held Orders</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {heldOrders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No held orders</p>
          ) : (
            heldOrders.map((order) => (
              <Card key={order.id} className="border-2">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {new Date(order.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="flex items-center gap-2 font-bold text-lg">
                      <DollarSign className="h-4 w-4" />
                      {order.total.toFixed(2)}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.menu_item.name}
                        </span>
                        <span>${item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => handleResume(order)} className="flex-1 bg-green-600 hover:bg-green-700">
                      Resume Order
                    </Button>
                    <Button variant="destructive" onClick={() => handleDelete(order.id)}>
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
