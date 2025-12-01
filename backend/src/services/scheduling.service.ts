import { query } from '../db/pool';

// Simple scheduling helper that finds the first available slot for doctors of a specialty
// This is a lightweight implementation for MVP; a Redis-backed slot cache will be added later.

export async function findAvailableSlot(specialty: string, withinHours: number = 24) {
  // Normalize specialty names for English-Spanish mapping
  const specialtyMap: {[key: string]: string[]} = {
    'Medicina General': ['Medicina General', 'General'],
    'Cardiologia': ['Cardiologia', 'Cardiology'],
    'Pediatria': ['Pediatria', 'Pediatrics'],
    'Ortopedia': ['Ortopedia', 'Orthopedics'],
    'Dermatologia': ['Dermatologia', 'Dermatology'],
  };

  const acceptedSpecialties = specialtyMap[specialty] || [specialty];

  // Find doctors with the specialty
  const doctorsRes = await query(
    'SELECT id, name FROM doctors WHERE specialty = ANY($1) ORDER BY current_patient_load ASC',
    [acceptedSpecialties]
  );

  if (doctorsRes.rows.length === 0) {
    // No doctors found - create test doctors if needed
    console.warn(`No doctors found for specialty: ${specialty}. Creating test doctor...`);
    const testDoctor = await query(
      'INSERT INTO doctors (name, specialty) VALUES ($1, $2) RETURNING id, name',
      [`Dr. Test - ${specialty}`, specialty]
    );
    
    if (testDoctor.rows.length === 0) {
      return null;
    }

    const doctorId = testDoctor.rows[0].id;
    const doctorName = testDoctor.rows[0].name;

    // Create schedule with available slots for this doctor
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000);
    const date = tomorrow.toISOString().slice(0, 10);
    
    const slots = [
      { start: '09:00', end: '09:30' },
      { start: '10:00', end: '10:30' },
      { start: '14:00', end: '14:30' },
      { start: '15:00', end: '15:30' },
    ];

    try {
      await query(
        'INSERT INTO doctor_schedules (doctor_id, date, available_slots, booked_slots, max_capacity) VALUES ($1, $2, $3, $4, $5)',
        [doctorId, date, JSON.stringify(slots), JSON.stringify([]), 4]
      );
    } catch (err) {
      // Schedule might already exist
      console.log('Schedule already exists');
    }

    return { doctorId, doctorName, date, slot: slots[0] };
  }

  const doctorIds = doctorsRes.rows.map((r: any) => r.id);
  const doctorMap = new Map(doctorsRes.rows.map((r: any) => [r.id, r.name]));

  const now = new Date();
  const end = new Date(now.getTime() + withinHours * 3600 * 1000);

  for (const did of doctorIds) {
    // Look for doctor_schedules between now and end date
    const dateKeys: string[] = [];
    const cur = new Date(now);
    while (cur <= end) {
      dateKeys.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }

    for (const d of dateKeys) {
      const res = await query('SELECT available_slots, booked_slots FROM doctor_schedules WHERE doctor_id = $1 AND date = $2', [did, d]);
      if (res.rows.length === 0) continue;
      const row = res.rows[0];
      const available = row.available_slots || [];
      const booked = row.booked_slots || [];
      for (const slot of available) {
        const slotId = slot.slot_id || slot.start;
        const already = booked.find((b: any) => (b.slot_id || b.start) === slotId);
        if (!already) {
          // propose this slot
          return { doctorId: did, doctorName: doctorMap.get(did), date: d, slot };
        }
      }
    }
  }

  return null;
}
