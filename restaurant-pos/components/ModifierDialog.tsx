"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import type { MenuItem, Modifier, ModifierOption } from "../lib/supabase"

interface ModifierDialogProps {
  menuItem: MenuItem
  onConfirm: (modifiers: { [key: string]: ModifierOption[] }) => void
  onCancel: () => void
}

export function ModifierDialog({ menuItem, onConfirm, onCancel }: ModifierDialogProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<{ [key: string]: ModifierOption[] }>({})
  const [errors, setErrors] = useState<string[]>([])

  if (!menuItem.modifiers || menuItem.modifiers.length === 0) {
    // If no modifiers, just add the item directly
    onConfirm({})
    return null
  }

  const handleModifierChange = (modifier: Modifier, option: ModifierOption, checked: boolean) => {
    const currentSelections = selectedModifiers[modifier.name] || []

    if (modifier.max_selections === 1) {
      // Radio button behavior
      setSelectedModifiers({
        ...selectedModifiers,
        [modifier.name]: checked ? [option] : [],
      })
    } else {
      // Checkbox behavior
      if (checked) {
        if (currentSelections.length < modifier.max_selections) {
          setSelectedModifiers({
            ...selectedModifiers,
            [modifier.name]: [...currentSelections, option],
          })
        }
      } else {
        setSelectedModifiers({
          ...selectedModifiers,
          [modifier.name]: currentSelections.filter((opt) => opt.id !== option.id),
        })
      }
    }
  }

  const validateSelections = () => {
    const newErrors: string[] = []

    const modifiers = menuItem.modifiers || []
    modifiers.forEach((modifier) => {
      const selections = selectedModifiers[modifier.name] || []

      if (modifier.required && selections.length === 0) {
        newErrors.push(`${modifier.name} is required`)
      }

      if (selections.length > modifier.max_selections) {
        newErrors.push(`${modifier.name} allows maximum ${modifier.max_selections} selections`)
      }
    })

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleConfirm = () => {
    if (validateSelections()) {
      onConfirm(selectedModifiers)
    }
  }

  const calculateTotalPrice = () => {
    const modifierPrice = Object.values(selectedModifiers)
      .flat()
      .reduce((sum, option) => sum + option.price, 0)
    return menuItem.price + modifierPrice
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Customize {menuItem.name}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {(menuItem.modifiers || []).map((modifier) => (
            <div key={modifier.id} className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">
                  {modifier.name}
                  {modifier.required && <span className="text-red-500 ml-1">*</span>}
                </h3>
                <span className="text-sm text-gray-500">
                  {modifier.max_selections === 1 ? "Choose 1" : `Choose up to ${modifier.max_selections}`}
                </span>
              </div>

              {modifier.max_selections === 1 ? (
                <RadioGroup
                  value={selectedModifiers[modifier.name]?.[0]?.id || ""}
                  onValueChange={(value) => {
                    const option = modifier.options.find((opt) => opt.id === value)
                    if (option) {
                      handleModifierChange(modifier, option, true)
                    }
                  }}
                >
                  {modifier.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="flex-1 flex justify-between">
                        <span>{option.name}</span>
                        {option.price > 0 && <span className="text-green-600">+${option.price.toFixed(2)}</span>}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <div className="space-y-2">
                  {modifier.options.map((option) => {
                    const isSelected = selectedModifiers[modifier.name]?.some((opt) => opt.id === option.id) || false
                    const currentCount = selectedModifiers[modifier.name]?.length || 0
                    const canSelect = currentCount < modifier.max_selections || isSelected

                    return (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={option.id}
                          checked={isSelected}
                          disabled={!canSelect}
                          onCheckedChange={(checked) => handleModifierChange(modifier, option, checked as boolean)}
                        />
                        <Label
                          htmlFor={option.id}
                          className={`flex-1 flex justify-between ${!canSelect ? "text-gray-400" : ""}`}
                        >
                          <span>{option.name}</span>
                          {option.price > 0 && <span className="text-green-600">+${option.price.toFixed(2)}</span>}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <ul className="text-red-600 text-sm space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-lg font-bold">Total: ${calculateTotalPrice().toFixed(2)}</div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
                Add to Order
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
