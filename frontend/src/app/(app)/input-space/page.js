"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"

export default function SpacesPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

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

  // FILTERS (untuk tabel riwayat)
  const [filterComplexId, setFilterComplexId] = useState("")
  const [filterWarehouseId, setFilterWarehouseId] = useState("")
  const [filterStart, setFilterStart] = useState("")
  const [filterEnd, setFilterEnd] = useState("")
  const [showChart, setShowChart] = useState(false)

  // Formatter angka + satuan ton
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
  }, [])

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
        axios.get(`${baseUrl}/api/spaces`, {
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

  // List gudang untuk form input
  const warehousesInComplex = useMemo(() => {
    if (!complexId) return []
    const c = complexes.find((x) => String(x.id) === String(complexId))
    return c?.warehouses || []
  }, [complexId, complexes])

  // List gudang untuk filter tabel
  const filterWarehousesInComplex = useMemo(() => {
    if (!filterComplexId) return []
    const c = complexes.find((x) => String(x.id) === String(filterComplexId))
    return c?.warehouses || []
  }, [filterComplexId, complexes])

  // Hitung delta per baris berdasarkan riwayat per gudang (pakai semua data, tidak terfilter)
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

  // Data riwayat terfilter untuk tabel
  const filteredSpaces = useMemo(() => {
    return (spaces || []).filter((s) => {
      // by complex
      if (filterComplexId) {
        const cid = s.warehouse?.complex?.id ?? s.warehouse?.warehouse_complex_id
        if (String(cid) !== String(filterComplexId)) return false
      }
      // by warehouse
      if (filterWarehouseId) {
        const wid = s.warehouse_id ?? s.warehouse?.id
        if (String(wid) !== String(filterWarehouseId)) return false
      }
      // by date range
      if (filterStart && new Date(s.date) < new Date(filterStart)) return false
      if (filterEnd && new Date(s.date) > new Date(filterEnd)) return false
      return true
    })
  }, [spaces, filterComplexId, filterWarehouseId, filterStart, filterEnd])

  // Toggle dapat dipakai bila kompleks & gudang sudah dipilih
  const canShowChart = !!(filterComplexId && filterWarehouseId)

  // Data untuk grafik: urutkan berdasarkan tanggal
  const chartPoints = useMemo(() => {
    if (!canShowChart) return []
    const items = [...filteredSpaces]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((s) => ({ date: s.date, value: Number(s.free_space || 0) }))
    return items
  }, [filteredSpaces, canShowChart])

  // Komponen kecil untuk grafik SVG responsif
  const SpaceLineChart = ({ points = [] }) => {
    if (!points.length) return null
    const W = 820, H = 300
    const m = { top: 20, right: 16, bottom: 36, left: 56 }
    const iw = W - m.left - m.right
    const ih = H - m.top - m.bottom
    const values = points.map((p) => p.value)
    const minY = Math.min(0, ...values)
    const maxY = Math.max(10, ...values)
    const spanY = maxY - minY || 1
    const xAt = (i) => m.left + (iw * (points.length === 1 ? 0 : i / (points.length - 1)))
    const yAt = (v) => m.top + (maxY - v) * (ih / spanY)
    const pathD = points
      .map((p, i) => `${i ? "L" : "M"} ${xAt(i)} ${yAt(p.value)}`)
      .join(" ")
    const areaD = `${pathD} L ${xAt(points.length - 1)} ${m.top + ih} L ${xAt(0)} ${m.top + ih} Z`
    const tickCount = 4
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
        {/* Grid horizontal + sumbu Y */}
        {yTicks.map((t, i) => {
          const y = yAt(t)
          return (
            <g key={i}>
              <line x1={m.left} x2={m.left + iw} y1={y} y2={y} stroke="#e5e7eb" />
              <text x={m.left - 8} y={y} textAnchor="end" dominantBaseline="middle" fill="#6b7280" fontSize="11">
                {t.toLocaleString("id-ID")}
              </text>
            </g>
          )
        })}
        {/* Sumbu X */}
        <line x1={m.left} x2={m.left + iw} y1={m.top + ih} y2={m.top + ih} stroke="#e5e7eb" />
        {points.map((p, i) => {
          if (i % xLabelStep !== 0 && i !== points.length - 1) return null
          const x = xAt(i)
          return (
            <text key={i} x={x} y={m.top + ih + 18} textAnchor="middle" fill="#6b7280" fontSize="11">
              {fmtDate(p.date)}
            </text>
          )
        })}
        {/* Area + garis */}
        <path d={areaD} fill="url(#areaFill)" />
        <path d={pathD} fill="none" stroke="#4f46e5" strokeWidth="2.5" />
        {/* Titik */}
        {points.map((p, i) => (
          <circle key={i} cx={xAt(i)} cy={yAt(p.value)} r="3.5" fill="#4f46e5" />
        ))}
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

      // Refresh riwayat
      const fresh = await axios.get(`${baseUrl}/api/spaces`, {
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
    <div className="pl-24 pr-12 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Input Space Gudang</h1>
        <button
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => setOpen(true)}
        >
          Input Space
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !loading && setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Tambah Input Space</h2>
            {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kompleks Pergudangan</label>
                  <select
                    value={complexId}
                    onChange={(e) => {
                      setComplexId(e.target.value)
                      setWarehouseId("")
                    }}
                    className="w-full border rounded-lg px-3 py-2"
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Gudang</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Ruang Penyimpanan Terpakai</label>
                  <input
                    type="number"
                    min={0}
                    value={freeSpace}
                    onChange={(e) => setFreeSpace(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Masukkan nilai ruang penyimpanan terpakai (ton)"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border"
                  onClick={() => !loading && setOpen(false)}
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Riwayat + Filter */}
      <div className="mt-6 bg-white rounded-xl shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Riwayat Perubahan Ruang Penyimpanan</h2>
        </div>

        {/* FILTER BAR */}
        <div className="p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Kompleks</label>
            <select
              value={filterComplexId}
              onChange={(e) => {
                setFilterComplexId(e.target.value)
                setFilterWarehouseId("")
              }}
              className="border rounded-lg px-3 py-2 min-w-[220px]"
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
              className="border rounded-lg px-3 py-2 min-w-[200px]"
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
              className="border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={filterEnd}
              onChange={(e) => setFilterEnd(e.target.value)}
              className="border rounded-lg px-3 py-2"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-2 border rounded-lg"
              onClick={() => {
                setFilterComplexId("")
                setFilterWarehouseId("")
                setFilterStart("")
                setFilterEnd("")
              }}
            >
              Reset
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

        {/* GRAFIK */}
        {showChart && canShowChart && (
          <div className="px-4 pb-4">
            <div className="rounded-xl border bg-white shadow-sm">
              <div className="p-3 flex items-center justify-between text-sm text-gray-500 border-b">
                <span>
                  Grafik ruang penyimpanan (ton)
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  Real-time
                </span>
              </div>
              <div className="p-3">
                <SpaceLineChart points={chartPoints} />
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-3 py-2 text-left">Tanggal</th>
                <th className="border px-3 py-2 text-left">Kompleks</th>
                <th className="border px-3 py-2 text-left">Gudang</th>
                <th className="border px-3 py-2 text-right">Kapasitas</th>
                <th className="border px-3 py-2 text-right">Ruang Penyimpanan Terpakai</th>
                <th className="border px-3 py-2 text-right">Delta</th>
              </tr>
            </thead>
            <tbody>
              {filteredSpaces.length === 0 ? (
                <tr>
                  <td className="border px-3 py-3 text-center text-gray-500" colSpan={6}>
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
                    <tr key={s.id}>
                      <td className="border px-3 py-2">{s.date}</td>
                      <td className="border px-3 py-2">{complexName}</td>
                      <td className="border px-3 py-2">{s.warehouse?.name ?? "-"}</td>
                      <td className="border px-3 py-2 text-right">{fmtTon(capacity)}</td>
                      <td className="border px-3 py-2 text-right">{fmtTon(s.free_space)}</td>
                      <td className={`border px-3 py-2 text-right ${deltaClass}`}>{fmtDelta(delta)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}