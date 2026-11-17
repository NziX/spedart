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
		// Authorization: `Bearer ${localStorage.getItem("sptAdToken")}`,
	},
});

function baseRequestInterceptor(config: InternalAxiosRequestConfig) {
	if (typeof window !== "undefined") {
		const token = localStorage.getItem("sptAdToken");

		if (config.url?.includes("/")) {
			config.headers["Authorization"] = `Bearer ${token}`;
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
		if (!url?.includes("/")) {
			localStorage.removeItem("sptAdToken");
			window.location.href = "/";
		}
	}
	return Promise.reject(error);
}

axios.interceptors.request.use(baseRequestInterceptor);
axios.interceptors.response.use(
	baseRequestSuccessResponseInterceptor,
	baseRequestErrorResponseInterceptor
);

export default axios;
