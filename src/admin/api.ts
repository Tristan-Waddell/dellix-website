import type { Company, Contact, DashboardData, Deal, DealStage, FinancialPeriod, FinancialsData, Lead, LeadPriority, LeadStatus, LeadSummary, Task } from '../../shared/types.ts'

class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })

  if (res.status === 204) return undefined as T

  let data: unknown
  try {
    data = await res.json()
  } catch {
    throw new ApiError(res.status, `Expected a JSON response from ${path} but got something else.`)
  }
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error ?? 'Request failed.')
  return data as T
}

export { ApiError }

export const auth = {
  me: () => request<{ authenticated: true }>('/auth/me'),
  login: (password: string) => request<{ success: true }>('/auth/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request<{ success: true }>('/auth/logout', { method: 'POST' }),
}

export const contacts = {
  list: (q?: string, activeOnly = false) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (activeOnly) params.set('active', 'true')
    const query = params.toString()
    return request<{ contacts: Contact[] }>(`/v1/contacts${query ? `?${query}` : ''}`)
  },
  get: (id: string) => request<{ contact: Contact }>(`/v1/contacts/${id}`),
  create: (data: Partial<Contact>) => request<{ contact: Contact }>('/v1/contacts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Contact>) => request<{ contact: Contact }>(`/v1/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/v1/contacts/${id}`, { method: 'DELETE' }),
}

export const leads = {
  list: (filters: { q?: string; status?: LeadStatus; priority?: LeadPriority; source?: string; tag?: string; viewed?: boolean; limit?: number; offset?: number; sort?: 'created' | 'updated' | 'score' } = {}) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== '') params.set(key, String(value))
    }
    const query = params.toString()
    return request<{ leads: Lead[]; summary: LeadSummary; pagination: { total: number; limit: number; offset: number } }>(`/v1/leads${query ? `?${query}` : ''}`)
  },
  get: (id: string) => request<{ lead: Lead }>(`/v1/leads/${id}`),
  create: (data: Partial<Lead> & { name: string }) => request<{ lead: Lead; action: 'created' | 'updated' }>('/v1/leads', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Lead> & { append_notes?: boolean; mark_enriched?: boolean; mark_viewed?: boolean }) =>
    request<{ lead: Lead }>(`/v1/leads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/v1/leads/${id}`, { method: 'DELETE' }),
  convert: (id: string, options: { create_company?: boolean; is_active_client?: boolean; create_deal?: boolean; deal_name?: string; deal_value_cents?: number; deal_stage?: DealStage } = {}) =>
    request<{ lead: Lead; contact: Contact; company: Company | null; deal: Deal | null }>(`/v1/leads/${id}/convert`, { method: 'POST', body: JSON.stringify(options) }),
}

export const companies = {
  list: (q?: string) => request<{ companies: Company[] }>(`/v1/companies${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  get: (id: string) => request<{ company: Company }>(`/v1/companies/${id}`),
  create: (data: Partial<Company>) => request<{ company: Company }>('/v1/companies', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Company>) => request<{ company: Company }>(`/v1/companies/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/v1/companies/${id}`, { method: 'DELETE' }),
}

export const deals = {
  list: (stage?: DealStage) => request<{ deals: Deal[] }>(`/v1/deals${stage ? `?stage=${stage}` : ''}`),
  get: (id: string) => request<{ deal: Deal }>(`/v1/deals/${id}`),
  create: (data: Partial<Deal>) => request<{ deal: Deal }>('/v1/deals', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Deal>) => request<{ deal: Deal }>(`/v1/deals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/v1/deals/${id}`, { method: 'DELETE' }),
}

export const dashboard = {
  get: () => request<{ dashboard: DashboardData }>('/v1/dashboard'),
}

export const financials = {
  get: (period: FinancialPeriod = 'year', currency = 'usd') =>
    request<{ financials: FinancialsData }>(`/v1/financials?period=${period}&currency=${currency}`),
}

export const tasks = {
  list: () => request<{ tasks: Task[] }>('/v1/tasks'),
  get: (id: string) => request<{ task: Task }>(`/v1/tasks/${id}`),
  create: (data: Partial<Task>) => request<{ task: Task }>('/v1/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Task>) => request<{ task: Task }>(`/v1/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/v1/tasks/${id}`, { method: 'DELETE' }),
}
