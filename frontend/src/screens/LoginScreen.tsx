import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './auth.module.css';

interface LoginScreenProps {
  onSignUpClick: () => void;
}

export const LoginScreen = ({ onSignUpClick }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      // Error is handled by context
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>🏥 IMSS Medical</h1>
          <p>Sistema de Citas Medicas</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <h2>Iniciar Sesion</h2>

          {error && <div className="alert alert-error">{error}</div>}

          <div className={styles.formGroup}>
            <label htmlFor="email">Correo Electronico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Contrasena</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isLoading}
            style={{ width: '100%' }}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span> Iniciando...
              </>
            ) : (
              'Iniciar Sesion'
            )}
          </button>
        </form>

        <div className={styles.divider}>
          <span>No tienes cuenta?</span>
        </div>

        <button
          onClick={onSignUpClick}
          className="btn-secondary"
          style={{ width: '100%' }}
          disabled={isLoading}
        >
          Crear Nueva Cuenta
        </button>
      </div>
    </div>
  );
};
