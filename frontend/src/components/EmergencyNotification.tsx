import React, { useEffect, useState } from 'react';
import styles from './emergencyNotification.module.css';

export interface EmergencyNotificationData {
  appointmentId: string;
  escalationId: string;
  escalationType: 'CHEST_PAIN' | 'TRAUMA' | 'SEVERE_SYMPTOMS' | 'CRITICAL_CONDITION';
  message: string;
  timestamp: Date;
}

interface EmergencyNotificationProps {
  data?: EmergencyNotificationData;
  onDismiss?: () => void;
}

/**
 * Emergency Notification Component
 * Displays critical alerts to patients during emergency escalation
 */
export const EmergencyNotification: React.FC<EmergencyNotificationProps> = ({ data, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(!!data);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    if (data) {
      setIsVisible(true);
      setPulse(true);
      // Stop pulsing after 5 seconds
      const timer = setTimeout(() => setPulse(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (!data || !isVisible) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'CHEST_PAIN':
        return '❤️';
      case 'TRAUMA':
        return '⚠️';
      case 'SEVERE_SYMPTOMS':
        return '🆘';
      case 'CRITICAL_CONDITION':
        return '🚨';
      default:
        return '📞';
    }
  };

  const getTitle = (type: string) => {
    switch (type) {
      case 'CHEST_PAIN':
        return 'Dolor Torácico Detectado';
      case 'TRAUMA':
        return 'Traumatismo Detectado';
      case 'SEVERE_SYMPTOMS':
        return 'Síntomas Severos';
      case 'CRITICAL_CONDITION':
        return 'Condición Crítica';
      default:
        return 'Emergencia';
    }
  };

  return (
    <div className={`${styles.emergencyNotification} ${pulse ? styles.pulse : ''}`}>
      <div className={styles.content}>
        <div className={styles.icon}>{getIcon(data.escalationType)}</div>
        <div className={styles.textContent}>
          <h2 className={styles.title}>{getTitle(data.escalationType)}</h2>
          <p className={styles.message}>{data.message}</p>
          <p className={styles.details}>
            Tiempo: {new Date(data.timestamp).toLocaleTimeString('es-MX')}
          </p>
        </div>
        <button
          className={styles.closeButton}
          onClick={handleDismiss}
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>
      <div className={styles.actionBar}>
        <button className={styles.callButton}>
          📞 Llamar a Emergencias
        </button>
        <button className={styles.viewButton}>
          Ver Detalles de Escalación
        </button>
      </div>
    </div>
  );
};
