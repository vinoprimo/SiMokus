// src/app/(app)/layout.js
"use client"

import Sidebar from "@/components/Sidebar"

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-6 bg-gray-100 min-h-screen">
        {children}
      </main>
    </div>
  )
}
