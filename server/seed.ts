import bcrypt from 'bcryptjs'
import { query } from './db.js'

const demoUsers = [
  {
    id: 'admin-demo',
    registration: 'E706032',
    password: 'Step@241',
    name: 'Administrador',
    email: 'admin@agendamento-lab-med.local',
    role: 'admin',
    jobTitle: 'Administrador',
    workArea: 'Equipe de Campo',
    workSubtype: 'Inspeção',
  },
  {
    id: 'field-inspection-1',
    registration: 'F700001',
    password: 'Campo@241',
    name: 'Ana Paula Inspeção',
    email: 'ana.inspecao@edp.com',
    role: 'field',
    jobTitle: 'Inspetora de Campo',
    workArea: 'Equipe de Campo',
    workSubtype: 'Inspeção',
  },
  {
    id: 'field-inspection-2',
    registration: 'F700002',
    password: 'Campo@241',
    name: 'Carlos Mendes Inspeção',
    email: 'carlos.inspecao@edp.com',
    role: 'field',
    jobTitle: 'Inspetor de Campo',
    workArea: 'Equipe de Campo',
    workSubtype: 'Inspeção',
  },
]

const initialCsds = [
  {
    id: 'csd-001',
    name: 'CSD-001 - Região Norte',
    address: 'Av. Norte, 1200',
    cities: ['São José dos Campos', 'Jacareí', 'Caçapava', 'Monteiro Lobato'],
    responsibleUserId: 'field-inspection-1',
  },
  {
    id: 'csd-002',
    name: 'CSD-002 - Região Sul',
    address: 'Rua Sul, 450',
    cities: ['Taubaté', 'Tremembé', 'Pindamonhangaba', 'Potim'],
    responsibleUserId: 'field-inspection-2',
  },
  {
    id: 'csd-003',
    name: 'CSD-003 - Região Leste',
    address: 'Av. Leste, 890',
    cities: ['Guarulhos', 'Suzano', 'Poá', 'Ferraz de Vasconcelos', 'Itaquaquecetuba'],
    responsibleUserId: 'field-inspection-1',
  },
  {
    id: 'csd-004',
    name: 'CSD-004 - Região Oeste',
    address: 'Rua Oeste, 320',
    cities: ['Caraguatatuba', 'São Sebastião', 'Canas', 'Cruzeiro'],
    responsibleUserId: 'field-inspection-2',
  },
  {
    id: 'csd-005',
    name: 'CSD-005 - Região Centro',
    address: 'Av. Central, 1500',
    cities: ['Guaratinguetá', 'Lorena', 'Aparecida', 'Cachoeira Paulista', 'Roseira'],
    responsibleUserId: 'field-inspection-1',
  },
]

export async function seed() {
  for (const user of demoUsers) {
    const hash = await bcrypt.hash(user.password, 10)
    await query(
      `INSERT INTO users (
        id, name, registration, password_hash, email, role, approval_status,
        requested_at, approved_at, job_title, work_area, work_subtype
      ) VALUES ($1,$2,$3,$4,$5,$6,'approved',$7,$7,$8,$9,$10)
      ON CONFLICT (id) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        approval_status = 'approved',
        role = EXCLUDED.role,
        work_area = EXCLUDED.work_area,
        work_subtype = EXCLUDED.work_subtype`,
      [
        user.id,
        user.name,
        user.registration,
        hash,
        user.email,
        user.role,
        '2026-04-08T00:00:00.000Z',
        user.jobTitle,
        user.workArea,
        user.workSubtype,
      ],
    )
  }

  const csdsCount = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM csds')
  if (Number(csdsCount.rows[0]?.count ?? 0) === 0) {
    for (const csd of initialCsds) {
      await query(
        `INSERT INTO csds (id, name, address, cities, responsible_user_id)
         VALUES ($1, $2, $3, $4::jsonb, $5)
         ON CONFLICT (id) DO NOTHING`,
        [csd.id, csd.name, csd.address, JSON.stringify(csd.cities), csd.responsibleUserId],
      )
    }
  }
}
