const API = "https://auckland-crest-reservations-chair.trycloudflare.com/api";

export const apiRequest = async (url, method = "GET", body) => {
  const res = await fetch(`${API}${url}`, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return res.json();
};