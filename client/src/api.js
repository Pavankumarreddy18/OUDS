const API = (import.meta.env.VITE_API_URL || "http://10.82.27.193:5000") + "/api";

export const apiRequest = async (url, method = "GET", body) => {
  const res = await fetch(`${API}${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Bypass-Tunnel-Reminder": "true"
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return res.json();
};