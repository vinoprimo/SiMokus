"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Warehouse, Search } from "lucide-react"

const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"
const absUrl = (u) => (!u ? "" : /^https?:\/\//i.test(u) ? u : `${baseUrl}${u.startsWith("/") ? "" : "/"}${u}`)

export default function KelolaGudangPage() {
  const [warehouses, setWarehouses] = useState([])
  const [complexes, setComplexes] = useState([])
  const [form, setForm] = useState({
    warehouse_complex_id: "",
    name: "",
    capacity: "",
  })
  const [complexForm, setComplexForm] = useState({ name: "", location: "", layout_image: null })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isComplexModalOpen, setIsComplexModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editComplexId, setEditComplexId] = useState(null)
  const [search, setSearch] = useState("")
  const [previewLayout, setPreviewLayout] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const currentEditLayoutUrl = editComplexId
    ? absUrl(complexes.find((c) => c.id === editComplexId)?.layout_image_url)
    : null

  useEffect(() => {
    fetchData()
  }, [])

  const ensureCsrf = async () => {
    await axios.get(`${baseUrl}/sanctum/csrf-cookie`, {
      withCredentials: true,
      headers: { Accept: "application/json" },
    })
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const complexRes = await axios.get(`${baseUrl}/api/warehouse-complexes`, {
        withCredentials: true,
        headers: { Accept: "application/json" },
        xsrfCookieName: "XSRF-TOKEN",
        xsrfHeaderName: "X-XSRF-TOKEN",
      })
      setComplexes(complexRes.data)
      
      const wareRes = await axios.get(`${baseUrl}/api/warehouses`, {
        withCredentials: true,
        headers: { Accept: "application/json" },
        xsrfCookieName: "XSRF-TOKEN",
        xsrfHeaderName: "X-XSRF-TOKEN",
      })
      setWarehouses(wareRes.data)
      
    } catch (e) {
      console.error("❌ Gagal memuat data gudang:", e)
      setWarehouses([])
      setComplexes([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleWarehouseSubmit = async (e) => {
    e.preventDefault()
    try {
      await ensureCsrf()
      if (editId) {
        await axios.put(`${baseUrl}/api/warehouses/${editId}`, form, {
          withCredentials: true,
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          xsrfCookieName: "XSRF-TOKEN",
          xsrfHeaderName: "X-XSRF-TOKEN",
        })
      } else {
        await axios.post(`${baseUrl}/api/warehouses`, form, {
          withCredentials: true,
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          xsrfCookieName: "XSRF-TOKEN",
          xsrfHeaderName: "X-XSRF-TOKEN",
        })
      }
      
      alert(editId ? 'Gudang berhasil diupdate!' : 'Gudang berhasil ditambahkan!')
      
    } catch (error) {
      console.error('Error saving warehouse:', error)
      alert('Gagal menyimpan gudang: ' + (error.response?.data?.message || error.message))
    } finally {
      setForm({ warehouse_complex_id: "", name: "", capacity: "" })
      setEditId(null)
      setIsModalOpen(false)
      await fetchData()
    }
  }

  const handleComplexSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append("name", complexForm.name)
    fd.append("location", complexForm.location)
    if (complexForm.layout_image instanceof File) fd.append("layout_image", complexForm.layout_image)
    
    try {
      await ensureCsrf()
      if (editComplexId) {
        fd.append("_method", "PUT")
        await axios.post(`${baseUrl}/api/warehouse-complexes/${editComplexId}`, fd, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data", Accept: "application/json" },
          xsrfCookieName: "XSRF-TOKEN",
          xsrfHeaderName: "X-XSRF-TOKEN",
        })
      } else {
        await axios.post(`${baseUrl}/api/warehouse-complexes`, fd, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data", Accept: "application/json" },
          xsrfCookieName: "XSRF-TOKEN",
          xsrfHeaderName: "X-XSRF-TOKEN",
        })
      }
      
      alert(editComplexId ? 'Kompleks berhasil diupdate!' : 'Kompleks berhasil ditambahkan!')
      
    } catch (error) {
      console.error('Error saving complex:', error)
      alert('Gagal menyimpan kompleks: ' + (error.response?.data?.message || error.message))
    } finally {
      setComplexForm({ name: "", location: "", layout_image: null })
      setEditComplexId(null)
      setIsComplexModalOpen(false)
      await fetchData()
    }
  }

  const handleWarehouseDelete = async (id) => {
    if (confirm("Yakin ingin menghapus gudang ini?")) {
      try {
        await ensureCsrf()
        await axios.delete(`${baseUrl}/api/warehouses/${id}`, {
          withCredentials: true,
          headers: { Accept: "application/json" },
          xsrfCookieName: "XSRF-TOKEN",
          xsrfHeaderName: "X-XSRF-TOKEN",
        })
        alert('Gudang berhasil dihapus!')
        await fetchData()
      } catch (error) {
        console.error('Error deleting warehouse:', error)
        alert('Gagal menghapus gudang')
      }
    }
  }

  const handleComplexDelete = async (id) => {
    if (confirm("Yakin ingin menghapus kompleks gudang ini?")) {
      try {
        await ensureCsrf()
        await axios.delete(`${baseUrl}/api/warehouse-complexes/${id}`, {
          withCredentials: true,
          headers: { Accept: "application/json" },
          xsrfCookieName: "XSRF-TOKEN",
          xsrfHeaderName: "X-XSRF-TOKEN",
        })
        alert('Kompleks berhasil dihapus!')
        await fetchData()
      } catch (error) {
        console.error('Error deleting complex:', error)
        alert('Gagal menghapus kompleks')
      }
    }
  }

  const filteredComplexes = complexes.filter((complex) =>
    complex.name.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="pt-16 px-4 pb-6 sm:pt-6 sm:pl-80 sm:pr-12">
          <h1 className="text-xl sm:text-2xl font-bold mb-6">Kelola Gudang</h1>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="pt-16 px-4 pb-6 sm:pt-6 sm:pl-80 sm:pr-12">
        {/* Header */}
        <h1 className="text-xl sm:text-2xl font-bold mb-6">Kelola Gudang</h1>

        {/* Action Buttons + Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setForm({ warehouse_complex_id: "", name: "", capacity: "" })
                setEditId(null)
                setIsModalOpen(true)
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition whitespace-nowrap"
            >
              + Tambah Gudang
            </button>
            <button
              onClick={() => {
                setComplexForm({ name: "", location: "", layout_image: null })
                setEditComplexId(null)
                setIsComplexModalOpen(true)
              }}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-800 text-sm font-medium transition whitespace-nowrap"
            >
              + Tambah Kompleks
            </button>
          </div>

          <div className="flex items-center border rounded-lg px-3 py-2 bg-white w-full sm:w-auto">
            <Search className="w-4 h-4 text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Cari kompleks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="outline-none text-sm flex-1 sm:w-56"
            />
          </div>
        </div>

        {/* Complex Grid */}
        {filteredComplexes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-500">
              {search ? "Tidak ada kompleks yang ditemukan" : "Belum ada kompleks gudang"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredComplexes.map((complex) => {
              const complexWarehouses = warehouses.filter(
                (w) => Number(w.warehouse_complex_id) === Number(complex.id)
              )

              return (
                <div key={complex.id} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition">
                  {/* Complex Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-2">
                      <Warehouse className="w-5 h-5 text-gray-700 mt-0.5" />
                      <div>
                        <h2 className="font-bold text-gray-800">{complex.name}</h2>
                        <p className="text-sm text-gray-500">{complex.location}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <button
                        onClick={() => {
                          setComplexForm({
                            name: complex.name,
                            location: complex.location,
                            layout_image: null,
                          })
                          setEditComplexId(complex.id)
                          setIsComplexModalOpen(true)
                        }}
                        className="text-yellow-600 hover:underline font-medium"
                      >
                        Edit
                      </button>
                      {complex.layout_image_url && (
                        <button
                          onClick={() => setPreviewLayout(absUrl(complex.layout_image_url))}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Denah
                        </button>
                      )}
                      <button
                        onClick={() => handleComplexDelete(complex.id)}
                        className="text-red-600 hover:underline font-medium"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>

                  {/* Warehouses Table */}
                  {complexWarehouses.length === 0 ? (
                    <p className="text-sm text-gray-500 italic py-2">
                      Belum ada gudang di kompleks ini
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm border">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="border px-2 py-1.5 text-left font-medium text-gray-600">Nama</th>
                            <th className="border px-2 py-1.5 text-left font-medium text-gray-600">Kapasitas</th>
                            <th className="border px-2 py-1.5 text-center font-medium text-gray-600">Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {complexWarehouses.map((w) => (
                            <tr key={w.id} className="hover:bg-gray-50 transition">
                              <td className="border px-2 py-1.5">{w.name}</td>
                              <td className="border px-2 py-1.5">
                                {Number(w.capacity ?? 0).toLocaleString("id-ID")} ton
                              </td>
                              <td className="border px-2 py-1.5 text-center">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setForm({
                                        warehouse_complex_id: w.warehouse_complex_id,
                                        name: w.name,
                                        capacity: w.capacity,
                                      })
                                      setEditId(w.id)
                                      setIsModalOpen(true)
                                    }}
                                    className="text-yellow-600 hover:underline font-medium"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleWarehouseDelete(w.id)}
                                    className="text-red-600 hover:underline font-medium"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Warehouse Modal */}
        {isModalOpen && (
          <Modal title={editId ? "Edit Gudang" : "Tambah Gudang"}>
            <form onSubmit={handleWarehouseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kompleks Gudang
                </label>
                <select
                  className="border p-2.5 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.warehouse_complex_id}
                  onChange={(e) => setForm({ ...form, warehouse_complex_id: e.target.value })}
                  required
                >
                  <option value="">Pilih Kompleks</option>
                  {complexes.map((complex) => (
                    <option key={complex.id} value={complex.id}>
                      {complex.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Gudang
                </label>
                <input
                  type="text"
                  placeholder="Contoh: GBB 01"
                  className="border p-2.5 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kapasitas (ton)
                </label>
                <input
                  type="number"
                  placeholder="Contoh: 3500"
                  className="border p-2.5 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  required
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setForm({ warehouse_complex_id: "", name: "", capacity: "" })
                    setEditId(null)
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  {editId ? "Update" : "Tambah"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Complex Modal */}
        {isComplexModalOpen && (
          <Modal title={editComplexId ? "Edit Kompleks" : "Tambah Kompleks"}>
            <form onSubmit={handleComplexSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Kompleks
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kompleks Pergudangan Telukan"
                  className="border p-2.5 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  value={complexForm.name}
                  onChange={(e) => setComplexForm({ ...complexForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lokasi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Telukan, Grogol"
                  className="border p-2.5 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
                  value={complexForm.location}
                  onChange={(e) => setComplexForm({ ...complexForm, location: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Denah (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null
                    if (!f) {
                      setComplexForm({ ...complexForm, layout_image: null })
                      return
                    }
                    const MAX_IMG_SIZE = 5 * 1024 * 1024
                    if (!f.type.startsWith("image/")) {
                      alert("File harus berupa gambar")
                      e.target.value = ""
                      return
                    }
                    if (f.size > MAX_IMG_SIZE) {
                      alert("Ukuran gambar maksimal 5MB")
                      e.target.value = ""
                      return
                    }
                    setComplexForm({ ...complexForm, layout_image: f })
                  }}
                  className="border p-2.5 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">* Maksimal 5MB</p>
              </div>

              {editComplexId && currentEditLayoutUrl && (
                <div className="text-xs text-gray-500">
                  <p className="mb-1">Denah saat ini:</p>
                  <img
                    src={currentEditLayoutUrl}
                    alt="Denah"
                    className="mt-1 rounded border max-h-40 object-contain"
                  />
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsComplexModalOpen(false)
                    setComplexForm({ name: "", location: "", layout_image: null })
                    setEditComplexId(null)
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition font-medium"
                >
                  {editComplexId ? "Update" : "Tambah"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Layout Preview Modal */}
        {previewLayout && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={() => setPreviewLayout(null)}
          >
            <div
              className="bg-white p-4 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-semibold text-lg">Denah Kompleks</h2>
                <button
                  className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition"
                  onClick={() => setPreviewLayout(null)}
                >
                  Tutup
                </button>
              </div>
              <img
                src={previewLayout}
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

function Modal({ title, children }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  )
}