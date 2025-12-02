import { query } from '../db/pool';
import { randomUUID } from 'crypto';

export interface DoctorRecord {
  id: string;
  name: string;
  specialty: string;
  qualifications?: any;
  yearsExperience?: number;
}

export async function findDoctorById(id: string): Promise<DoctorRecord | null> {
  const res = await query('SELECT id, name, specialty, qualifications, years_experience FROM doctors WHERE id = $1', [id]);
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    id: r.id,
    name: r.name,
    specialty: r.specialty,
    qualifications: r.qualifications,
    yearsExperience: r.years_experience,
  };
}

export async function listDoctors(filter?: { specialty?: string }) {
  if (filter?.specialty) {
    const res = await query('SELECT id, name, specialty, qualifications, years_experience FROM doctors WHERE specialty = $1', [filter.specialty]);
    return res.rows.map((r: any) => ({ id: r.id, name: r.name, specialty: r.specialty, qualifications: r.qualifications, yearsExperience: r.years_experience }));
  }
  const res = await query('SELECT id, name, specialty, qualifications, years_experience FROM doctors ORDER BY name');
  return res.rows.map((r: any) => ({ id: r.id, name: r.name, specialty: r.specialty, qualifications: r.qualifications, yearsExperience: r.years_experience }));
}

export async function createDoctor(name: string, specialty: string, qualifications?: any) {
  const res = await query('INSERT INTO doctors (name, specialty, qualifications) VALUES ($1,$2,$3) RETURNING id, name, specialty, qualifications, years_experience', [name, specialty, qualifications || null]);
  const r = res.rows[0];
  return { id: r.id, name: r.name, specialty: r.specialty, qualifications: r.qualifications, yearsExperience: r.years_experience } as DoctorRecord;
}

export async function findDoctorByName(name: string): Promise<DoctorRecord | null> {
  const res = await query('SELECT id, name, specialty, qualifications, years_experience FROM doctors WHERE name = $1 LIMIT 1', [name]);
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    id: r.id,
    name: r.name,
    specialty: r.specialty,
    qualifications: r.qualifications,
    yearsExperience: r.years_experience,
  };
}

export async function getOrCreateEmergencyPlaceholder(): Promise<string> {
  const PLACEHOLDER_NAME = 'EMERGENCY_PLACEHOLDER';
  try {
    const existing = await query('SELECT id FROM doctors WHERE name = $1 LIMIT 1', [PLACEHOLDER_NAME]);
    if (existing.rows.length > 0) return existing.rows[0].id;
    const ins = await query('INSERT INTO doctors (name, specialty, qualifications) VALUES ($1,$2,$3) RETURNING id', [PLACEHOLDER_NAME, 'EMERGENCY', null]);
    return ins.rows[0].id;
  } catch (err: any) {
    console.warn('DB unavailable for emergency placeholder doctor, using generated UUID fallback:', err?.message || err);
    // Generate a UUID to use as a placeholder so downstream code receives a valid UUID string
    return randomUUID();
  }
}
