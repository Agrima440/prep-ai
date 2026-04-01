import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

api.interceptors.response.use(
  res => res,
  async (error) => {
    if (error.response?.status === 401) {
      await axios.get("http://localhost:5000/api/auth/refresh", {
        withCredentials: true,
      });

      return api(error.config);
    }
    return Promise.reject(error);
  }
);

export default api;