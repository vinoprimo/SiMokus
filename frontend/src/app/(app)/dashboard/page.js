"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/auth"

export default function Dashboard() {
    const { user } = useAuth({ middleware: "auth" })
    const [time, setTime] = useState(new Date())

    // Update jam realtime
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Salam dinamis
    const hour = time.getHours()
    let greeting = "Selamat Malam"
    if (hour >= 5 && hour < 12) greeting = "Selamat Pagi"
    else if (hour >= 12 && hour < 15) greeting = "Selamat Siang"
    else if (hour >= 15 && hour < 18) greeting = "Selamat Sore"

    return (
        <div className="min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                    {greeting}, {user?.name}
                </h1>
                <div className="text-lg font-mono">
                    {time.toLocaleTimeString("id-ID")}
                </div>
            </div>

            {/* Rekap Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-2">Rekap Spraying</h2>
                    <p className="text-gray-600">Belum ada data spraying.</p>
                </div>

                <div className="bg-white shadow-md rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-2">Rekap Fumigasi</h2>
                    <p className="text-gray-600">Belum ada data fumigasi.</p>
                </div>
            </div>
        </div>
    )
}
