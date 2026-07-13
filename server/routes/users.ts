import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db.js'
import { clearAuthCookie, setAuthCookie, signToken, verifySsoToken } from '../auth.js'

type UserRole = 'admin' | 'compras' | 'field'

type UserRow = {
  id: string
  name: string
  registration: string
  email: string
  role: UserRole
  approval_status: 'approved' | 'pending'
  requested_at: Date
  approved_at: Date | null
  birth_date: string
  job_title: string
  cpf: string
  personal_description: string
  hobby: string
  work_area: string
  work_subtype: string
}

function mapUser(row: UserRow) {
  return {
    id: row.id,
    name: row.name,
    registration: row.registration,
    email: row.email,
    role: row.role,
    approvalStatus: row.approval_status,
    requestedAt: row.requested_at.toISOString(),
    approvedAt: row.approved_at?.toISOString(),
    birthDate: row.birth_date,
    jobTitle: row.job_title,
    cpf: row.cpf,
    personalDescription: row.personal_description,
    hobby: row.hobby,
    workArea: row.work_area,
    workSubtype: row.work_subtype,
  }
}

function sessionRole(user: UserRow): UserRole {
  if (user.role === 'admin' || user.role === 'field' || user.role === 'compras') {
    if (user.role === 'compras' && user.work_area === 'Equipe de Campo') {
      return 'field'
    }
    return user.role
  }
  return 'field'
}

function canAccessFieldApp(user: UserRow) {
  return (
    user.role === 'admin' ||
    user.role === 'field' ||
    user.work_area === 'Equipe de Campo'
  )
}

async function findUserById(id: string) {
  const result = await query<UserRow>('SELECT * FROM users WHERE id = $1', [id])
  return result.rows[0] ?? null
}

export async function login(req: Request, res: Response) {
  const { registration, password } = req.body as {
    registration?: string
    password?: string
  }

  if (!registration?.trim() || !password) {
    res.status(400).json({ error: 'Matrícula e senha são obrigatórias.' })
    return
  }

  const result = await query<UserRow & { password_hash: string }>(
    'SELECT * FROM users WHERE UPPER(registration) = $1',
    [registration.trim().toUpperCase()],
  )
  const user = result.rows[0]

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ error: 'Matrícula ou senha inválida.' })
    return
  }

  if (user.approval_status !== 'approved') {
    res.status(403).json({ error: 'Seu cadastro ainda está pendente de aprovação.' })
    return
  }

  if (!canAccessFieldApp(user)) {
    res.status(403).json({ error: 'Este perfil não tem acesso ao Agendamento Lab Med.' })
    return
  }

  const role = sessionRole(user)
  const token = signToken({ id: user.id, registration: user.registration, role })
  setAuthCookie(res, token)
  res.json({ user: { ...mapUser(user), role } })
}

export async function me(req: Request, res: Response) {
  const result = await query<UserRow>('SELECT * FROM users WHERE id = $1', [req.user!.id])
  if (!result.rows[0]) {
    res.status(404).json({ error: 'Usuário não encontrado.' })
    return
  }
  const user = result.rows[0]
  res.json({ user: { ...mapUser(user), role: sessionRole(user) } })
}

export async function logout(_req: Request, res: Response) {
  clearAuthCookie(res)
  res.json({ ok: true })
}

export async function exchangeSsoToken(req: Request, res: Response) {
  const { ssoToken } = req.body as { ssoToken?: string }

  if (!ssoToken?.trim()) {
    res.status(400).json({ error: 'Token SSO ausente.' })
    return
  }

  const userId = verifySsoToken(ssoToken.trim())
  if (!userId) {
    res.status(401).json({ error: 'Token SSO inválido ou expirado.' })
    return
  }

  const user = await findUserById(userId)
  if (!user) {
    res.status(401).json({ error: 'Usuário não encontrado.' })
    return
  }

  if (user.approval_status !== 'approved') {
    res.status(403).json({ error: 'Seu cadastro ainda está pendente de aprovação.' })
    return
  }

  if (!canAccessFieldApp(user)) {
    res.status(403).json({ error: 'Este perfil não tem acesso ao Agendamento Lab Med.' })
    return
  }

  const role = sessionRole(user)
  const token = signToken({ id: user.id, registration: user.registration, role })
  setAuthCookie(res, token)
  res.json({ user: { ...mapUser(user), role } })
}
