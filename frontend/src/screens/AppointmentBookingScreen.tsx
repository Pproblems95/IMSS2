import React, { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import styles from './appointmentBooking.module.css';

interface TriageQuestion {
  id: number;
  question: string;
  hint: string;
}

const TRIAGE_QUESTIONS: TriageQuestion[] = [
  { id: 1, question: 'Tiene dolor?', hint: 'Seleccione el nivel de dolor que siente' },
  { id: 2, question: 'Cuanto tiempo lleva con los sintomas?', hint: 'Seleccione la duracion' },
  { id: 3, question: 'Con que frecuencia presenta los sintomas?', hint: 'Seleccione la frecuencia' },
  { id: 4, question: 'Presenta sintomas de emergencia?', hint: 'Responda honestamente' },
  { id: 5, question: 'Tiene fiebre o temperatura elevada?', hint: 'Seleccione la opcion que aplique' },
];

const SPECIALTIES = ['Medicina General', 'Cardiologia', 'Pediatria', 'Ortopedia', 'Dermatologia'];

interface BookingResult {
  urgencyLevel: string;
  doctorName: string;
  doctorSpecialty: string;
  appointmentTime: string;
  appointmentId: string;
}

export const AppointmentBookingScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { accessToken } = useAuth();
  const [triageAnswers, setTriageAnswers] = useState<number[]>([0, 0, 0, 0, 0]);
  const [specialty, setSpecialty] = useState<string>('General');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);

  const handleTriageChange = (questionIndex: number, value: number) => {
    const newAnswers = [...triageAnswers];
    newAnswers[questionIndex] = value;
    setTriageAnswers(newAnswers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:4000/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          triageAnswers,
          specialty,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to book appointment');
      }

      const data = await response.json();
      setSuccess(true);
      
      // Parse the appointment time safely
      let formattedTime = 'Fecha no disponible';
      try {
        if (data.appointmentTime) {
          // Handle ISO string or timestamp
          const dateObj = new Date(data.appointmentTime);
          if (!isNaN(dateObj.getTime())) {
            formattedTime = dateObj.toLocaleString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
        }
      } catch (e) {
        console.error('Date parsing error:', e);
      }
      
      setBookingResult({
        urgencyLevel: data.urgencyLevel || 'LOW',
        doctorName: data.doctorName || 'Doctor Asignado',
        doctorSpecialty: data.doctorSpecialty || 'Especialidad',
        appointmentTime: formattedTime,
        appointmentId: data.id,
      });

      setTimeout(() => {
        onBack();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (success && bookingResult) {
    return (
      <div className={styles.container}>
        <button className={styles.backButton} onClick={onBack}>
          <ArrowLeftIcon width={20} height={20} />
          Volver
        </button>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <CheckCircleIcon width={64} height={64} />
          </div>
          <h2>Cita Agendada Exitosamente!</h2>
          <div className={styles.resultDetails}>
            <div className={styles.resultRow}>
              <span className={styles.label}>Urgencia:</span>
              <span className={`${styles.urgencyBadge} ${styles[`urgency-${bookingResult.urgencyLevel.toLowerCase()}`]}`}>
                {bookingResult.urgencyLevel}
              </span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.label}>Doctor:</span>
              <span>{bookingResult.doctorName}</span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.label}>Especialidad:</span>
              <span>{bookingResult.doctorSpecialty}</span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.label}>Fecha y Hora:</span>
              <span>{bookingResult.appointmentTime}</span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.label}>ID de Cita:</span>
              <span className={styles.appointmentId}>{bookingResult.appointmentId}</span>
            </div>
          </div>
          <p className={styles.redirectMessage}>Regresando al menu en 3 segundos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={onBack}>
        <ArrowLeftIcon width={20} height={20} />
        Volver
      </button>
      
      <div className={styles.form}>
        <h2>Agendar Nueva Cita</h2>
        <p className={styles.subtitle}>Complete el formulario de evaluacion para obtener una cita</p>

        {error && <div className={styles.alert + ' ' + styles.alertError}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.section}>
            <h3>Evaluacion Rapida</h3>
            
            {TRIAGE_QUESTIONS.map((q, index) => (
              <div key={q.id} className={styles.questionGroup}>
                <label className={styles.questionLabel}>
                  {q.question}
                  <span className={styles.hint}>{q.hint}</span>
                </label>
                <div className={styles.answerOptions}>
                  {[0, 1, 2, 3].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.answerButton} ${triageAnswers[index] === value ? styles.selected : ''}`}
                      onClick={() => handleTriageChange(index, value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.section}>
            <label className={styles.formLabel}>Especialidad Requerida:</label>
            <select
              className={styles.select}
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            >
              {SPECIALTIES.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner}></span> Agendando...
              </>
            ) : (
              'Agendar Cita'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
