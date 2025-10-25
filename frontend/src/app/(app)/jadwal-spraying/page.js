"use client"

import { useEffect, useMemo, useState } from "react"
import axios from "axios"

export default function JadwalSprayingPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

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
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState("")

  // Filters (riwayat)
  const [filterComplexId, setFilterComplexId] = useState("")
  const [filterWarehouseId, setFilterWarehouseId] = useState("")
  const [filterStart, setFilterStart] = useState("")
  const [filterEnd, setFilterEnd] = useState("")

  useEffect(() => {
    fetchInitial()
  }, [])

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
        axios.get(`${baseUrl}/api/fumigations`, {
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

  const sprayingRows = useMemo(() => {
    return (records || [])
      .filter((r) => r.type === "spraying")
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0) || (b.id || 0) - (a.id || 0))
  }, [records])

  // Filter helpers
  const filterWarehousesInComplex = useMemo(() => {
    if (!filterComplexId) return []
    const c = complexes.find((x) => String(x.id) === String(filterComplexId))
    return c?.warehouses || []
  }, [filterComplexId, complexes])

  const filteredSprayingRows = useMemo(() => {
    return (sprayingRows || []).filter((r) => {
      if (filterComplexId) {
        const cid = r.warehouse?.complex?.id ?? r.warehouse?.warehouse_complex_id
        if (String(cid) !== String(filterComplexId)) return false
      }
      if (filterWarehouseId) {
        const wid = r.warehouse_id ?? r.warehouse?.id
        if (String(wid) !== String(filterWarehouseId)) return false
      }
      if (filterStart && new Date(r.date) < new Date(filterStart)) return false
      if (filterEnd && new Date(r.date) > new Date(filterEnd)) return false
      return true
    })
  }, [sprayingRows, filterComplexId, filterWarehouseId, filterStart, filterEnd])

  const submit = async (e) => {
    e?.preventDefault()
    if (!warehouseId || !date) {
      setError("Kompleks, Gudang, dan Tanggal wajib diisi.")
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
          type: "spraying",
          date,
          notes: notes || null,
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

      const fresh = await axios.get(`${baseUrl}/api/fumigations`, {
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
      setError("Gagal menyimpan jadwal spraying.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Jadwal Spraying</h1>
        <button
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => setOpen(true)}
        >
          Tambah Jadwal
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => !loading && setOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Tambah Jadwal Spraying</h2>
            {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Kompleks</label>
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
                <div>
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
                </div>
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Catatan</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    rows={3}
                    placeholder="Opsional"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
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
          <h2 className="text-lg font-semibold">Riwayat Spraying</h2>
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

          <button
            type="button"
            className="ml-auto px-3 py-2 border rounded-lg"
            onClick={() => {
              setFilterComplexId("")
              setFilterWarehouseId("")
              setFilterStart("")
              setFilterEnd("")
            }}
          >
            Reset
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-3 py-2 text-left">Tanggal</th>
                <th className="border px-3 py-2 text-left">Kompleks</th>
                <th className="border px-3 py-2 text-left">Gudang</th>
                <th className="border px-3 py-2 text-left">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {filteredSprayingRows.length === 0 ? (
                <tr>
                  <td className="border px-3 py-3 text-center text-gray-500" colSpan={4}>
                    Tidak ada data yang cocok
                  </td>
                </tr>
              ) : (
                filteredSprayingRows.map((r) => (
                  <tr key={r.id}>
                    <td className="border px-3 py-2">{r.date}</td>
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
  )
}