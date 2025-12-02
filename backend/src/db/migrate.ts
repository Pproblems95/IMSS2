import { query } from './pool';

const migrations = [
  {
    version: '001',
    name: 'create_users_table',
    up: `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        curp VARCHAR(18),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(LOWER(email));
    `,
    down: `DROP TABLE IF EXISTS users;`,
  },
  {
    version: '003',
    name: 'make_doctor_nullable',
    up: `
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'appointments' AND column_name = 'doctor_id' AND is_nullable = 'NO'
        ) THEN
          ALTER TABLE appointments ALTER COLUMN doctor_id DROP NOT NULL;
        END IF;
      END $$;
    `,
    down: `
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'appointments' AND column_name = 'doctor_id' AND is_nullable = 'YES'
        ) THEN
          ALTER TABLE appointments ALTER COLUMN doctor_id SET NOT NULL;
        END IF;
      END $$;
    `,
  },
  {
    version: '002',
    name: 'create_doctors_appointments_tables',
    up: `
      CREATE TABLE IF NOT EXISTS doctors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        specialty TEXT NOT NULL,
        qualifications JSONB,
        years_experience INT,
        available_hours JSONB,
        current_patient_load INT DEFAULT 0,
        average_rating NUMERIC(3,2) DEFAULT 0.0,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS doctor_schedules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        available_slots JSONB NOT NULL,
        booked_slots JSONB NOT NULL DEFAULT '[]'::jsonb,
        max_capacity INT DEFAULT 0,
        updated_at timestamptz DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS ux_doctor_schedule_date ON doctor_schedules (doctor_id, date);

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
          CREATE TYPE appointment_status AS ENUM ('BOOKED', 'COMPLETED', 'CANCELLED');
        END IF;
      END $$;

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'urgency_level') THEN
          CREATE TYPE urgency_level AS ENUM ('LOW', 'MID', 'HIGH', 'EMERGENCY');
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS appointments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE SET NULL,
        scheduled_at timestamptz NOT NULL,
        urgency_level urgency_level NOT NULL DEFAULT 'LOW',
        reason TEXT,
        status appointment_status NOT NULL DEFAULT 'BOOKED',
        reference_number TEXT NOT NULL UNIQUE,
        clinical_notes TEXT,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments (user_id);
      CREATE INDEX IF NOT EXISTS idx_appointments_doctor_scheduled ON appointments (doctor_id, scheduled_at);

      CREATE TABLE IF NOT EXISTS urgency_assessments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
        question_responses JSONB NOT NULL,
        score INT NOT NULL,
        calculated_urgency urgency_level NOT NULL,
        emergency_flag BOOLEAN DEFAULT FALSE,
        created_at timestamptz DEFAULT now()
      );

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'escalation_status') THEN
          CREATE TYPE escalation_status AS ENUM ('PENDING', 'NOTIFIED', 'DISPATCHED', 'RESOLVED');
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS emergency_escalations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
        escalation_type TEXT NOT NULL,
        reason TEXT NOT NULL,
        status escalation_status NOT NULL DEFAULT 'PENDING',
        on_call_notified_at timestamptz,
        dispatch_initiated_at timestamptz,
        dispatch_reference TEXT,
        notes TEXT,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_emergency_escalations_appointment ON emergency_escalations (appointment_id);
      CREATE INDEX IF NOT EXISTS idx_emergency_escalations_user ON emergency_escalations (user_id);
      CREATE INDEX IF NOT EXISTS idx_emergency_escalations_status ON emergency_escalations (status);
    `,
    down: `
      DROP TABLE IF EXISTS emergency_escalations;
      DROP TYPE IF EXISTS escalation_status;
      DROP TABLE IF EXISTS urgency_assessments;
      DROP TABLE IF EXISTS appointments;
      DROP TABLE IF EXISTS doctor_schedules;
      DROP TABLE IF EXISTS doctors;
      DROP TYPE IF EXISTS appointment_status;
      DROP TYPE IF EXISTS urgency_level;
    `,
  },
];

async function ensureDatabase() {
  // Connect to default postgres database to create our database
  const { Pool } = require('pg');
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: 'postgres', // default database
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    connectionTimeoutMillis: 5000,
  });

  try {
    const dbName = process.env.DB_NAME || 'imss_medical';
    const result = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );
    
    if (result.rows.length === 0) {
      console.log(`Creating database '${dbName}'...`);
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✓ Database '${dbName}' created`);
    } else {
      console.log(`✓ Database '${dbName}' already exists`);
    }
  } finally {
    await adminPool.end();
  }
}

async function getMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(50) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations() {
  const result = await query('SELECT version FROM schema_migrations ORDER BY version');
  return result.rows.map((r: any) => r.version);
}

async function runMigration(migration: any) {
  const client = await require('./pool').getClient();
  try {
    await client.query('BEGIN');
    await client.query(migration.up);
    await client.query('INSERT INTO schema_migrations (version, name) VALUES ($1, $2)', [
      migration.version,
      migration.name,
    ]);
    await client.query('COMMIT');
    console.log(`✓ Migration ${migration.version} (${migration.name}) applied`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`✗ Migration ${migration.version} failed:`, err);
    throw err;
  } finally {
    client.release();
  }
}

async function migrate() {
  try {
    await ensureDatabase();
    await getMigrationsTable();
    const applied = await getAppliedMigrations();

    for (const migration of migrations) {
      if (!applied.includes(migration.version)) {
        await runMigration(migration);
      }
    }

    console.log('✓ All migrations complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
