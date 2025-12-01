import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './auth.module.css';

interface SignUpScreenProps {
  onLoginClick: () => void;
}

export const SignUpScreen = ({ onLoginClick }: SignUpScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [curp, setCurp] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { register, isLoading, error } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (password !== confirmPassword) {
      setPasswordError('Las contrasenas no coinciden');
      return;
    }

    if (password.length < 6) {
      setPasswordError('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    try {
      await register(email, password, curp || undefined);
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
          <h2>Crear Cuenta</h2>

          {error && <div className="alert alert-error">{error}</div>}
          {passwordError && <div className="alert alert-error">{passwordError}</div>}

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
            <label htmlFor="curp">CURP (Opcional)</label>
            <input
              id="curp"
              type="text"
              value={curp}
              onChange={(e) => setCurp(e.target.value.toUpperCase())}
              placeholder="ABC123XYZ456DEF"
              maxLength={18}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Contrasena</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimo 6 caracteres"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirmar Contrasena</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contrasena"
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
                <span className="spinner"></span> Creando Cuenta...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </form>

        <div className={styles.divider}>
          <span>Ya tienes cuenta?</span>
        </div>

        <button
          onClick={onLoginClick}
          className="btn-secondary"
          style={{ width: '100%' }}
          disabled={isLoading}
        >
          Iniciar Sesion
        </button>
      </div>
    </div>
  );
};
