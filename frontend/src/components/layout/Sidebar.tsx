import React from 'react';
import { Compass, LayoutDashboard, ShieldAlert, Wrench, ShoppingBag } from 'lucide-react';
import { useVehicle } from '../../context/VehicleContext';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, activeVehicle } = useVehicle();
  const { user } = useAuth();

  const isAdmin =
    !user?.Role ||
    user.Role.toLowerCase().includes('admin') ||
    user.Username.toLowerCase() === 'admin';

  const criticalCount =
    activeVehicle?.ComponentesDesgaste?.filter((c) => c.DesgasteAcumulado >= 80.0).length || 0;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 0 },
    { id: 'workbench', label: 'Build Workbench', icon: Wrench, badge: 0 },
    { id: 'store', label: 'Tienda Oficial (ML)', icon: ShoppingBag, badge: 0 },
    { id: 'maintenance', label: 'Route Tracker', icon: Compass, badge: criticalCount },
    ...(isAdmin ? [{ id: 'admin' as const, label: 'Admin Console', icon: ShieldAlert, badge: 0 }] : []),
  ] as const;

  return (
    <aside
      className="glass-panel sidebar-container"
      style={{
        width: '240px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '1.25rem 0.75rem',
        height: 'fit-content',
        position: 'sticky',
        top: '6rem',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '0 0.5rem 0.75rem', borderBottom: '1px solid var(--card-border)' }}>
        <span
          style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-secondary)',
            fontWeight: 700,
          }}
        >
          Navegación Principal
        </span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(249, 115, 22, 0.12)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent-color)' : '3px solid transparent',
                color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} />
                <span>{item.label}</span>
              </div>

              {item.badge > 0 && (
                <span
                  style={{
                    background: 'var(--danger-color)',
                    color: '#fff',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.45rem',
                    borderRadius: '999px',
                  }}
                  title={`${item.badge} alerta(s) de mantenimiento crítico`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div
        style={{
          marginTop: '2rem',
          padding: '0.75rem 0.5rem 0',
          borderTop: '1px solid var(--card-border)',
          textAlign: 'center',
        }}
      >
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          4ME React Engine v5.0
        </span>
      </div>
    </aside>
  );
};
