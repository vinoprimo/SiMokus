// src/app/(app)/layout.js
"use client"

import Sidebar from "@/components/Sidebar"

export default function AppLayout({ children }) {
  return (
    <>
      <Sidebar />
      {/* Main content - NO flex, pure overlay approach */}
      <main className="w-full">
        {children}
      </main>
    </>
  )
}
