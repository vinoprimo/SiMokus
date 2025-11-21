"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Eye, EyeOff } from "lucide-react"

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
        const payload = { name: form.name, email: form.email }
        // Only send password if changed
        if (form.password && form.password !== "••••••••") {
          payload.password = form.password
        }
        await axios.put(`${baseUrl}/api/admins/${form.id}`, payload, {
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
      alert(isEditing ? "Admin berhasil diupdate!" : "Admin berhasil ditambahkan!")
    } catch (e) {
      console.error("Error:", e)
      alert(e.response?.data?.message || "Gagal menyimpan admin")
    } finally {
      handleCloseModal()
      fetchAdmins()
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus admin ini?")) return
    try {
      await ensureCsrf()
      await axios.delete(`${baseUrl}/api/admins/${id}`, {
        withCredentials: true,
        headers: { Accept: "application/json" },
        xsrfCookieName: "XSRF-TOKEN",
        xsrfHeaderName: "X-XSRF-TOKEN",
      })
      alert("Admin berhasil dihapus!")
      fetchAdmins()
    } catch (e) {
      console.error("Gagal hapus admin:", e)
      alert("Gagal menghapus admin")
    }
  }

  const handleEdit = (admin) => {
    setForm({ 
      id: admin.id, 
      name: admin.name, 
      email: admin.email, 
      password: "••••••••"
    })
    setIsEditing(true)
    setShowModal(true)
    setShowPassword(false)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setShowPassword(false)
    setForm({ id: null, name: "", email: "", password: "" })
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content - Responsive padding */}
      <div className="flex-1 pt-16 px-4 pb-6 sm:pt-6 sm:pl-80 sm:pr-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Kelola Admin</h1>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              placeholder="Cari nama / email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border px-3 py-2 rounded-lg text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                setForm({ id: null, name: "", email: "", password: "" })
                setIsEditing(false)
                setShowPassword(false)
                setShowModal(true)
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition whitespace-nowrap"
            >
              + Tambah Admin
            </button>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-semibold">Daftar Admin</h2>
            <span className="text-xs text-gray-500">
              {filteredAdmins.length}/{admins.length} admin
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border px-3 py-2 text-left font-medium text-gray-600">Nama</th>
                  <th className="border px-3 py-2 text-left font-medium text-gray-600">Email</th>
                  <th className="border px-3 py-2 text-left font-medium text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 transition">
                    <td className="border px-3 py-2">{admin.name}</td>
                    <td className="border px-3 py-2">{admin.email}</td>
                    <td className="border px-3 py-2">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button
                          onClick={() => handleEdit(admin)}
                          className="px-3 py-1.5 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 text-xs font-medium transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(admin.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs font-medium transition"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAdmins.length === 0 && (
                  <tr>
                    <td colSpan="3" className="border px-3 py-8 text-center text-gray-500 text-sm">
                      {search ? "Tidak ada hasil" : "Belum ada admin"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto sm:ml-64">
        <div className="px-4 py-4 sm:px-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-gray-600">
            <p className="text-center sm:text-left">
              Copyright © 2025 Pengadaan Komoditas<br className="sm:hidden" />
              <span className="hidden sm:inline"> • </span>Kantor Cabang Surakarta
            </p>
            <p className="font-medium text-blue-600">MasbeID</p>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4">
                {isEditing ? "Edit Admin" : "Tambah Admin"}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama
                  </label>
                  <input
                    type="text"
                    placeholder="Nama lengkap"
                    className="border p-2.5 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    className="border p-2.5 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {isEditing && "(Opsional)"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder={isEditing ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"}
                      className="border p-2.5 w-full rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      onFocus={(e) => {
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
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isEditing ? "* Kosongkan untuk tidak mengubah" : "* Minimal 6 karakter"}
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    {isEditing ? "Update" : "Tambah"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}