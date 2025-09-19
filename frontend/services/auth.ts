import API from "../lib/api";

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
  }

  return res.data;
};

// Logout User
export const logout = async () => {
  const res = await API.post("/logout");
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
  return res.data;
};
