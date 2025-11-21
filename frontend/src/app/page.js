'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/auth'

export default function HomePage() {
  const router = useRouter()
  const { user } = useAuth({ middleware: 'guest' })

  useEffect(() => {
    if (user) {
      // Jika sudah login, redirect ke dashboard
      router.push('/dashboard')
    } else {
      // Jika belum login, redirect ke login
      router.push('/login')
    }
  }, [user, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
