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

  const NavItem = ({ href, label, icon: Icon }) => {
    const isActive = pathname === href
    return (
      <Link
        href={href}
        className={[
          "group flex items-center gap-3 px-4 h-12 rounded-2xl transition-all",
          isActive
            ? "bg-sky-500 text-white shadow-md"
            : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
        ].join(" ")}
      >
        <span
          className={[
            "rounded-xl p-2 transition-colors",
            isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400 group-hover:text-gray-600",
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className={isActive ? "font-semibold" : "font-medium"}>{label}</span>
      </Link>
    )
  }

  return (
    <aside className="fixed top-0 left-0 w-72 h-screen bg-white text-black flex flex-col shadow-md">
      {/* Logo */}
      <div className="py-6 px-4 border-b border-gray-200 flex items-center justify-center">
        <Image src="/bulog.svg" alt="Bulog Logo" width={140} height={44} priority />
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menu.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}

        {/* Tombol Logout */}
        <button
          onClick={logout}
          className="mt-6 w-full flex items-center justify-between px-4 h-10 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
        >
          <span>Log out</span>
          <LogOut className="h-5 w-5" />
        </button>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 text-sm text-gray-400">
        Login sebagai: <span className="font-semibold text-gray-700">{user.role}</span>
      </div>
    </aside>
  )
}