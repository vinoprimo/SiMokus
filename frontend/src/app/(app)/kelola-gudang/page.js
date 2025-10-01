// src/app/(app)/kelola-gudang/page.jsx
"use client"

import { useState, useEffect } from "react"
import axios from "axios"

export default function KelolaGudangPage() {
  const [warehouses, setWarehouses] = useState([])
  const [form, setForm] = useState({ name: "", location: "" })

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const fetchWarehouses = async () => {
    const res = await axios.get("http://localhost:8000/api/warehouses", { withCredentials: true })
    setWarehouses(res.data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await axios.post("http://localhost:8000/api/warehouses", form, { withCredentials: true })
    setForm({ name: "", location: "" })
    fetchWarehouses()
  }

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:8000/api/warehouses/${id}`, { withCredentials: true })
    fetchWarehouses()
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Kelola Gudang</h1>

      {/* Form tambah gudang */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="Nama Gudang"
          className="border p-2 w-full"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Lokasi Gudang"
          className="border p-2 w-full"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Tambah Gudang</button>
      </form>

      {/* List gudang */}
      <ul className="space-y-2">
        {warehouses.map((w) => (
          <li key={w.id} className="flex justify-between items-center border p-2 rounded">
            <span>{w.name} - {w.location}</span>
            <button
              onClick={() => handleDelete(w.id)}
              className="text-red-600 hover:underline"
            >
              Hapus
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
