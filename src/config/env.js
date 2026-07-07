export const API_BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL_PROD
  : import.meta.env.VITE_API_URL_DEV;

export const SOCKET_URL = import.meta.env.PROD
  ? import.meta.env.VITE_SOCKET_URL_PROD
  : import.meta.env.VITE_SOCKET_URL_DEV;
