"use client"

import { useState, useEffect } from "react"
import axios from "axios"

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

  useEffect(() => {
    fetchWarehouses()
    fetchComplexes()
  }, [])

  const fetchWarehouses = async () => {
    const res = await axios.get("http://localhost:8000/api/warehouses", {
      withCredentials: true,
    })
    setWarehouses(res.data)
  }

  const fetchComplexes = async () => {
    const res = await axios.get("http://localhost:8000/api/warehouse-complexes", {
      withCredentials: true,
    })
    setComplexes(res.data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.warehouse_complex_id || !form.name || !form.capacity) {
      alert("Semua field harus diisi!")
      return
    }

    if (isNaN(form.capacity)) {
      alert("Kapasitas harus berupa angka!")
      return
    }

    if (editId) {
      await axios.put(
        `http://localhost:8000/api/warehouses/${editId}`,
        form,
        { withCredentials: true }
      )
    } else {
      await axios.post("http://localhost:8000/api/warehouses", form, {
        withCredentials: true,
      })
    }

    setForm({ warehouse_complex_id: "", name: "", capacity: "" })
    setEditId(null)
    setIsModalOpen(false)
    fetchWarehouses()
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
      await axios.delete(`http://localhost:8000/api/warehouses/${id}`, {
        withCredentials: true,
      })
      fetchWarehouses()
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Kelola Gudang</h1>

      {/* Tombol Tambah */}
      <button
        onClick={() => {
          setForm({ warehouse_complex_id: "", name: "", capacity: "" })
          setEditId(null)
          setIsModalOpen(true)
        }}
        className="mb-4 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Tambah Gudang
      </button>

      {/* Tabel Gudang */}
      <table className="w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">Nama Gudang</th>
            <th className="border px-4 py-2">Kompleks</th>
            <th className="border px-4 py-2">Kapasitas</th>
            <th className="border px-4 py-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {warehouses.map((w) => (
            <tr key={w.id}>
              <td className="border px-4 py-2">{w.name}</td>
              <td className="border px-4 py-2">{w.complex?.name || "-"}</td>
              <td className="border px-4 py-2">{w.capacity}</td>
              <td className="border px-4 py-2 space-x-2">
                <button
                  onClick={() => handleEdit(w)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(w.id)}
                  className="bg-red-600 text-white px-2 py-1 rounded"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal Input/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white p-6 rounded shadow-md w-96">
            <h2 className="text-lg font-semibold mb-4">
              {editId ? "Edit Gudang" : "Tambah Gudang"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select
                className="border p-2 w-full"
                value={form.warehouse_complex_id}
                onChange={(e) =>
                  setForm({ ...form, warehouse_complex_id: e.target.value })
                }
                required
              >
                <option value="">Pilih Kompleks</option>
                {complexes.map((complex) => (
                  <option key={complex.id} value={complex.id}>
                    {complex.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Nama Gudang"
                className="border p-2 w-full"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />

              <input
                type="number"
                placeholder="Kapasitas"
                className="border p-2 w-full"
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
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
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
