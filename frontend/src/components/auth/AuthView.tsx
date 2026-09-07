import React, { useState } from 'react';
import { KeyRound, Lock, LogIn, User, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthViewProps {
  onShowToast: (msg: string, type?: 'error' | 'success' | 'info') => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onShowToast }) => {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Usuario');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        await register(username, password, role);
        onShowToast('¡Cuenta creada e inicio de sesión exitoso!', 'success');
      } else {
        await login(username, password);
        onShowToast('Sesión iniciada con éxito', 'success');
      }
    } catch (err: any) {
      onShowToast(err.message || 'Error durante la autenticación', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 120px)',
        padding: '2rem',
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '2.5rem',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'rgba(249, 115, 22, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: 'var(--accent-color)',
            }}
          >
            {isRegistering ? <UserPlus size={28} /> : <Lock size={28} />}
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>
            {isRegistering ? 'Crear Nueva Cuenta' : 'Iniciar Sesión'}
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {isRegistering
              ? 'Registrate para simular configuraciones 4x4'
              : 'Accedé a la plataforma de ingeniería 4ME'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Nombre de Usuario
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="username"
                type="text"
                className="form-input"
                required
                placeholder="Ej: admin o usuario_4x4"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
              <User
                size={16}
                color="var(--text-secondary)"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type="password"
                className="form-input"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.25rem' }}
              />
              <KeyRound
                size={16}
                color="var(--text-secondary)"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {isRegistering && (
            <div className="form-group">
              <label className="form-label" htmlFor="role">
                Rol de Acceso
              </label>
              <select
                id="role"
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Usuario">Usuario Común</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem', padding: '0.75rem' }}
          >
            {isRegistering ? (
              <>
                <UserPlus size={18} />
                <span>{loading ? 'Creando cuenta...' : 'Registrarse'}</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>{loading ? 'Verificando...' : 'Entrar a 4ME'}</span>
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isRegistering ? (
            <span>
              ¿Ya tenés cuenta?{' '}
              <a
                href="#login"
                onClick={(e) => {
                  e.preventDefault();
                  setIsRegistering(false);
                }}
                style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}
              >
                Iniciá Sesión
              </a>
            </span>
          ) : (
            <span>
              ¿No tenés cuenta aún?{' '}
              <a
                href="#register"
                onClick={(e) => {
                  e.preventDefault();
                  setIsRegistering(true);
                }}
                style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 600 }}
              >
                Registrate acá
              </a>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
