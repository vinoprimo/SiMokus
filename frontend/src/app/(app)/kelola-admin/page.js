"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Eye, EyeOff } from "lucide-react" // Install: npm install lucide-react

export default function KelolaAdminPage() {
  const [admins, setAdmins] = useState([])
  const [form, setForm] = useState({ id: null, name: "", email: "", password: "" })
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [search, setSearch] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

  const ensureCsrf = async () => {
    await axios.get(`${baseUrl}/sanctum/csrf-cookie`, {
      withCredentials: true,
      headers: { Accept: "application/json" },
    })
  }

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/admins`, {
        withCredentials: true,
        headers: { Accept: "application/json" },
        xsrfCookieName: "XSRF-TOKEN",
        xsrfHeaderName: "X-XSRF-TOKEN",
      })
      setAdmins(res.data)
    } catch (e) {
      console.error("Gagal memuat admin:", e)
      setAdmins([])
    }
  }

  const filteredAdmins = admins.filter((a) => {
    const q = search.toLowerCase()
    return (
      a.name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q)
    )
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await ensureCsrf()
      if (isEditing) {
        await axios.put(`${baseUrl}/api/admins/${form.id}`, form, {
          withCredentials: true,
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          xsrfCookieName: "XSRF-TOKEN",
          xsrfHeaderName: "X-XSRF-TOKEN",
        })
      } else {
        await axios.post(`${baseUrl}/api/admins`, form, {
          withCredentials: true,
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          xsrfCookieName: "XSRF-TOKEN",
          xsrfHeaderName: "X-XSRF-TOKEN",
        })
      }
    } finally {
      setForm({ id: null, name: "", email: "", password: "" })
      setIsEditing(false)
      setShowModal(false)
      setShowPassword(false)
      fetchAdmins()
    }
  }

  const handleDelete = async (id) => {
    try {
      await ensureCsrf()
      await axios.delete(`${baseUrl}/api/admins/${id}`, {
        withCredentials: true,
        headers: { Accept: "application/json" },
        xsrfCookieName: "XSRF-TOKEN",
        xsrfHeaderName: "X-XSRF-TOKEN",
      })
      fetchAdmins()
    } catch (e) {
      console.error("Gagal hapus admin:", e)
    }
  }

  const handleEdit = (admin) => {
    // Set password dummy untuk ditampilkan (akan diganti jika user input baru)
    setForm({ 
      id: admin.id, 
      name: admin.name, 
      email: admin.email, 
      password: "••••••••" // Password placeholder
    })
    setIsEditing(true)
    setShowModal(true)
    setShowPassword(false)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setShowPassword(false)
    setForm({ id: null, name: "", email: "", password: "" })
  }

  return (
    <div className="pl-24 pr-12 py-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
        <h1 className="text-xl font-bold">Kelola Admin</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Cari nama / email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded text-sm w-56"
          />
          <button
            onClick={() => {
              setForm({ id: null, name: "", email: "", password: "" })
              setIsEditing(false)
              setShowPassword(false)
              setShowModal(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
          >
            + Tambah Admin
          </button>
        </div>
      </div>

      {/* Card daftar admin */}
      <div className="mt-4 bg-white rounded-xl shadow-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Daftar Admin</h2>
          <span className="text-xs text-gray-500">
            {filteredAdmins.length}/{admins.length} ditemukan
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border px-3 py-2 text-left">Nama</th>
                <th className="border px-3 py-2 text-left">Email</th>
                <th className="border px-3 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className="align-top">
                  <td className="border px-3 py-2">{admin.name}</td>
                  <td className="border px-3 py-2">{admin.email}</td>
                  <td className="border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(admin)}
                        className="px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(admin.id)}
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAdmins.length === 0 && (
                <tr>
                  <td colSpan="3" className="border px-3 py-4 text-center text-gray-500">
                    {search ? "Tidak ada hasil pencarian" : "Belum ada admin"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-md w-96 relative">
            <h2 className="text-lg font-bold mb-4">
              {isEditing ? "Edit Admin" : "Tambah Admin"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Nama"
                className="border p-2 w-full rounded"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                className="border p-2 w-full rounded"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isEditing ? "Password (Kosongkan jika tidak ingin mengubah)" : "Password"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={isEditing ? "••••••••" : "Password"}
                    className="border p-2 w-full rounded pr-10"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    onFocus={(e) => {
                      // Clear placeholder password saat focus
                      if (isEditing && e.target.value === "••••••••") {
                        setForm({ ...form, password: "" })
                      }
                    }}
                    minLength={6}
                    required={!isEditing}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isEditing 
                    ? "* Kosongkan jika tidak ingin mengubah password" 
                    : "* Minimal 6 karakter"}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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