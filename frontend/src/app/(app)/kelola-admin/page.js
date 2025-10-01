// src/app/(app)/kelola-admin/page.jsx
"use client"

import { useState, useEffect } from "react"
import axios from "axios"

export default function KelolaAdminPage() {
  const [admins, setAdmins] = useState([])
  const [form, setForm] = useState({ id: null, name: "", email: "", password: "" })
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    const res = await axios.get("http://localhost:8000/api/admins", { withCredentials: true })
    setAdmins(res.data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isEditing) {
      await axios.put(`http://localhost:8000/api/admins/${form.id}`, form, { withCredentials: true })
    } else {
      await axios.post("http://localhost:8000/api/admins", form, { withCredentials: true })
    }

    setForm({ id: null, name: "", email: "", password: "" })
    setIsEditing(false)
    setShowModal(false)
    fetchAdmins()
  }

  const handleDelete = async (id) => {
    await axios.delete(`http://localhost:8000/api/admins/${id}`, { withCredentials: true })
    fetchAdmins()
  }

  const handleEdit = (admin) => {
    setForm({ id: admin.id, name: admin.name, email: admin.email, password: "" })
    setIsEditing(true)
    setShowModal(true)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Kelola Admin</h1>
        <button
          onClick={() => {
            setForm({ id: null, name: "", email: "", password: "" })
            setIsEditing(false)
            setShowModal(true)
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          + Tambah Admin
        </button>
      </div>

      {/* Tabel admin */}
      <table className="w-full border border-gray-200 rounded shadow-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Nama</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.id} className="text-center">
              <td className="p-2 border">{admin.name}</td>
              <td className="p-2 border">{admin.email}</td>
              <td className="p-2 border space-x-2">
                <button
                  onClick={() => handleEdit(admin)}
                  className="px-3 py-1 bg-yellow-500 text-white rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(admin.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
          {admins.length === 0 && (
            <tr>
              <td colSpan="3" className="p-4 text-gray-500">
                Belum ada admin
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-96 relative">
            <h2 className="text-lg font-bold mb-4">
              {isEditing ? "Edit Admin" : "Tambah Admin"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Nama"
                className="border p-2 w-full"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="border p-2 w-full"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  className="border p-2 w-full"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  minLength={6}
                  required={!isEditing} // edit bisa kosong
                />
                <p className="text-xs text-gray-500 mt-1">
                  * Minimal 6 karakter
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  {isEditing ? "Simpan" : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
