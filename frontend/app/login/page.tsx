"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, logout } from "../../services/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login({ email, password });
      alert("Login sukses sebagai " + res.user.name);
      router.push("/dashboard"); // redirect ke dashboard
    } catch (err: any) {
      alert("Login gagal: " + (err.response?.data?.message || err.message));
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      alert("Logout sukses");
      router.push("/login");
    } catch (err: any) {
      alert("Logout gagal: " + err.message);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Login</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Login
        </button>
      </form>

      <button
        onClick={handleLogout}
        className="bg-red-500 text-white p-2 rounded mt-4"
      >
        Logout
      </button>
    </div>
  );
}
