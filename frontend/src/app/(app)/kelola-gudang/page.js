"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import {
  Building2,
  Package,
  Warehouse,
  Boxes,
  Factory,
  Home,
} from "lucide-react"

export default function KelolaGudangPage() {
  const [warehouses, setWarehouses] = useState([])
  const [complexes, setComplexes] = useState([])
  const [form, setForm] = useState({
    warehouse_complex_id: "",
    name: "",
    capacity: "",
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)

  // Warna + ikon untuk variasi visual
  const accentColors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-yellow-100 text-yellow-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
    "bg-orange-100 text-orange-700",
  ]

  const icons = [Building2, Warehouse, Boxes, Factory, Package, Home]

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.warehouse_complex_id || !form.name || !form.capacity) {
      alert("Semua field wajib diisi!")
      return
    }

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

  const handleEdit = (warehouse) => {
    setForm({
      warehouse_complex_id: warehouse.warehouse_complex_id,
      name: warehouse.name,
      capacity: warehouse.capacity,
    })
    setEditId(warehouse.id)
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm("Yakin ingin menghapus gudang ini?")) {
      await axios.delete(`http://localhost:8000/api/warehouses/${id}`, { withCredentials: true })
      fetchData()
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Kelola Gudang</h1>

      {/* Tombol tambah gudang */}
      <button
        onClick={() => {
          setForm({ warehouse_complex_id: "", name: "", capacity: "" })
          setEditId(null)
          setIsModalOpen(true)
        }}
        className="mb-6 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
      >
        + Tambah Gudang
      </button>

      {/* Tampilan kompleks */}
      {complexes.length === 0 ? (
        <p className="text-gray-600">Belum ada data kompleks gudang.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {complexes.map((complex, index) => {
            const color = accentColors[index % accentColors.length]
            const Icon = icons[index % icons.length]
            const complexWarehouses = warehouses.filter(
              (w) => w.warehouse_complex_id === complex.id
            )

            return (
              <div
                key={complex.id}
                className={`border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all bg-white`}
              >
                {/* Header kompleks */}
                <div className={`flex items-center gap-3 mb-4 p-2 rounded-lg ${color}`}>
                  <Icon className="w-5 h-5" />
                  <h2 className="text-lg font-bold">{complex.name}</h2>
                </div>

                {/* Isi daftar gudang */}
                {complexWarehouses.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">
                    Belum ada gudang di kompleks ini.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {complexWarehouses.map((w) => (
                      <li
                        key={w.id}
                        className="flex justify-between items-center border p-2 rounded hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{w.name}</p>
                          <p className="text-sm text-gray-500">
                            Kapasitas: {w.capacity}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(w)}
                            className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(w.id)}
                            className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 text-sm"
                          >
                            Hapus
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal tambah/edit */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-xl shadow-md w-96">
            <h2 className="text-lg font-semibold mb-4">
              {editId ? "Edit Gudang" : "Tambah Gudang"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select
                className="border p-2 w-full rounded"
                value={form.warehouse_complex_id}
                onChange={(e) =>
                  setForm({ ...form, warehouse_complex_id: e.target.value })
                }
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

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
