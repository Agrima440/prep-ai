import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL || "";

const api = axios.create({
  baseURL,
  withCredentials: true,
});
 
api.interceptors.response.use(
  res => res,
  async (error) => {
    if (error.response?.status === 401) {
      await axios.get(
        `${baseURL}/auth/refresh`,
        { withCredentials: true }
      );
      return api(error.config);
    }
    return Promise.reject(error);
  }
);

export default api;
