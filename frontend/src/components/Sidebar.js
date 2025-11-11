"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "../hooks/auth"
import Image from "next/image"
import {
  LayoutDashboard,
  Users,
  Warehouse,
  Box,
  Calendar,
  SprayCan,
  LogOut,
} from "lucide-react"

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  if (!user) return null

  const superadminMenu = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Kelola Admin", href: "/kelola-admin", icon: Users },
    { label: "Kelola Gudang", href: "/kelola-gudang", icon: Warehouse },
    { label: "Input Penyimpanan", href: "/input-space", icon: Box },
    { label: "Jadwal Fumigasi", href: "/jadwal-fumigasi", icon: Calendar },
    { label: "Jadwal Spraying", href: "/jadwal-spraying", icon: SprayCan },
  ]
  
  const adminMenu = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Input Penyimpanan", href: "/input-space", icon: Box },
    { label: "Jadwal Fumigasi", href: "/jadwal-fumigasi", icon: Calendar },
    { label: "Jadwal Spraying", href: "/jadwal-spraying", icon: SprayCan },
  ]

  const menu = user.role === "superadmin" ? superadminMenu : adminMenu

  return (
    <aside className="fixed top-0 left-0 w-64 h-screen bg-white text-black flex flex-col shadow-md">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-center">
        <Image src="/bulog.svg" alt="Bulog Logo" width={120} height={40} priority />
      </div>

      {/* Menu */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menu.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-md transition ${
                pathname === item.href
                  ? "bg-[#2525a1] text-white font-semibold"
                  : "hover:bg-[#2525a1] hover:text-white text-black"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}

        {/* Tombol Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2 mt-4 rounded-md text-red-600 hover:bg-red-100 transition"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 text-sm">
        Login sebagai: <span className="font-semibold">{user.role}</span>
      </div>
    </aside>
  )
}
