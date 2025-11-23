"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "../hooks/auth"
import Image from "next/image"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  Users,
  Warehouse,
  Box,
  Calendar,
  SprayCan,
  LogOut,
  Menu,
  X,
} from "lucide-react"

export default function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  // ✅ Move all hooks BEFORE any conditional returns
  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent body scroll when sidebar is open (mobile)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // ✅ NOW it's safe to return early
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
    <>
      {/* Hamburger Button - Mobile Only */}
      <button
        onClick={() => setIsOpen(true)}
        className="sm:hidden fixed top-4 left-4 z-50 p-2.5 bg-white rounded-lg shadow-lg hover:bg-gray-50 transition border border-gray-200"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6 text-gray-700" />
      </button>

      {/* Overlay - Mobile Only */}
      {isOpen && (
        <div
          className="sm:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Always on left, hidden on mobile unless open */}
      <aside
        className={[
          "fixed top-0 left-0 h-screen bg-white flex flex-col shadow-lg transition-transform duration-300 z-50",
          "w-64 sm:w-72",
          // Mobile: translate offscreen, Desktop: always visible
          isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0",
        ].join(" ")}
      >
        {/* Logo */}
        <div className="py-4 sm:py-6 px-4 border-b border-gray-200 flex items-center justify-between sm:justify-center">
          <Image 
            src="/bulog.svg" 
            alt="Bulog Logo" 
            width={120} 
            height={38} 
            priority 
            className="w-[100px] sm:w-[140px] h-auto" 
          />
          
          {/* Close Button - Mobile Only */}
          <button
            onClick={() => setIsOpen(false)}
            className="sm:hidden p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Close menu"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
          {menu.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}

          {/* Logout Button */}
          <button
            onClick={logout}
            className="mt-4 sm:mt-6 w-full flex items-center justify-between px-4 h-10 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
          >
            <span className="text-sm sm:text-base">Log out</span>
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </nav>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-gray-200 text-xs sm:text-sm text-gray-400">
          Login sebagai: <span className="font-semibold text-gray-700">{user.role}</span>
        </div>
      </aside>
    </>
  )
}