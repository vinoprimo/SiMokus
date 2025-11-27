"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"

export default function JadwalFumigasiPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

  // MODE TOGGLE
  const [mode, setMode] = useState("adm") // "adm" or "activity"

  // Data
  const [complexes, setComplexes] = useState([])
  const [records, setRecords] = useState([])

  // UI
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Form
  const [complexId, setComplexId] = useState("")
  const [warehouseId, setWarehouseId] = useState("")
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState("")

  // Filters (riwayat)
  const [filterComplexId, setFilterComplexId] = useState("")
  const [filterWarehouseId, setFilterWarehouseId] = useState("")
  const [filterStart, setFilterStart] = useState("")
  const [filterEnd, setFilterEnd] = useState("")

  useEffect(() => {
    fetchInitial()
  }, [mode]) // Refetch when mode changes

  const fetchInitial = async () => {
    try {
      setError("")
      const [complexRes, fumiRes] = await Promise.all([
        axios.get(`${baseUrl}/api/warehouse-complexes?with=warehouses`, {
          withCredentials: true,
          headers: { Accept: "application/json" },
          xsrfCookieName: "XSRF-TOKEN",
          xsrfHeaderName: "X-XSRF-TOKEN",
        }),
        axios.get(`${baseUrl}/api/fumigations?mode=${mode}`, {
          withCredentials: true,
          headers: { Accept: "application/json" },
          xsrfCookieName: "XSRF-TOKEN",
          xsrfHeaderName: "X-XSRF-TOKEN",
        }),
      ])
      setComplexes(Array.isArray(complexRes.data) ? complexRes.data : [])
      setRecords(Array.isArray(fumiRes.data) ? fumiRes.data : [])
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
    const c = complexes.find((x) => String(x.id) === String(complexId))
    return c?.warehouses || []
  }, [complexId, complexes])

  const fumigasiRows = useMemo(() => {
    return (records || [])
      .filter((r) => r.type === "fumigasi")
      .sort(
        (a, b) =>
          new Date(b.end_date || b.start_date || 0) - new Date(a.end_date || a.start_date || 0) ||
          (b.id || 0) - (a.id || 0)
      )
  }, [records])

  const filterWarehousesInComplex = useMemo(() => {
    if (!filterComplexId) return []
    const c = complexes.find((x) => String(x.id) === String(filterComplexId))
    return c?.warehouses || []
  }, [filterComplexId, complexes])

  const filteredFumigasiRows = useMemo(() => {
    return (fumigasiRows || []).filter((r) => {
      if (filterComplexId) {
        const cid = r.warehouse?.complex?.id ?? r.warehouse?.warehouse_complex_id
        if (String(cid) !== String(filterComplexId)) return false
      }
      if (filterWarehouseId) {
        const wid = r.warehouse_id ?? r.warehouse?.id
        if (String(wid) !== String(filterWarehouseId)) return false
      }
      const s = new Date(r.start_date || r.end_date || 0)
      const e = new Date(r.end_date || r.start_date || 0)
      if (filterStart && e < new Date(filterStart)) return false
      if (filterEnd && s > new Date(filterEnd)) return false
      return true
    })
  }, [fumigasiRows, filterComplexId, filterWarehouseId, filterStart, filterEnd])

  const [showCalendar, setShowCalendar] = useState(false)
  const canShowCalendar = !!(filterComplexId && filterWarehouseId)

  const toYmd = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    const da = String(d.getDate()).padStart(2, "0")
    return `${y}-${m}-${da}`
  }
  const parseYmd = (s) => {
    if (!s) return null
    const [y, m, d] = s.split("-").map(Number)
    return new Date(y, (m || 1) - 1, d || 1)
  }
  const addDays = (d, n = 1) => {
    const nd = new Date(d)
    nd.setDate(nd.getDate() + n)
    return nd
  }

  const calendarDaysFumi = useMemo(() => {
    if (!canShowCalendar) return []
    const rows = filteredFumigasiRows
    if (!rows.length) return []

    const active = new Set()
    rows.forEach((r) => {
      const s = parseYmd(r.start_date)
      const e = parseYmd(r.end_date)
      for (let d = new Date(s); d <= e; d = addDays(d, 1)) {
        active.add(toYmd(d))
      }
    })

    const allDates = [...active].map((k) => parseYmd(k))
    const minD = filterStart ? parseYmd(filterStart) : new Date(Math.min(...allDates.map((d) => d.getTime())))
    const maxD = filterEnd ? parseYmd(filterEnd) : new Date(Math.max(...allDates.map((d) => d.getTime())))

    const days = []
    for (let d = new Date(minD); d <= maxD; d = addDays(d, 1)) {
      const key = toYmd(d)
      days.push({ date: new Date(d), key, count: active.has(key) ? 1 : 0 })
    }
    return days
  }, [filteredFumigasiRows, filterStart, filterEnd, canShowCalendar])

  const CalendarHeatmap = ({ days }) => {
    if (!days.length) return <p className="px-4 pb-4 text-sm text-gray-500">Tidak ada data pada rentang ini.</p>

    const monthNames = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"]
    const activeSet = new Set(days.filter(d => d.count > 0).map(d => d.key))

    const first = days[0].date
    const last = days[days.length - 1].date
    const startMonth = new Date(first.getFullYear(), first.getMonth(), 1)
    const endMonth = new Date(last.getFullYear(), last.getMonth(), 1)

    const months = []
    for (let cur = new Date(startMonth); cur <= endMonth; cur.setMonth(cur.getMonth() + 1)) {
      months.push({ year: cur.getFullYear(), month: cur.getMonth() })
    }
    const byYear = months.reduce((acc, m) => {
      (acc[m.year] ||= []).push(m)
      return acc
    }, {})

    return (
      <div className="px-4 pb-4 space-y-6">
        {Object.keys(byYear).sort((a,b) => Number(a) - Number(b)).map((year) => (
          <div key={year}>
            <div className="flex items-center gap-3 py-2">
              <h3 className="text-sm font-semibold text-gray-700">{year}</h3>
              <div className="h-px bg-gray-200 flex-1" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {byYear[year].map(({ year: y, month: m }) => {
                const mStart = new Date(y, m, 1)
                const mEnd = new Date(y, m + 1, 0)
                const offset = mStart.getDay()
                const total = mEnd.getDate()

                return (
                  <div key={`${y}-${m}`} className="w-full rounded-lg border bg-white p-2">
                    <div className="text-xs font-medium text-gray-700 mb-1">
                      {monthNames[m]} {y}
                    </div>
                    <div className="grid grid-cols-7 gap-[4px]">
                      {["Min","Sen","Sel","Rab","Kam","Jum","Sab"].map((h) => (
                        <div key={h} className="text-[9px] leading-4 text-gray-500 text-center">{h}</div>
                      ))}
                      {Array.from({ length: offset }).map((_, i) => (
                        <div key={`pad-${i}`} className="aspect-square" />
                      ))}
                      {Array.from({ length: total }).map((_, idx) => {
                        const day = idx + 1
                        const dt = new Date(y, m, day)
                        const key = toYmd(dt)
                        const active = activeSet.has(key)
                        return (
                          <div
                            key={key}
                            title={`${key}${active ? " • Ada jadwal" : ""}`}
                            className={`aspect-square rounded-md flex items-center justify-center text-[11px] transition
                              ${active ? "bg-green-500 text-white shadow-sm hover:bg-green-600" : "bg-gray-50 text-gray-700 hover:bg-gray-100"}`}
                          >
                            {day}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const submit = async (e) => {
    e?.preventDefault()
    if (!warehouseId || !startDate || !endDate) {
      setError("Kompleks, Gudang, Tanggal mulai, dan Tanggal selesai wajib diisi.")
      return
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError("Tanggal selesai harus >= tanggal mulai.")
      return
    }

    // CLIENT-SIDE OVERLAP CHECK (for better UX)
    const hasOverlap = records.some((r) => {
      if (r.type !== 'fumigasi' || r.mode !== mode) return false
      if (String(r.warehouse_id) !== String(warehouseId)) return false
      
      const existingStart = new Date(r.start_date)
      const existingEnd = new Date(r.end_date)
      const newStart = new Date(startDate)
      const newEnd = new Date(endDate)

      // Check if date ranges overlap
      return (
        (newStart >= existingStart && newStart <= existingEnd) || // New start within existing
        (newEnd >= existingStart && newEnd <= existingEnd) ||     // New end within existing
        (newStart <= existingStart && newEnd >= existingEnd)      // New range contains existing
      )
    })

    if (hasOverlap) {
      setError("⚠️ Gudang ini sudah memiliki jadwal fumigasi pada rentang tanggal tersebut!")
      return
    }

    setLoading(true)
    setError("")
    try {
      await ensureCsrf()
      await axios.post(
        `${baseUrl}/api/fumigations`,
        {
          warehouse_id: Number(warehouseId),
          type: "fumigasi",
          start_date: startDate,
          end_date: endDate,
          notes: notes || null,
          mode,
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

      const fresh = await axios.get(`${baseUrl}/api/fumigations?mode=${mode}`, {
        withCredentials: true,
        headers: { Accept: "application/json" },
        xsrfCookieName: "XSRF-TOKEN",
        xsrfHeaderName: "X-XSRF-TOKEN",
      })
      setRecords(Array.isArray(fresh.data) ? fresh.data : [])
      setOpen(false)
      setNotes("")
    } catch (e2) {
      console.error("Gagal simpan jadwal:", e2)
      // Show backend validation error if exists
      if (e2.response?.data?.errors?.start_date) {
        setError(e2.response.data.errors.start_date[0])
      } else {
        setError("Gagal menyimpan jadwal fumigasi.")
      }
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
            <h1 className="text-xl sm:text-2xl font-bold">Jadwal Fumigasi</h1>
            <button
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm font-medium transition whitespace-nowrap"
              onClick={() => setOpen(true)}
            >
              + Tambah Jadwal
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

        {/* Modal Tambah Jadwal */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => !loading && setOpen(false)} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4">
                  Tambah Jadwal Fumigasi ({mode === "adm" ? "ADM" : "Activity"})
                </h2>
                {error && <div className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}
                
                <form onSubmit={submit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kompleks</label>
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

                    <div>
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
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mulai</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Selesai</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                        placeholder="Opsional"
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
              Riwayat Fumigasi ({mode === "adm" ? "ADM" : "Activity"})
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
                title={canShowCalendar ? (showCalendar ? "Sembunyikan kalender" : "Tampilkan kalender") : "Pilih Kompleks dan Gudang dahulu"}
              >
                <span className="text-sm text-gray-600 select-none">Kalender</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showCalendar}
                  disabled={!canShowCalendar}
                  onClick={() => canShowCalendar && setShowCalendar(v=>!v)}
                  onKeyDown={(e)=>{
                    if (!canShowCalendar) return
                    if (e.key===" "||e.key==="Enter"){e.preventDefault();setShowCalendar(v=>!v)}
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition
                    ${canShowCalendar ? (showCalendar ? "bg-indigo-600" : "bg-gray-300 hover:bg-gray-400") : "bg-gray-300 opacity-60 cursor-not-allowed"}
                    focus:outline-none focus:ring-2 focus:ring-indigo-300`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition
                      ${showCalendar ? "translate-x-5" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>
          </div>

          {showCalendar && canShowCalendar && (
            <div className="border-t">
              <CalendarHeatmap days={calendarDaysFumi} />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border px-3 py-2 text-left font-medium text-gray-600">Tanggal</th>
                  <th className="border px-3 py-2 text-left font-medium text-gray-600">Kompleks</th>
                  <th className="border px-3 py-2 text-left font-medium text-gray-600">Gudang</th>
                  <th className="border px-3 py-2 text-left font-medium text-gray-600">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {filteredFumigasiRows.length === 0 ? (
                  <tr>
                    <td className="border px-3 py-8 text-center text-gray-500 text-sm" colSpan={4}>
                      Tidak ada data yang cocok
                    </td>
                  </tr>
                ) : (
                  filteredFumigasiRows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition">
                      <td className="border px-3 py-2">
                        {r.start_date} - {r.end_date}
                      </td>
                      <td className="border px-3 py-2">{r.warehouse?.complex?.name ?? "-"}</td>
                      <td className="border px-3 py-2">{r.warehouse?.name ?? "-"}</td>
                      <td className="border px-3 py-2">{r.notes ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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