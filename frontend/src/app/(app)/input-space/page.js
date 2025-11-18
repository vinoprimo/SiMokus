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
                  <label className="block text-sm font-medium mb-1">Ruang Penyimpanan Tersisa</label>
                  <input
                    type="number"
                    min={0}
                    value={freeSpace}
                    onChange={(e) => setFreeSpace(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Masukkan nilai ruang penyimpanan tersisa (ton)"
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
                <th className="border px-3 py-2 text-right">Kapasitas</th>
                <th className="border px-3 py-2 text-right">Ruang Penyimpanan Tersisa</th>
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