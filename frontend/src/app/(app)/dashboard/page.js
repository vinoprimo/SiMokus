"use client"

import { useEffect, useState } from "react"
import { Warehouse, Search, AlertCircle, Layers, Gauge, SprayCan, CloudFog } from "lucide-react"

export default function Dashboard() {
  const [time, setTime] = useState(new Date())
  const [fumigations, setFumigations] = useState([])
  const [fumigationsAll, setFumigationsAll] = useState([])
  const [complexes, setComplexes] = useState([])
  const [search, setSearch] = useState("")
  const [latestFreeByWarehouse, setLatestFreeByWarehouse] = useState({})
  const [layoutPreview, setLayoutPreview] = useState(null)
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

  // Helper untuk membuat URL absolut
  const absUrl = (u) => (!u ? "" : /^https?:\/\//i.test(u) ? u : `${baseUrl}${u.startsWith("/") ? "" : "/"}${u}`)

  // Update jam realtime
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hour = time.getHours()
  let greeting = "Selamat Malam"
  if (hour >= 5 && hour < 12) greeting = "Selamat Pagi"
  else if (hour >= 12 && hour < 15) greeting = "Selamat Siang"
  else if (hour >= 15 && hour < 18) greeting = "Selamat Sore"

  // Fetch data dari Laravel
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [activeRes, allRes, complexRes, spacesRes] = await Promise.all([
        fetch(`${baseUrl}/api/fumigations/active`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        }).then((r) => r.json()),
        fetch(`${baseUrl}/api/fumigations`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        }).then((r) => r.json()),
        // Minta relasi warehouses
        fetch(`${baseUrl}/api/warehouse-complexes?with=warehouses`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        }).then((r) => r.json()),
        // Ambil riwayat space untuk hitung free_space terbaru per gudang
        fetch(`${baseUrl}/api/spaces`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        }).then((r) => r.json()),
      ])

      // Bangun map free_space terbaru per warehouse
      const latestMap = {}
      if (Array.isArray(spacesRes)) {
        const sorted = [...spacesRes].sort((a, b) => {
          const bd = new Date(b.date).getTime() - new Date(a.date).getTime()
          if (bd !== 0) return bd
          return (b.id || 0) - (a.id || 0)
        })
        for (const s of sorted) {
          const wid = s.warehouse_id || s.warehouse?.id
          if (!wid) continue
          if (latestMap[wid] == null) latestMap[wid] = Number(s.free_space || 0)
        }
      }

      setFumigations(activeRes || [])
      setFumigationsAll(allRes || [])
      setComplexes(complexRes || [])
      setLatestFreeByWarehouse(latestMap) // <-- simpan map
    } catch (e) {
      console.error("Gagal fetch data dashboard:", e)
      setFumigations([])
      setFumigationsAll([])
      setComplexes([])
      setLatestFreeByWarehouse({})
    }
  }

  const today = new Date().toISOString().split("T")[0]

  // Filter aktif spraying & fumigasi
  const activeSprayings = fumigations.filter(
    (f) => f.type === "spraying" && f.date === today
  )
  const activeFumigations = fumigations.filter(
    (f) =>
      f.type === "fumigasi" &&
      f.start_date &&
      f.end_date &&
      today >= f.start_date &&
      today <= f.end_date
  )

  // Helper: nama kompleks dari warehouse id
  const getComplexNameByWarehouseId = (wid) => {
    const idStr = String(wid ?? "")
    for (const c of complexes || []) {
      if ((c.warehouses || []).some((w) => String(w.id) === idStr)) return c.name
    }
    return "-"
  }

  // Set ID gudang yang sedang aktif untuk penanda UI
  const sprayingIds = new Set(activeSprayings.map((s) => s.warehouse_id ?? s.warehouse?.id))
  const fumigasiIds = new Set(activeFumigations.map((f) => f.warehouse_id ?? f.warehouse?.id))

  const filteredComplexes = complexes.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  // Helper buat dapetin fumigasi/spraying terakhir
  const getLastFumigationDate = (warehouseId, type) => {
    const records = (fumigationsAll || [])
      .filter((f) => f.warehouse_id === warehouseId && f.type === type)
      .sort((a, b) => new Date(b.date || b.end_date) - new Date(a.date || a.end_date))

    if (records.length === 0) return "-"
    const record = records[0]
    return type === "spraying"
      ? record.date
      : `${record.start_date} - ${record.end_date}`
  }

  // Helper untuk lingkaran kapasitas
  const CapacityCircle = ({ used, total }) => {
    const percentUsed = total > 0 ? Math.round((used / total) * 100) : 0
    const radius = 25
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentUsed / 100) * circumference

    // Warna: 0% hijau -> 100% merah (gradasi HSL)
    const hue = Math.max(0, 120 - Math.round(1.2 * percentUsed)) // 120=green -> 0=red
    const color = `hsl(${hue} 85% 45%)`

    return (
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg width="60" height="60">
          <circle
            cx="30"
            cy="30"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx="30"
            cy="30"
            r={radius}
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 30 30)"
          />
        </svg>
        <span className="absolute text-sm font-medium" style={{ color }}>{percentUsed}%</span>
      </div>
    )
  }

  // Derivasi statistik kumulatif
  const totalComplexCount = complexes.length
  const allWarehouses = (complexes || []).flatMap((c) => c.warehouses || [])
  const totalWarehouseCount = allWarehouses.length // jika masih ingin dipakai di tempat lain
  const totalCapacity = allWarehouses.reduce(
    (sum, w) => sum + Number(w.capacity || 0),
    0
  )
  const totalFreeRemaining = allWarehouses.reduce(
    (sum, w) => sum + Number(latestFreeByWarehouse[w.id] ?? 0),
    0
  )
  const sprayingCount = activeSprayings.length
  const fumigasiCount = activeFumigations.length

  const fmtTon = (v) =>
    `${Number.isFinite(Number(v)) ? Number(v).toLocaleString("id-ID") : 0}`

  return (
    <div className="min-h-screen bg-gray">
      <div className="pl-24 pr-12 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">
            {greeting}, Selamat Datang di SiMokus 👋
          </h1>
          <div className="text-lg font-mono">{time.toLocaleTimeString("id-ID")}</div>
        </div>

        {/* Peta Karesidenan */}
        <div className="mb-8">
          <img
            src="/karesidenan.png"
            alt="Peta Karesidenan"
            className="w-full max-h-[460px] object-contain rounded-2xl border shadow-md"
          />
        </div>

        {/* Rekap Kumulatif */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Total Kompleks */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
            <div className="absolute inset-0 pointer-events-none opacity-[0.4] bg-[radial-gradient(circle_at_1px_1px,#e2e8f0_1px,transparent_0)] [background-size:14px_14px]"></div>
            <div className="relative flex items-start gap-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-sky-500 text-white shadow-md ring-2 ring-white/40 transition group-hover:scale-105">
                <Layers className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Total Kompleks Gudang</p>
                <p className="mt-2 text-3xl font-semibold">{totalComplexCount}</p>
              </div>
            </div>
          </div>

          {/* Kapasitas */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
            <div className="absolute inset-0 pointer-events-none opacity-[0.35] bg-[radial-gradient(circle_at_1px_1px,#f1f5f9_1px,transparent_0)] [background-size:16px_16px]"></div>
            <div className="relative flex items-start gap-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-indigo-500 text-white shadow-md ring-2 ring-white/40 transition group-hover:scale-105">
                <Gauge className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Total Kapasitas Tersisa</p>
                <p className="mt-2 text-sm font-medium">
                  <span className="text-xl font-semibold">{fmtTon(totalFreeRemaining)}</span>
                  <span className="text-gray-400"> / {fmtTon(totalCapacity)} ton</span>
                </p>
                {totalCapacity > 0 && (
                  <div className="mt-3">
                    <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-500 group-hover:bg-indigo-600"
                        style={{ width: `${Math.min(100, Math.round((totalFreeRemaining / totalCapacity) * 100))}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {Math.round((totalFreeRemaining / totalCapacity) * 100)}% tersisa
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Spraying Aktif */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
            <div className="absolute inset-0 pointer-events-none opacity-[0.45] bg-[radial-gradient(circle_at_1px_1px,#e2e8f0_1px,transparent_0)] [background-size:15px_15px]"></div>
            <div className="relative flex items-start gap-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-green-500 text-white shadow-md ring-2 ring-white/40 transition group-hover:scale-105">
                <SprayCan className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Gudang Sedang Spraying</p>
                <p className="mt-2 text-3xl font-semibold">{sprayingCount}</p>
              </div>
            </div>
          </div>

          {/* Fumigasi Aktif */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
            <div className="absolute inset-0 pointer-events-none opacity-[0.4] bg-[radial-gradient(circle_at_1px_1px,#f1f5f9_1px,transparent_0)] [background-size:14px_14px]"></div>
            <div className="relative flex items-start gap-4">
              <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-red-500 text-white shadow-md ring-2 ring-white/40 transition group-hover:scale-105">
                <CloudFog className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Gudang Sedang Fumigasi</p>
                <p className="mt-2 text-3xl font-semibold">{fumigasiCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rekap Spraying & Fumigasi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Rekap Spraying */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
            <div className="absolute inset-0 pointer-events-none opacity-[0.35] bg-[radial-gradient(circle_at_1px_1px,#eef2f7_1px,transparent_0)] [background-size:16px_16px]"></div>
            <h2 className="relative text-lg font-semibold mb-1">Rekap Spraying Aktif</h2>
            <p className="relative text-xs text-gray-500 mb-4">
              Total: {activeSprayings.length} gudang
            </p>
            {activeSprayings.length === 0 ? (
              <div className="relative flex flex-col items-center justify-center py-12 text-center">
                <div className="h-14 w-14 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 mb-4">
                  <SprayCan className="h-8 w-8" />
                </div>
                <p className="text-gray-500 text-sm font-medium">
                  Tidak ada gudang yang sedang spraying.
                </p>
              </div>
            ) : (
              <>
                <table className="relative w-full text-sm rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border px-3 py-2 text-left text-gray-600 font-medium">Kompleks</th>
                      <th className="border px-3 py-2 text-left text-gray-600 font-medium">Gudang</th>
                      <th className="border px-3 py-2 text-left text-gray-600 font-medium">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSprayings.map((s) => {
                      const wid = s.warehouse_id ?? s.warehouse?.id
                      const complexName = s.warehouse?.complex?.name ?? getComplexNameByWarehouseId(wid)
                      return (
                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                          <td className="border px-3 py-2">{complexName}</td>
                          <td className="border px-3 py-2">{s.warehouse?.name}</td>
                          <td className="border px-3 py-2">{s.date}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className="mt-4 flex items-center justify-between pt-3 border-t text-xs text-gray-500">
                  <span>Update terbaru</span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Real-time
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Rekap Fumigasi */}
          <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-md border border-gray-100 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl">
            <div className="absolute inset-0 pointer-events-none opacity-[0.35] bg-[radial-gradient(circle_at_1px_1px,#eef2f7_1px,transparent_0)] [background-size:16px_16px]"></div>
            <h2 className="relative text-lg font-semibold mb-1">Rekap Fumigasi Aktif</h2>
            <p className="relative text-xs text-gray-500 mb-4">
              Total: {activeFumigations.length} gudang
            </p>
            {activeFumigations.length === 0 ? (
              <div className="relative flex flex-col items-center justify-center py-12 text-center">
                <div className="h-14 w-14 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 mb-4">
                  <CloudFog className="h-8 w-8" />
                </div>
                <p className="text-gray-500 text-sm font-medium">
                  Tidak ada gudang yang sedang fumigasi.
                </p>
              </div>
            ) : (
              <>
                <table className="relative w-full text-sm rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border px-3 py-2 text-left text-gray-600 font-medium">Kompleks</th>
                      <th className="border px-3 py-2 text-left text-gray-600 font-medium">Gudang</th>
                      <th className="border px-3 py-2 text-left text-gray-600 font-medium">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeFumigations.map((f) => {
                      const wid = f.warehouse_id ?? f.warehouse?.id
                      const complexName = f.warehouse?.complex?.name ?? getComplexNameByWarehouseId(wid)
                      return (
                        <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                          <td className="border px-3 py-2">{complexName}</td>
                          <td className="border px-3 py-2">{f.warehouse?.name}</td>
                          <td className="border px-3 py-2">
                            {f.start_date} - {f.end_date}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className="mt-4 flex items-center justify-between pt-3 border-t text-xs text-gray-500">
                  <span>Update terbaru</span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Real-time
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex justify-start mb-4">
          <div className="flex items-center border rounded-lg px-3 py-1 bg-white">
            <Search className="w-4 h-4 text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Cari kompleks gudang..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-sm w-64"
            />
          </div>
        </div>

        {/* Kompleks Gudang */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComplexes.length === 0 ? (
            <p className="text-gray-500">Tidak ada kompleks gudang ditemukan.</p>
          ) : (
            filteredComplexes.map((complex) => (
              <div key={complex.id} className="bg-white rounded-xl shadow-md p-5">
                {/* Header kompleks */}
                <div className="flex items-center gap-2 mb-3">
                  <Warehouse className="w-5 h-5 text-gray-700" />
                  <div className="flex-1">
                    <h2 className="font-bold text-gray-800">{complex.name}</h2>
                    <p className="text-sm text-gray-500">{complex.location}</p>
                  </div>
                  {complex.layout_image_url && (
                    <button
                      onClick={() => setLayoutPreview(absUrl(complex.layout_image_url))}
                      className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Denah
                    </button>
                  )}
                </div>

                {/* Daftar gudang */}
                {complex.warehouses && complex.warehouses.length > 0 ? (
                  <div className="space-y-3">
                    {complex.warehouses.map((w) => {
                      const total = Number(w.capacity || 0)
                      const latestVal = latestFreeByWarehouse[w.id]

                      // Nilai latestVal diperlakukan sebagai 'terpakai'
                      const used = total > 0
                        ? Math.max(0, Math.min(total, Number(latestVal ?? 0)))
                        : 0

                      // Space tersisa aktual dari riwayat
                      const freeRemaining = Number(latestVal ?? 0)

                      const isSpraying = sprayingIds.has(w.id)
                      const isFumigasi = fumigasiIds.has(w.id)
                      const isActive = isSpraying || isFumigasi
                      const cardClass = `flex items-center justify-between border rounded-lg p-3 relative ${
                        isActive ? "bg-red-50 border-red-200" : ""
                      }`

                      return (
                        <div key={w.id} className={cardClass}>
                          {/* Penanda status aktif - ikon alert + tooltip di sudut kanan atas */}
                          <div className="absolute top-0 right-0 p-1 z-10 flex items-center gap-1">
                            {isFumigasi && (
                              <div className="group relative">
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <div className="pointer-events-none absolute right-0 top-full mt-1 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition">
                                  Sedang fumigasi
                                </div>
                              </div>
                            )}
                            {isSpraying && (
                              <div className="group relative">
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <div className="pointer-events-none absolute right-0 top-full mt-1 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition">
                                  Sedang spraying
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="font-medium text-gray-800">{w.name}</p>
                            <p className="text-xs text-gray-500">
                              Fumigasi terakhir: {getLastFumigationDate(w.id, "fumigasi")}
                            </p>
                            <p className="text-xs text-gray-500">
                              Spraying terakhir: {getLastFumigationDate(w.id, "spraying")}
                            </p>
                            <p className="text-xs text-gray-700">
                              Penyimpanan tersisa: {freeRemaining}/{total} ton
                            </p>
                          </div>
                          <CapacityCircle used={used} total={total} />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Tidak ada gudang dalam kompleks ini.
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {layoutPreview && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
            onClick={() => setLayoutPreview(null)}
          >
            <div
              className="bg-white rounded-xl shadow-xl p-4 max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold">Denah Kompleks</h2>
                <button
                  onClick={() => setLayoutPreview(null)}
                  className="text-sm px-3 py-1 border rounded"
                >
                  Tutup
                </button>
              </div>
              <img
                src={layoutPreview}
                alt="Denah Kompleks"
                className="w-full max-h-[75vh] object-contain rounded border"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
