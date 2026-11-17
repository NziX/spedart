import _, { AxiosError, AxiosResponse } from 'axios';

const axios = _.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

function baseRequestSuccessResponseInterceptor(response: AxiosResponse) {
  return response;
}

function baseRequestErrorResponseInterceptor(error: AxiosError) {
  const status = error.response?.status;
  const url = error.request.responseURL;

  if (status === 401) {
    console.log('401', url);
  }

  return Promise.reject(error);
}

axios.interceptors.response.use(
  baseRequestSuccessResponseInterceptor,
  baseRequestErrorResponseInterceptor
);

export { axios };
