import { query } from './db.js'

/**
 * Em produção integrada (SHARED_DATABASE=true), o app Eficiência da Medição
 * é o dono das migrações. Este migrate só roda em ambiente standalone.
 */
export async function migrate() {
  if (process.env.SHARED_DATABASE === 'true') {
    console.log('SHARED_DATABASE=true — migrates ignorados (dono: Eficiência da Medição).')
    return
  }

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      registration TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('admin', 'compras', 'field')),
      approval_status TEXT NOT NULL CHECK (approval_status IN ('approved', 'pending')),
      requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      approved_at TIMESTAMPTZ,
      birth_date TEXT NOT NULL DEFAULT '',
      job_title TEXT NOT NULL DEFAULT '',
      cpf TEXT NOT NULL DEFAULT '',
      personal_description TEXT NOT NULL DEFAULT '',
      hobby TEXT NOT NULL DEFAULT '',
      work_area TEXT NOT NULL DEFAULT 'Equipe de Campo',
      work_subtype TEXT NOT NULL DEFAULT 'Inspeção'
    );

    CREATE TABLE IF NOT EXISTS ensaios_manual_blocks (
      blocked_date DATE PRIMARY KEY,
      reason TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by_user_id TEXT REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS csds (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      address TEXT NOT NULL,
      cities JSONB NOT NULL DEFAULT '[]'::jsonb,
      responsible_user_id TEXT NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      user_id TEXT REFERENCES users(id),
      user_registration TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      summary TEXT,
      ip_address TEXT,
      user_agent TEXT,
      old_data JSONB,
      new_data JSONB,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb
    );

    CREATE TABLE IF NOT EXISTS meter_schedules (
      id TEXT PRIMARY KEY,
      meter TEXT NOT NULL,
      installation TEXT NOT NULL,
      toi TEXT NOT NULL,
      note TEXT NOT NULL,
      csd TEXT NOT NULL,
      client_present TEXT NOT NULL CHECK (client_present IN ('sim', 'nao')),
      scheduling_notes TEXT NOT NULL DEFAULT '',
      scheduled_at TIMESTAMPTZ NOT NULL,
      trail_step TEXT NOT NULL DEFAULT 'Entrada de medidores',
      source TEXT NOT NULL DEFAULT 'field_team',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by_user_id TEXT REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_meter_schedules_meter ON meter_schedules (meter);
    CREATE INDEX IF NOT EXISTS idx_meter_schedules_created_by ON meter_schedules (created_by_user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_occurred_at ON audit_logs (occurred_at DESC);
  `)

  await query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS work_area TEXT NOT NULL DEFAULT 'Equipe de Campo';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS work_subtype TEXT NOT NULL DEFAULT 'Inspeção';
  `)
}
