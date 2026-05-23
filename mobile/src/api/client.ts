import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { IApiClient, ApiResponse } from '../../../shared/api-client'

let baseURL = 'http://10.0.2.2:8000'

const instance: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

instance.interceptors.request.use(async (config) => {
  const stored = await AsyncStorage.getItem('masar_api_base_url')
  if (stored) {
    config.baseURL = stored
    baseURL = stored
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
    baseURL = url
    instance.defaults.baseURL = url
    AsyncStorage.setItem('masar_api_base_url', url)
  },
  getBaseUrl() {
    return baseURL
  },
}

export const getBaseURL = () => baseURL
export const setBaseURL = async (url: string) => apiClient.setBaseUrl(url)

export default apiClient
