import React from 'react';
import { LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 2rem',
        borderBottom: '1px solid var(--card-border)',
        background: 'rgba(11, 15, 25, 0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span style={{ fontSize: '1.8rem' }}>🛞</span>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            4x4 MasterEngine{' '}
            <span style={{ fontWeight: 400, fontSize: '0.9rem', color: 'var(--accent-color)' }}>
              4ME Core
            </span>
          </h1>
        </div>
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--card-border)',
              borderRadius: '20px',
              padding: '0.35rem 0.85rem',
              fontSize: '0.85rem',
            }}
          >
            {user.Role === 'Administrador' ? (
              <ShieldCheck size={16} color="var(--accent-color)" />
            ) : (
              <UserIcon size={16} color="var(--primary-blue)" />
            )}
            <span style={{ color: '#fff', fontWeight: 600 }}>{user.Username}</span>
            <span
              style={{
                color: user.Role === 'Administrador' ? 'var(--accent-color)' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              ({user.Role})
            </span>
          </div>

          <button
            onClick={logout}
            className="btn-secondary"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
            title="Cerrar Sesión"
          >
            <LogOut size={16} />
            <span>Salir</span>
          </button>
        </div>
      )}
    </header>
  );
};
