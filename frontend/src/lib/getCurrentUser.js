import api from "./api";

export const getCurrentUser = async (getToken) => {
  const token = await getToken();

  const response = await api.get("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};