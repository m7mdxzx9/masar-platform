import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import type { IApiClient, ApiResponse } from '../../../shared/api-client'
import { Platform } from 'react-native'

let baseURL = 'https://masar-backend-v72t.onrender.com/api/v1'

if (__DEV__) {
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost'
  baseURL = `http://${host}:8000/api/v1`
}

const instance: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

instance.interceptors.request.use(async (config) => {
  const currentBaseURL = baseURL
  config.baseURL = currentBaseURL


  // Intercept the outgoing request URL and strip leading /api or /api/v1 prefix
  if (config.url && config.url.startsWith('/api/')) {
    if (config.url.startsWith('/api/v1/')) {
      config.url = config.url.substring(7) // remove '/api/v1' prefix, keeping the leading slash
    } else {
      config.url = config.url.substring(4) // remove '/api' prefix, keeping the leading slash
    }
  }

  return config
})

const toResponse = async <T>(promise: Promise<{ data: T; status: number }>): Promise<ApiResponse<T>> => {
  const { data, status } = await promise
  return { data, status, ok: status >= 200 && status < 300 }
}

const apiClient: IApiClient = {
  async get(path, params) {
    return toResponse(instance.get(path, { params } as AxiosRequestConfig))
  },
  async post(path, body) {
    return toResponse(instance.post(path, body))
  },
  async put(path, body) {
    return toResponse(instance.put(path, body))
  },
  async delete(path) {
    return toResponse(instance.delete(path))
  },
  async upload(path, formData) {
    return toResponse(instance.post(path, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }))
  },
  setBaseUrl(url) {
    let cleanUrl = url.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    if (!cleanUrl.endsWith('/api/v1')) {
      if (cleanUrl.endsWith('/api')) {
        cleanUrl = cleanUrl + '/v1';
      } else {
        cleanUrl = cleanUrl + '/api/v1';
      }
    }
    baseURL = cleanUrl;
    instance.defaults.baseURL = baseURL;
    console.log(`[API Client] Base URL updated to: ${baseURL}`);
  },
  getBaseUrl() {
    return baseURL;
  },
}

export const getBaseURL = () => baseURL
export const setBaseURL = async (url: string) => apiClient.setBaseUrl(url)

export default apiClient
