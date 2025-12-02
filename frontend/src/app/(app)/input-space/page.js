"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"

export default function SpacesPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

  // MODE TOGGLE
  const [mode, setMode] = useState("adm") // "adm" or "activity"

  // Data
  const [complexes, setComplexes] = useState([])
  const [spaces, setSpaces] = useState([])

  // UI
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Form state
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [complexId, setComplexId] = useState("")
  const [warehouseId, setWarehouseId] = useState("")
  const [freeSpace, setFreeSpace] = useState("")

  // FILTERS
  const [filterComplexId, setFilterComplexId] = useState("")
  const [filterWarehouseId, setFilterWarehouseId] = useState("")
  const [filterStart, setFilterStart] = useState("")
  const [filterEnd, setFilterEnd] = useState("")
  const [showChart, setShowChart] = useState(false)

  const fmtTon = (val) =>
    val === null || val === undefined || val === "-" ? "-" : `${Number(val).toLocaleString("id-ID")} ton`
  const fmtDelta = (d) => {
    const n = Number(d) || 0
    if (n > 0) return `+${n.toLocaleString("id-ID")} ton`
    if (n < 0) return `${n.toLocaleString("id-ID")} ton`
    return "0 ton"
  }

  useEffect(() => {
    fetchInitial()
  }, [mode]) // Refetch when mode changes

  const fetchInitial = async () => {
    try {
      setError("")
      const [complexRes, spacesRes] = await Promise.all([
        axios.get(`${baseUrl}/api/warehouse-complexes?with=warehouses`, {
          withCredentials: true,
          headers: { Accept: "application/json" },
          xsrfCookieName: "XSRF-TOKEN",
          xsrfHeaderName: "X-XSRF-TOKEN",
        }),
        axios.get(`${baseUrl}/api/spaces?mode=${mode}`, {
          withCredentials: true,
          headers: { Accept: "application/json" },
          xsrfCookieName: "XSRF-TOKEN",
          xsrfHeaderName: "X-XSRF-TOKEN",
        }),
      ])
      setComplexes(Array.isArray(complexRes.data) ? complexRes.data : [])
      setSpaces(Array.isArray(spacesRes.data) ? spacesRes.data : [])
    } catch (e) {
      console.error("Gagal memuat data:", e)
      setError("Gagal memuat data awal")
    }
  }

  const ensureCsrf = async () => {
    await axios.get(`${baseUrl}/sanctum/csrf-cookie`, {
      withCredentials: true,
      headers: { Accept: "application/json" },
    })
  }

  const warehousesInComplex = useMemo(() => {
    if (!complexId) return []
    const c = complexes.find((x) => String(x.id) === String(complexId))
    return c?.warehouses || []
  }, [complexId, complexes])

  const filterWarehousesInComplex = useMemo(() => {
    if (!filterComplexId) return []
    const c = complexes.find((x) => String(x.id) === String(filterComplexId))
    return c?.warehouses || []
  }, [filterComplexId, complexes])

  const deltaById = useMemo(() => {
    const byId = {}
    const asc = [...spaces].sort((a, b) => {
      const ad = new Date(a.date).getTime()
      const bd = new Date(b.date).getTime()
      if (ad !== bd) return ad - bd
      return (a.id || 0) - (b.id || 0)
    })
    const lastByWarehouse = {}
    for (const s of asc) {
      const wid = s.warehouse_id || s.warehouse?.id
      const prev = lastByWarehouse[wid]
      const current = Number(s.free_space || 0)
      const delta = prev == null ? 0 : current - prev
      byId[s.id] = delta
      lastByWarehouse[wid] = current
    }
    return byId
  }, [spaces])

  const selectedWarehouse = useMemo(
    () => warehousesInComplex.find((w) => String(w.id) === String(warehouseId)),
    [warehousesInComplex, warehouseId]
  )

  const filteredSpaces = useMemo(() => {
    return (spaces || []).filter((s) => {
      if (filterComplexId) {
        const cid = s.warehouse?.complex?.id ?? s.warehouse?.warehouse_complex_id
        if (String(cid) !== String(filterComplexId)) return false
      }
      if (filterWarehouseId) {
        const wid = s.warehouse_id ?? s.warehouse?.id
        if (String(wid) !== String(filterWarehouseId)) return false
      }
      if (filterStart && new Date(s.date) < new Date(filterStart)) return false
      if (filterEnd && new Date(s.date) > new Date(filterEnd)) return false
      return true
    })
  }, [spaces, filterComplexId, filterWarehouseId, filterStart, filterEnd])

  const canShowChart = !!(filterComplexId && filterWarehouseId)

  const chartPoints = useMemo(() => {
    if (!canShowChart) return []
    const items = [...filteredSpaces]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((s) => ({ date: s.date, value: Number(s.free_space || 0) }))
    return items
  }, [filteredSpaces, canShowChart])

  const warehouseCapacity = useMemo(() => {
    if (!filterWarehouseId) return 0
    const spaces = filteredSpaces.filter(s => {
      const wid = s.warehouse_id ?? s.warehouse?.id
      return String(wid) === String(filterWarehouseId)
    })
    return spaces[0]?.warehouse?.capacity || 0
  }, [filterWarehouseId, filteredSpaces])

  const SpaceLineChart = ({ points = [], maxCapacity = 0 }) => {
    if (!points.length) return null
    const W = 820, H = 300
    const m = { top: 20, right: 16, bottom: 36, left: 56 }
    const iw = W - m.left - m.right
    const ih = H - m.top - m.bottom
    
    // Set Y axis from 0 to warehouse capacity
    const minY = 0
    const maxY = Math.max(maxCapacity, ...points.map(p => p.value), 10)
    const spanY = maxY - minY || 1
    
    const xAt = (i) => m.left + (iw * (points.length === 1 ? 0.5 : i / (points.length - 1)))
    const yAt = (v) => m.top + (maxY - v) * (ih / spanY)
    
    const pathD = points
      .map((p, i) => `${i ? "L" : "M"} ${xAt(i)} ${yAt(p.value)}`)
      .join(" ")
    const areaD = `${pathD} L ${xAt(points.length - 1)} ${yAt(0)} L ${xAt(0)} ${yAt(0)} Z`
    
    const tickCount = 5
    const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => minY + (spanY * i) / tickCount)
    
    const fmtDate = (d) =>
      new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })
    const xLabelStep = Math.max(1, Math.floor(Math.max(1, points.length - 1) / 5))
  
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[300px]">
        <defs>
          <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        
        {/* Grid lines and Y-axis labels */}
        {yTicks.map((t, i) => {
          const y = yAt(t)
          const isCapacity = Math.abs(t - maxCapacity) < 0.01
          return (
            <g key={i}>
              <line 
                x1={m.left} 
                x2={m.left + iw} 
                y1={y} 
                y2={y} 
                stroke={isCapacity ? "#ef4444" : "#e5e7eb"} 
                strokeWidth={isCapacity ? "1.5" : "1"}
                strokeDasharray={isCapacity ? "4 2" : "none"}
              />
              <text 
                x={m.left - 8} 
                y={y} 
                textAnchor="end" 
                dominantBaseline="middle" 
                fill={isCapacity ? "#ef4444" : "#6b7280"} 
                fontSize="11"
                fontWeight={isCapacity ? "600" : "normal"}
              >
                {t.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
              </text>
              {isCapacity && (
                <text 
                  x={m.left + iw + 8} 
                  y={y} 
                  textAnchor="start" 
                  dominantBaseline="middle" 
                  fill="#ef4444" 
                  fontSize="10"
                  fontWeight="600"
                >
                  Max
                </text>
              )}
            </g>
          )
        })}
        
        {/* X-axis */}
        <line x1={m.left} x2={m.left + iw} y1={m.top + ih} y2={m.top + ih} stroke="#9ca3af" strokeWidth="1.5" />
        
        {/* Y-axis */}
        <line x1={m.left} x2={m.left} y1={m.top} y2={m.top + ih} stroke="#9ca3af" strokeWidth="1.5" />
        
        {/* X-axis labels */}
        {points.map((p, i) => {
          if (i % xLabelStep !== 0 && i !== points.length - 1) return null
          const x = xAt(i)
          return (
            <text key={i} x={x} y={m.top + ih + 18} textAnchor="middle" fill="#6b7280" fontSize="11">
              {fmtDate(p.date)}
            </text>
          )
        })}
        
        {/* Area fill */}
        <path d={areaD} fill="url(#areaFill)" />
        
        {/* Line */}
        <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="2.5" />
        
        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={xAt(i)} cy={yAt(p.value)} r="4" fill="white" stroke="#4f46e5" strokeWidth="2" />
            <circle cx={xAt(i)} cy={yAt(p.value)} r="2" fill="#4f46e5" />
          </g>
        ))}
        
        {/* Y-axis label */}
        <text 
          x={m.left - 40} 
          y={m.top + ih / 2} 
          textAnchor="middle" 
          fill="#6b7280" 
          fontSize="11"
          fontWeight="600"
          transform={`rotate(-90, ${m.left - 40}, ${m.top + ih / 2})`}
        >
          Ruang Terpakai (ton)
        </text>
        
        {/* X-axis label */}
        <text 
          x={m.left + iw / 2} 
          y={H - 8} 
          textAnchor="middle" 
          fill="#6b7280" 
          fontSize="11"
          fontWeight="600"
        >
          Tanggal
        </text>
      </svg>
    )
  }

  const submit = async (e) => {
    e?.preventDefault()
    if (!date || !warehouseId || freeSpace === "") {
      setError("Tanggal, Gudang, dan Space tersisa wajib diisi.")
      return
    }
    setLoading(true)
    setError("")
    try {
      await ensureCsrf()
      await axios.post(
        `${baseUrl}/api/spaces`,
        {
          warehouse_id: Number(warehouseId),
          date,
          free_space: Number(freeSpace),
          mode, // Send current mode
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          xsrfCookieName: "XSRF-TOKEN",
          xsrfHeaderName: "X-XSRF-TOKEN",
        }
      )

      const fresh = await axios.get(`${baseUrl}/api/spaces?mode=${mode}`, {
        withCredentials: true,
        headers: { Accept: "application/json" },
        xsrfCookieName: "XSRF-TOKEN",
        xsrfHeaderName: "X-XSRF-TOKEN",
      })
      setSpaces(Array.isArray(fresh.data) ? fresh.data : [])

      setOpen(false)
      setFreeSpace("")
    } catch (e2) {
      console.error("Gagal simpan space:", e2)
      setError("Gagal menyimpan data space.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 pt-16 px-4 pb-6 sm:pt-6 sm:pl-80 sm:pr-12">
        {/* Header with Mode Toggle */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold">Input Space Gudang</h1>
            <button
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition whitespace-nowrap"
              onClick={() => setOpen(true)}
            >
              + Input Space
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm border">
            <span className="text-sm font-medium text-gray-700">Mode Tampilan:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setMode("adm")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  mode === "adm"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                By ADM
              </button>
              <button
                onClick={() => setMode("activity")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  mode === "activity"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                By Activity
              </button>
            </div>
            <div className="ml-auto text-xs text-gray-500">
              {mode === "adm" ? "📊 Data ADM" : "📈 Data Activity"}
            </div>
          </div>
        </div>

        {/* Modal */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => !loading && setOpen(false)} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">
                  Tambah Input Space ({mode === "adm" ? "ADM" : "Activity"})
                </h2>
                {error && <div className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
                
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kompleks Pergudangan</label>
                      <select
                        value={complexId}
                        onChange={(e) => {
                          setComplexId(e.target.value)
                          setWarehouseId("")
                        }}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Pilih kompleks</option>
                        {complexes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gudang</label>
                      <select
                        value={warehouseId}
                        onChange={(e) => setWarehouseId(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={!complexId}
                      >
                        <option value="">Pilih gudang</option>
                        {warehousesInComplex.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                      {selectedWarehouse && (
                        <p className="text-xs text-gray-500 mt-1">
                          Kapasitas gudang: {fmtTon(selectedWarehouse.capacity ?? "-")}
                        </p>
                      )}
                    </div>
                    
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ruang Penyimpanan Terpakai (ton)</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={freeSpace}
                        onChange={(e) => setFreeSpace(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: 2500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg border hover:bg-gray-50 transition font-medium"
                      onClick={() => !loading && setOpen(false)}
                      disabled={loading}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition font-medium"
                      disabled={loading}
                    >
                      {loading ? "Menyimpan..." : "Simpan"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Riwayat + Filter */}
        <div className="mt-6 bg-white rounded-xl shadow-md">
          <div className="p-4 border-b">
            <h2 className="text-base sm:text-lg font-semibold">
              Riwayat Perubahan ({mode === "adm" ? "ADM" : "Activity"})
            </h2>
          </div>

          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Kompleks</label>
                <select
                  value={filterComplexId}
                  onChange={(e) => {
                    setFilterComplexId(e.target.value)
                    setFilterWarehouseId("")
                  }}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua kompleks</option>
                  {complexes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Gudang</label>
                <select
                  value={filterWarehouseId}
                  onChange={(e) => setFilterWarehouseId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!filterComplexId}
                >
                  <option value="">Semua gudang</option>
                  {filterWarehousesInComplex.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Dari Tanggal</label>
                <input
                  type="date"
                  value={filterStart}
                  onChange={(e) => setFilterStart(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Sampai Tanggal</label>
                <input
                  type="date"
                  value={filterEnd}
                  onChange={(e) => setFilterEnd(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                onClick={() => {
                  setFilterComplexId("")
                  setFilterWarehouseId("")
                  setFilterStart("")
                  setFilterEnd("")
                }}
              >
                Reset Filter
              </button>

              <div
                className="flex items-center gap-2"
                title={canShowChart ? (showChart ? "Sembunyikan grafik" : "Tampilkan grafik") : "Pilih Kompleks dan Gudang dahulu"}
              >
                <span className="text-sm text-gray-600 select-none">Grafik</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showChart}
                  aria-label="Toggle grafik"
                  disabled={!canShowChart}
                  tabIndex={canShowChart ? 0 : -1}
                  onKeyDown={(e) => {
                    if (!canShowChart) return
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setShowChart((v) => !v)
                    }
                  }}
                  onClick={() => canShowChart && setShowChart((v) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition
                    ${canShowChart
                      ? (showChart ? "bg-indigo-600" : "bg-gray-300 hover:bg-gray-400")
                      : "bg-gray-300 opacity-60 cursor-not-allowed" }
                    focus:outline-none focus:ring-2 focus:ring-indigo-300`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition
                      ${showChart ? "translate-x-5" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>
          </div>

          {showChart && canShowChart && (
            <div className="px-4 pb-4">
              <div className="rounded-xl border bg-white shadow-sm">
                <div className="p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm border-b">
                  <div>
                    <span className="text-gray-700 font-medium">Grafik Ruang Penyimpanan</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Kapasitas maksimal: {fmtTon(warehouseCapacity)}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-gray-500">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Real-time
                  </span>
                </div>
                <div className="p-3">
                  <SpaceLineChart points={chartPoints} maxCapacity={warehouseCapacity} />
                </div>
                <div className="px-3 pb-3 flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-indigo-500"></div>
                    <span className="text-gray-600">Ruang Terpakai</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-0.5 w-4 border-t-2 border-dashed border-red-500"></div>
                    <span className="text-gray-600">Kapasitas Maksimal</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border px-3 py-2 text-left font-medium text-gray-600">Tanggal</th>
                  <th className="border px-3 py-2 text-left font-medium text-gray-600">Kompleks</th>
                  <th className="border px-3 py-2 text-left font-medium text-gray-600">Gudang</th>
                  <th className="border px-3 py-2 text-right font-medium text-gray-600">Kapasitas</th>
                  <th className="border px-3 py-2 text-right font-medium text-gray-600">Ruang Terpakai</th>
                  <th className="border px-3 py-2 text-right font-medium text-gray-600">Delta</th>
                </tr>
              </thead>
              <tbody>
                {filteredSpaces.length === 0 ? (
                  <tr>
                    <td className="border px-3 py-8 text-center text-gray-500 text-sm" colSpan={6}>
                      Tidak ada data yang cocok
                    </td>
                  </tr>
                ) : (
                  filteredSpaces.map((s) => {
                    const capacity = s.warehouse?.capacity ?? "-"
                    const complexName = s.warehouse?.complex?.name ?? "-"
                    const delta = deltaById[s.id] ?? 0
                    const deltaClass = delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-gray-600"

                    return (
                      <tr key={s.id} className="hover:bg-gray-50 transition">
                        <td className="border px-3 py-2">{s.date}</td>
                        <td className="border px-3 py-2">{complexName}</td>
                        <td className="border px-3 py-2">{s.warehouse?.name ?? "-"}</td>
                        <td className="border px-3 py-2 text-right">{fmtTon(capacity)}</td>
                        <td className="border px-3 py-2 text-right">{fmtTon(s.free_space)}</td>
                        <td className={`border px-3 py-2 text-right font-medium ${deltaClass}`}>{fmtDelta(delta)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto sm:ml-64">
        <div className="px-4 py-4 sm:px-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-gray-600">
            <p className="text-center sm:text-left">
              Copyright © 2025 Pengadaan Komoditas<br className="sm:hidden" />
              <span className="hidden sm:inline"> • </span>Kantor Cabang Surakarta
            </p>
            <p className="font-medium text-blue-600">MasbeID</p>
          </div>
        </div>
      </footer>
    </div>
  )
}