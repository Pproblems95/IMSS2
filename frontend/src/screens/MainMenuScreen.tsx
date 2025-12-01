import { useAuth } from '../contexts/AuthContext';
import { CalendarIcon, ClipboardDocumentListIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import styles from './menu.module.css';

interface MainMenuScreenProps {
  onBookAppointment: () => void;
  onViewAppointments: () => void;
}

export const MainMenuScreen = ({ onBookAppointment, onViewAppointments }: MainMenuScreenProps) => {
  const { user, logout, isLoading } = useAuth();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🏥 IMSS Medical</h1>
        <div className={styles.userInfo}>
          <span>{user?.email}</span>
          <button
            onClick={logout}
            className="btn-secondary btn-sm"
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowRightOnRectangleIcon width={16} height={16} />
            Cerrar Sesion
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.welcomeSection}>
          <h2>Bienvenido al Sistema de Citas Medicas</h2>
          <p>Gestiona tus citas medicas de forma rapida y eficiente</p>
        </div>

        <div className={styles.menuGrid}>
          <div className={styles.menuCard}>
            <div className={styles.cardIcon}>
              <CalendarIcon width={48} height={48} style={{ color: '#27ae60' }} />
            </div>
            <h3>Agendar Cita</h3>
            <p>Solicita una nueva cita medica con un especialista</p>
            <button
              onClick={onBookAppointment}
              className="btn-primary"
              style={{ marginTop: 'auto' }}
            >
              Agendar Ahora
            </button>
          </div>

          <div className={styles.menuCard}>
            <div className={styles.cardIcon}>
              <ClipboardDocumentListIcon width={48} height={48} style={{ color: '#27ae60' }} />
            </div>
            <h3>Mis Citas</h3>
            <p>Visualiza y gestiona tus citas programadas</p>
            <button
              onClick={onViewAppointments}
              className="btn-primary"
              style={{ marginTop: 'auto' }}
            >
              Ver Citas
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
