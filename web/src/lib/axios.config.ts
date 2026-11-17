import _, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

const axios = _.create({
  baseURL:
    process.env.NODE_ENV === "development"
      ? "http://localhost:8000"
      : "https://api.spedart.com",
  headers: {
    "Content-Type": "application/json",
  },
});

function baseRequestInterceptor(config: InternalAxiosRequestConfig) {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("sptToken");

    if (!config.url?.includes("/login")) {
      config.headers["Authorization"] = token ? `Bearer ${token}` : undefined;
    }
  }
  return config;
}

function baseRequestSuccessResponseInterceptor(response: AxiosResponse) {
  return response;
}

function baseRequestErrorResponseInterceptor(error: AxiosError) {
  const status = error.response?.status;
  const url = error.request.responseURL;

  if (status === 401) {
    if (
      !url?.includes("/login") &&
      !url?.includes("/signup") &&
      !url?.includes("/stream-art")
    ) {
      localStorage.removeItem("sptToken");
      window.location.href = "/login";
    }
  }
  return Promise.reject(error);
}

axios.interceptors.request.use(baseRequestInterceptor);
axios.interceptors.response.use(
  baseRequestSuccessResponseInterceptor,
  baseRequestErrorResponseInterceptor,
);

export default axios;
