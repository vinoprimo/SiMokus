import API from "../lib/api";
import Cookies from "js-cookie";

// Register User
export const register = async (data: { name: string; email: string; password: string }) => {
  const res = await API.post("/register", data);
  return res.data;
};

// Login User
export const login = async (data: { email: string; password: string }) => {
  const res = await API.post("/login", data);
  const { token, user } = res.data;

  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    Cookies.set("token", token, { expires: 1 }); // simpan token di cookie (1 hari)
  }

  return res.data;
};

// Logout User
export const logout = async () => {
  const res = await API.post("/logout");
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    Cookies.remove("token");
  }
  return res.data;
};
