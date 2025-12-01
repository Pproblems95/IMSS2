import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, TrashIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import styles from './appointmentList.module.css';

interface Appointment {
  id: string;
  doctorName: string;
  doctorSpecialty: string;
  appointmentTime: string;
  urgencyLevel: string;
  status: string;
  triageAnswers?: number[];
}

export const AppointmentListScreen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { accessToken } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:4000/api/appointments', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (appointmentId: string) => {
    if (!window.confirm('¿Desea cancelar esta cita?')) return;

    try {
      const response = await fetch(`http://localhost:4000/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel appointment');
      }

      setAppointments(appointments.filter((a) => a.id !== appointmentId));
      setSelectedAppointment(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'LOW':
        return styles.urgencyLow;
      case 'MID':
        return styles.urgencyMid;
      case 'HIGH':
        return styles.urgencyHigh;
      case 'EMERGENCY':
        return styles.urgencyEmergency;
      default:
        return styles.urgencyLow;
    }
  };

  if (selectedAppointment) {
    return (
      <div className={styles.container}>
        <button className={styles.backButton} onClick={() => setSelectedAppointment(null)}>
          <ArrowLeftIcon width={20} height={20} style={{ marginRight: '8px' }} />
          Atras
        </button>
        <div className={styles.detailCard}>
          <h2>Detalles de la Cita</h2>
          <div className={styles.detailRow}>
            <span className={styles.label}>ID:</span>
            <span className={styles.monospace}>{selectedAppointment.id}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Doctor:</span>
            <span>{selectedAppointment.doctorName}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Especialidad:</span>
            <span>{selectedAppointment.doctorSpecialty}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Fecha y Hora:</span>
            <span>{new Date(selectedAppointment.appointmentTime).toLocaleString()}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Nivel de Urgencia:</span>
            <span className={`${styles.urgencyBadge} ${getUrgencyColor(selectedAppointment.urgencyLevel)}`}>
              {selectedAppointment.urgencyLevel}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Estado:</span>
            <span className={styles.statusBadge}>{selectedAppointment.status}</span>
          </div>

          {selectedAppointment.triageAnswers && (
            <div className={styles.triageSection}>
              <h3>Evaluacion de Triaje</h3>
              <div className={styles.triageAnswers}>
                {selectedAppointment.triageAnswers.map((answer, index) => (
                  <div key={index} className={styles.triageItem}>
                    <span className={styles.triageLabel}>Pregunta {index + 1}:</span>
                    <span className={styles.triageValue}>{answer}/3</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedAppointment.status === 'BOOKED' && (
            <button
              className={styles.cancelButton}
              onClick={() => handleCancel(selectedAppointment.id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <TrashIcon width={18} height={18} />
              Cancelar Cita
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={onBack}>
        <ArrowLeftIcon width={20} height={20} style={{ marginRight: '8px' }} />
        Volver
      </button>

      <div className={styles.header}>
        <h2>Mis Citas</h2>
        <button className={styles.refreshButton} onClick={fetchAppointments} disabled={isLoading}>
          {isLoading ? '⟳ Cargando...' : '⟳ Actualizar'}
        </button>
      </div>

      {error && <div className={styles.alert + ' ' + styles.alertError}>{error}</div>}

      {isLoading && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Cargando citas...</p>
        </div>
      )}

      {!isLoading && appointments.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <h3>Sin citas</h3>
          <p>Aun no tiene citas agendadas. Desea agendar una nueva?</p>
        </div>
      )}

      {!isLoading && appointments.length > 0 && (
        <div className={styles.appointmentsList}>
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className={styles.appointmentCard}
              onClick={() => setSelectedAppointment(appointment)}
            >
              <div className={styles.cardHeader}>
                <h3>{appointment.doctorName}</h3>
                <span className={`${styles.urgencyBadge} ${getUrgencyColor(appointment.urgencyLevel)}`}>
                  {appointment.urgencyLevel}
                </span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardRow}>
                  <span className={styles.label}>Especialidad:</span>
                  <span>{appointment.doctorSpecialty}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.label}>Fecha:</span>
                  <span>{new Date(appointment.appointmentTime).toLocaleString()}</span>
                </div>
                <div className={styles.cardRow}>
                  <span className={styles.label}>Estado:</span>
                  <span className={styles.statusBadge}>{appointment.status}</span>
                </div>
              </div>
              <div className={styles.cardFooter}>
                <button className={styles.viewButton}>Ver Detalles →</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
