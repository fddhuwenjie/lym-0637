import type { ApiResponse } from '../../shared/types'

const BASE_URL = '/api'

interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined>
  body?: unknown
}

function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

export async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, headers, body, ...rest } = options

  const url = `${BASE_URL}${endpoint}${params ? buildQueryString(params) : ''}`

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  try {
    const response = await fetch(url, {
      ...rest,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    })

    const data = await response.json() as ApiResponse<T>
    return data
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    }
  }
}

export const apiClient = {
  get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>) {
    return request<T>(endpoint, { method: 'GET', params })
  },
  post<T>(endpoint: string, body?: unknown) {
    return request<T>(endpoint, { method: 'POST', body })
  },
  put<T>(endpoint: string, body?: unknown) {
    return request<T>(endpoint, { method: 'PUT', body })
  },
  delete<T>(endpoint: string) {
    return request<T>(endpoint, { method: 'DELETE' })
  },
}
