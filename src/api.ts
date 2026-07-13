export type UserRole = 'admin' | 'field'
export type ApprovalStatus = 'approved' | 'pending'

export type AppUser = {
  id: string
  name: string
  registration: string
  email: string
  role: UserRole
  approvalStatus: ApprovalStatus
  requestedAt: string
  approvedAt?: string
  birthDate: string
  jobTitle: string
  cpf: string
  personalDescription: string
  hobby: string
  workArea: string
  workSubtype: string
}

export type CsdRecord = {
  id: string
  name: string
  address: string
  cities: string[]
  responsibleUserId: string
  responsibleName: string
  responsibleRegistration: string
  createdAt: string
}

export type MeterScheduleRecord = {
  id: string
  meter: string
  installation: string
  toi: string
  note: string
  csd: string
  clientPresent: 'sim' | 'nao'
  schedulingNotes: string
  scheduledAt: string
  scheduledAtLabel: string
  trailStep: string
  source: string
  createdAt: string
  createdByUserId: string | null
  createdByRegistration: string | null
}

class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  const payload = (await response.json().catch(() => ({}))) as { error?: string }

  if (!response.ok) {
    throw new ApiError(response.status, payload.error ?? 'Erro ao comunicar com o servidor.')
  }

  return payload as T
}

export const api = {
  me: () => request<{ user: AppUser }>('/api/auth/me'),
  login: (registration: string, password: string) =>
    request<{ user: AppUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ registration, password }),
    }),
  logout: () =>
    request<{ ok: boolean }>('/api/auth/logout', {
      method: 'POST',
    }),
  listCsds: () => request<{ csds: CsdRecord[] }>('/api/csds'),
  listMeterSchedules: (params?: { mine?: boolean }) => {
    const search = new URLSearchParams()
    if (params?.mine) search.set('mine', 'true')
    const queryString = search.toString()
    return request<{ schedules: MeterScheduleRecord[]; total: number }>(
      `/api/meter-schedules${queryString ? `?${queryString}` : ''}`,
    )
  },
  createMeterSchedule: (payload: {
    meter: string
    installation: string
    toi: string
    note: string
    csd: string
    clientPresent: 'sim' | 'nao'
    schedulingNotes?: string
  }) =>
    request<{ schedule: MeterScheduleRecord }>('/api/meter-schedules', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}

export { ApiError }
