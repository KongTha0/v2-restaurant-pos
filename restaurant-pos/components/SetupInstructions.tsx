"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, Play } from "lucide-react"

export function SetupInstructions() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Database Setup Required
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Quick Setup Steps:</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Click "Add Supabase integration" below</li>
              <li>Create a new Supabase project or connect existing one</li>
              <li>Run the database scripts to create tables</li>
              <li>The POS system will be ready to use!</li>
            </ol>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Badge variant="outline">Step 1</Badge>
              <div>
                <h4 className="font-medium">Add Supabase Integration</h4>
                <p className="text-sm text-gray-600">Connect your Supabase database to enable all POS features</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline">Step 2</Badge>
              <div>
                <h4 className="font-medium">Create Database Tables</h4>
                <p className="text-sm text-gray-600">
                  Run the SQL scripts to set up employees, menu items, orders, and more
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline">Step 3</Badge>
              <div>
                <h4 className="font-medium">Seed Sample Data</h4>
                <p className="text-sm text-gray-600">Add sample employees, menu items, and categories to get started</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Play className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-green-900">Ready to Start</h4>
            </div>
            <p className="text-sm text-green-800">
              Once setup is complete, you can log in with these sample credentials:
            </p>
            <ul className="text-sm text-green-800 mt-2 space-y-1">
              <li>• Manager: PIN 1234 (John Manager)</li>
              <li>• Cashier: PIN 5678 (Jane Cashier)</li>
              <li>• Cashier: PIN 7890 (Mike Cashier)</li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">Environment Variables Needed:</h4>
            <div className="font-mono text-sm text-yellow-800 space-y-1">
              <div>NEXT_PUBLIC_SUPABASE_URL</div>
              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
