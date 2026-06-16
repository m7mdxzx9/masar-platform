import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import type { IApiClient, ApiResponse } from '../../../shared/api-client'
import { Platform } from 'react-native'
import { storage } from '../utils/asyncStorage'

let baseURL = storage.getString('masar_base_url') || 'https://masar-backend-v72t.onrender.com/api/v1'

if (!storage.getString('masar_base_url') && __DEV__) {
  const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost'
  baseURL = `http://${host}:8000/api/v1`
}

const instance: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

const decodeJwt = (token: string) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let output = '';
    const str = base64.replace(/=+$/, '');
    if (str.length % 4 === 1) return null;
    
    for (let bc = 0, bc_acc = 0, idx = 0; idx < str.length; idx++) {
      const char = str[idx];
      const pos = chars.indexOf(char);
      if (pos === -1) continue;
      bc_acc = bc % 4 ? bc_acc * 64 + pos : pos;
      if (bc++ % 4) {
        output += String.fromCharCode(255 & (bc_acc >> ((-2 * bc) & 6)));
      }
    }
    return JSON.parse(output);
  } catch (e) {
    return null;
  }
};

async function getAuthToken(): Promise<string | null> {
  let token: string | null = storage.getString('masar_jwt_token') ?? null;
  if (token) {
    const payload = decodeJwt(token);
    if (payload && payload.exp && payload.exp * 1000 < Date.now() + 60000) {
      token = null;
    }
  }

  if (!token) {
    try {
      const res = await axios.post(`${baseURL}/auth/login`, {
        username: 'masar_user',
        password: 'masar_password',
      }, { timeout: 10000 });
      token = res.data.access_token || null;
      if (token) {
        storage.set('masar_jwt_token', token);
      }
    } catch (err: any) {
      console.log('[API Client] Auto-login failed, trying registration fallback...', err.message);
      try {
        await axios.post(`${baseURL}/auth/register`, {
          username: 'masar_user',
          email: 'user@masar.ai',
          password: 'masar_password',
        }, { timeout: 10000 });
        
        const res = await axios.post(`${baseURL}/auth/login`, {
          username: 'masar_user',
          password: 'masar_password',
        }, { timeout: 10000 });
        token = res.data.access_token || null;
        if (token) {
          storage.set('masar_jwt_token', token);
        }
      } catch (regErr: any) {
        console.log('[API Client] Auto-registration fallback failed:', regErr.message);
      }
    }
  }

  return token;
}

instance.interceptors.request.use(async (config) => {
  const currentBaseURL = baseURL
  config.baseURL = currentBaseURL

  // Intercept the outgoing request URL and strip leading /api or /api/v1 prefix
  if (config.url && config.url.startsWith('/api/')) {
    if (config.url.startsWith('/api/v1/')) {
      config.url = config.url.substring(7)
    } else {
      config.url = config.url.substring(4)
    }
  }

  // Attach proper JWT authentication headers to all outgoing requests except login/register
  if (config.url && !config.url.includes('/auth/login') && !config.url.includes('/auth/register')) {
    try {
      const token = await getAuthToken();
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (err) {
      console.error('[API Client] Failed to inject JWT header:', err);
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
    return toResponse(instance.post(path, formData))
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
    storage.set('masar_base_url', baseURL);
    console.log(`[API Client] Base URL updated to: ${baseURL}`);
  },
  getBaseUrl() {
    return baseURL;
  },
}

export const getBaseURL = () => baseURL
export const setBaseURL = async (url: string) => apiClient.setBaseUrl(url)

export default apiClient
