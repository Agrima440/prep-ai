import axios from "axios";

const api = axios.create({
 baseURL: process.env.REACT_APP_API_URL,
   withCredentials: true,
});
 
api.interceptors.response.use(
  res => res,
  async (error) => {
    if (error.response?.status === 401) {
        await axios.get(
        `${process.env.REACT_APP_API_URL}/auth/refresh`,
        { withCredentials: true }
      );
      return api(error.config);
    }
    return Promise.reject(error);
  }
);

export default api;