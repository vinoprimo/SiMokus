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
  const currentEditLayoutUrl = editComplexId
    ? absUrl(complexes.find((c) => c.id === editComplexId)?.layout_image_url)
    : null

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [wareRes, complexRes] = await Promise.all([
      axios.get("http://localhost:8000/api/warehouses", { withCredentials: true }),
      axios.get("http://localhost:8000/api/warehouse-complexes", { withCredentials: true }),
    ])
    setWarehouses(wareRes.data)
    setComplexes(complexRes.data)
  }

  const handleWarehouseSubmit = async (e) => {
    e.preventDefault()
    if (editId) {
      await axios.put(`http://localhost:8000/api/warehouses/${editId}`, form, { withCredentials: true })
    } else {
      await axios.post("http://localhost:8000/api/warehouses", form, { withCredentials: true })
    }
    setForm({ warehouse_complex_id: "", name: "", capacity: "" })
    setEditId(null)
    setIsModalOpen(false)
    fetchData()
  }

  const handleComplexSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append("name", complexForm.name)
    fd.append("location", complexForm.location)
    if (complexForm.layout_image instanceof File) fd.append("layout_image", complexForm.layout_image)
    try {
      if (editComplexId) {
        fd.append("_method", "PUT")
        await axios.post(`http://localhost:8000/api/warehouse-complexes/${editComplexId}`, fd, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        })
      } else {
        await axios.post("http://localhost:8000/api/warehouse-complexes", fd, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        })
      }
    } finally {
      setComplexForm({ name: "", location: "", layout_image: null })
      setEditComplexId(null)
      setIsComplexModalOpen(false)
      fetchData()
    }
  }

  const handleWarehouseDelete = async (id) => {
    if (confirm("Yakin ingin menghapus gudang ini?")) {
      await axios.delete(`http://localhost:8000/api/warehouses/${id}`, { withCredentials: true })
      fetchData()
    }
  }

  const handleComplexDelete = async (id) => {
    if (confirm("Yakin ingin menghapus kompleks gudang ini?")) {
      await axios.delete(`http://localhost:8000/api/warehouse-complexes/${id}`, { withCredentials: true })
      fetchData()
    }
  }

  const filteredComplexes = complexes.filter((complex) =>
    complex.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Kelola Gudang</h1>

      {/* Tombol aksi + search bar */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div className="flex gap-3">
          <button
            onClick={() => {
              setForm({ warehouse_complex_id: "", name: "", capacity: "" })
              setEditId(null)
              setIsModalOpen(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
          >
            + Tambah Gudang
          </button>
          <button
            onClick={() => {
              setComplexForm({ name: "", location: "" })
              setEditComplexId(null)
              setIsComplexModalOpen(true)
            }}
            className="bg-gray-700 text-white px-4 py-2 rounded shadow hover:bg-gray-800"
          >
            + Tambah Kompleks
          </button>
        </div>

        {/* Search di kanan */}
        <div className="flex items-center border rounded-lg px-3 py-1 bg-white">
          <Search className="w-4 h-4 text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Cari kompleks atau gudang..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="outline-none text-sm w-56"
          />
        </div>
      </div>

      {/* Daftar kompleks */}
      {filteredComplexes.length === 0 ? (
        <p className="text-gray-500">Belum ada kompleks gudang.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredComplexes.map((complex) => {
            const complexWarehouses = warehouses.filter(
              (w) => w.warehouse_complex_id === complex.id
            )

            return (
              <div key={complex.id} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                {/* Header kompleks */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-5 h-5 text-gray-700" />
                    <div>
                      <h2 className="font-bold text-gray-800">{complex.name}</h2>
                      <p className="text-sm text-gray-500">{complex.location}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
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
                      className="text-yellow-600 hover:underline text-sm"
                    >
                      Edit
                    </button>
                    {complex.layout_image_url && (
                      <button
                        onClick={() => setPreviewLayout(absUrl(complex.layout_image_url))}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Denah
                      </button>
                    )}
                    <button
                      onClick={() => handleComplexDelete(complex.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                </div>

                {/* Daftar gudang */}
                {complexWarehouses.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Belum ada gudang di kompleks ini.</p>
                ) : (
                  <table className="w-full text-sm border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border px-2 py-1">Nama</th>
                        <th className="border px-2 py-1">Kapasitas</th>
                        <th className="border px-2 py-1">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complexWarehouses.map((w) => (
                        <tr key={w.id}>
                          <td className="border px-2 py-1">{w.name}</td>
                          <td className="border px-2 py-1">{w.capacity}</td>
                          <td className="border px-2 py-1 text-center space-x-1">
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
                              className="text-yellow-600 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleWarehouseDelete(w.id)}
                              className="text-red-600 hover:underline"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Gudang */}
      {isModalOpen && (
        <Modal title={editId ? "Edit Gudang" : "Tambah Gudang"} onClose={() => setIsModalOpen(false)}>
          <form onSubmit={handleWarehouseSubmit} className="space-y-3">
            <select
              className="border p-2 w-full rounded"
              value={form.warehouse_complex_id}
              onChange={(e) => setForm({ ...form, warehouse_complex_id: e.target.value })}
              required
            >
              <option value="">Pilih Kompleks Gudang</option>
              {complexes.map((complex) => (
                <option key={complex.id} value={complex.id}>
                  {complex.name}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Nama Gudang"
              className="border p-2 w-full rounded"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <input
              type="number"
              placeholder="Kapasitas"
              className="border p-2 w-full rounded"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              required
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border rounded"
              >
                Batal
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                Simpan
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Kompleks */}
      {isComplexModalOpen && (
        <Modal
          title={editComplexId ? "Edit Kompleks Gudang" : "Tambah Kompleks Gudang"}
          onClose={() => setIsComplexModalOpen(false)}
        >
          <form onSubmit={handleComplexSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Nama Kompleks"
              className="border p-2 w-full rounded"
              value={complexForm.name}
              onChange={(e) => setComplexForm({ ...complexForm, name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Lokasi"
              className="border p-2 w-full rounded"
              value={complexForm.location}
              onChange={(e) => setComplexForm({ ...complexForm, location: e.target.value })}
              required
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setComplexForm({ ...complexForm, layout_image: e.target.files?.[0] || null })
              }
              className="border p-2 w-full rounded"
            />
            {editComplexId && currentEditLayoutUrl && (
              <div className="text-xs text-gray-500">
                Denah saat ini:
                <img
                  src={currentEditLayoutUrl}
                  alt="Denah"
                  className="mt-1 rounded border max-h-40 object-contain"
                />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsComplexModalOpen(false)}
                className="px-4 py-2 border rounded"
              >
                Batal
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                Simpan
              </button>
            </div>
          </form>
        </Modal>
      )}

      {previewLayout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setPreviewLayout(null)}
        >
          <div
            className="bg-white p-4 rounded-xl shadow-xl max-w-3xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-lg">Denah Kompleks</h2>
              <button
                className="text-sm px-3 py-1 border rounded"
                onClick={() => setPreviewLayout(null)}
              >
                Tutup
              </button>
            </div>
            <img
              src={previewLayout}
              alt="Denah Kompleks"
              className="w-full max-h-[70vh] object-contain rounded border"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Modal({ title, children }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white p-6 rounded-xl shadow-md w-96">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        {children}
      </div>
    </div>
  )
}
