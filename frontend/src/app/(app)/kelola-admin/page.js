// src/app/(app)/kelola-admin/page.jsx
"use client"

import { useState, useEffect } from "react"
import axios from "axios"

export default function KelolaAdminPage() {
  const [admins, setAdmins] = useState([])
  const [form, setForm] = useState({ name: "", email: "", password: "" })

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    const res = await axios.get("http://localhost:8000/api/admins", { withCredentials: true })
    setAdmins(res.data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await axios.post("http://localhost:8000/api/admins", form, { withCredentials: true })
    setForm({ name: "", email: "", password: "" })
    fetchAdmins()
  }

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:8000/api/admins/${id}`, { withCredentials: true })
    fetchAdmins()
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Kelola Admin</h1>

      {/* Form tambah admin */}
      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="Name"
          className="border p-2 w-full"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Tambah Admin</button>
      </form>

      {/* List admin */}
      <ul className="space-y-2">
        {admins.map((admin) => (
          <li key={admin.id} className="flex justify-between items-center border p-2 rounded">
            <span>{admin.name} - {admin.email}</span>
            <button
              onClick={() => handleDelete(admin.id)}
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
