"use client";

import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {user ? (
        <p className="mt-2">Selamat datang, {user.name} ({user.role})!</p>
      ) : (
        <p className="mt-2">Loading user info...</p>
      )}
    </div>
  );
}
