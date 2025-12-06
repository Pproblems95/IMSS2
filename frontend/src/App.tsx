import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginScreen } from './screens/LoginScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { MainMenuScreen } from './screens/MainMenuScreen';
import { AppointmentBookingScreen } from './screens/AppointmentBookingScreen';
import { AppointmentListScreen } from './screens/AppointmentListScreen';
import './styles/global.css';

type ScreenType = 'LOGIN' | 'SIGNUP' | 'MENU' | 'BOOK_APPOINTMENT' | 'VIEW_APPOINTMENTS';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('LOGIN');

  // If user is logged in, show menu by default
  useEffect(() => {
    if (user) {
      setCurrentScreen('MENU');
    } else {
      setCurrentScreen('LOGIN');
    }
  }, [user]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#127a38',
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white',
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: 'white',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 20px',
          }} />
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  // Render screens based on current screen state
  switch (currentScreen) {
    case 'LOGIN':
      return (
        <LoginScreen onSignUpClick={() => setCurrentScreen('SIGNUP')} />
      );

    case 'SIGNUP':
      return (
        <SignUpScreen onLoginClick={() => setCurrentScreen('LOGIN')} />
      );

    case 'MENU':
      return (
        <MainMenuScreen
          onBookAppointment={() => setCurrentScreen('BOOK_APPOINTMENT')}
          onViewAppointments={() => setCurrentScreen('VIEW_APPOINTMENTS')}
        />
      );

    case 'BOOK_APPOINTMENT':
      return (
        <AppointmentBookingScreen
          onBack={() => setCurrentScreen('MENU')}
        />
      );

    case 'VIEW_APPOINTMENTS':
      return (
        <AppointmentListScreen
          onBack={() => setCurrentScreen('MENU')}
        />
      );

    default:
      return null;
  }
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
