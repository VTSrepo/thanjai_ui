// Global axios setup: attach the login token; on an expired/missing session send the user to Login.
import axios from "axios";
import { clearSession } from "./UserContext";
import { toast } from "../components/ToastProvider";

const BASE = process.env.REACT_APP_ROUTER_BASENAME || "/v1";
let redirecting = false;

axios.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("authToken");
    if (token) config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  } catch (e) {}
  return config;
});

axios.interceptors.response.use(
  (res) => res,
  (error) => {
    const data = error.response?.data;
    // Only the auth layer sends code AUTH_REQUIRED (older endpoints also use 401 to mean "no data")
    if (error.response?.status === 401 && data?.code === "AUTH_REQUIRED" && !redirecting) {
      redirecting = true;
      clearSession();
      toast.info(data.message || "Please log in again");
      setTimeout(() => window.location.assign(`${BASE.replace(/\/$/, "")}/login`), 600);
    } else if (error.response?.status === 403 && data?.code === "FORBIDDEN") {
      toast.error(data.message || "You do not have access to this");
    }
    return Promise.reject(error);
  }
);
