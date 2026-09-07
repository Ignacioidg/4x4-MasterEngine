import React, { useState, useEffect } from 'react';
import { History, RefreshCw, ShieldAlert, Users } from 'lucide-react';
import { apiCall } from '../../services/api';
import { AuditLog } from '../../types';

interface AdminTabProps {
  onShowToast: (msg: string, type?: 'error' | 'success' | 'info') => void;
}

export const AdminTab: React.FC<AdminTabProps> = ({ onShowToast }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const logs = await apiCall<AuditLog[]>('/audit');
      setAuditLogs(logs);
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      onShowToast('Error al cargar logs de auditoría', 'error');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const dummyUsers = [
    { name: 'Marcelo Diaz', email: 'm.diaz@4me.io', role: 'Admin', roleBadge: 'rgba(239,68,68,0.15)', roleColor: 'var(--danger-color)', vehicles: 3, status: 'ACTIVO' },
    { name: 'Carolina Vega', email: 'c.vega@4me.io', role: 'Fleet Manager', roleBadge: 'rgba(249,115,22,0.15)', roleColor: 'var(--accent-color)', vehicles: 12, status: 'ACTIVO' },
    { name: 'Roberto Saenz', email: 'r.saenz@4me.io', role: 'Mechanic', roleBadge: 'rgba(59,130,246,0.15)', roleColor: '#3b82f6', vehicles: 0, status: 'ACTIVO' },
    { name: 'Daniela Ponce', email: 'd.ponce@4me.io', role: 'Viewer', roleBadge: 'rgba(255,255,255,0.05)', roleColor: 'var(--text-secondary)', vehicles: 2, status: 'SUSPENDIDO' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem' }}>
      {/* Column 1: Users & Roles Matrix (Figma Match) */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="panel-header">
          <div className="panel-title">
            <Users size={20} color="var(--accent-color)" />
            <span>Matriz de Usuarios y Roles</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Figma Specification</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.75rem' }}>Usuario</th>
                <th style={{ padding: '0.75rem' }}>Email</th>
                <th style={{ padding: '0.75rem' }}>Rol</th>
                <th style={{ padding: '0.75rem' }}>Vehículos</th>
                <th style={{ padding: '0.75rem' }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {dummyUsers.map((u, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600, color: '#fff' }}>{u.name}</td>
                  <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '0.85rem 0.75rem' }}>
                    <span
                      style={{
                        background: u.roleBadge,
                        color: u.roleColor,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 0.75rem', color: '#fff' }}>{u.vehicles}</td>
                  <td style={{ padding: '0.85rem 0.75rem' }}>
                    <span style={{ color: u.status === 'ACTIVO' ? 'var(--success-color)' : 'var(--danger-color)', fontWeight: 600, fontSize: '0.75rem' }}>
                      {u.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Column 2: Audit Logs */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="panel-header">
          <div className="panel-title">
            <History size={18} color="var(--accent-color)" />
            <span>Trazabilidad / Auditoría</span>
          </div>
          <button
            onClick={fetchAuditLogs}
            disabled={loadingLogs}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-color)',
              fontSize: '0.75rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            <RefreshCw size={12} className={loadingLogs ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '500px', overflowY: 'auto' }}>
          {auditLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              No hay eventos de auditoría registrados.
            </div>
          ) : (
            auditLogs.map((log) => {
              const date = new Date(log.Timestamp).toLocaleTimeString();
              const isInsert = log.Action === 'INSERT';
              const isDelete = log.Action === 'DELETE';

              return (
                <div
                  key={log.Id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: isInsert ? 'var(--success-color)' : isDelete ? 'var(--danger-color)' : 'var(--accent-color)',
                      }}
                    >
                      {log.EntityName} [{log.Action}]
                    </span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{date}</span>
                  </div>

                  <div style={{ color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Por: <strong style={{ color: '#fff' }}>{log.Username}</strong>
                  </div>

                  {log.OldValues && (
                    <div
                      style={{
                        background: 'rgba(239,68,68,0.05)',
                        borderLeft: '2px solid var(--danger-color)',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.7rem',
                        fontFamily: 'monospace',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.25rem',
                        wordBreak: 'break-all',
                      }}
                    >
                      Old: {log.OldValues}
                    </div>
                  )}

                  {log.NewValues && (
                    <div
                      style={{
                        background: 'rgba(34,197,94,0.05)',
                        borderLeft: '2px solid var(--success-color)',
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.7rem',
                        fontFamily: 'monospace',
                        color: '#fff',
                        wordBreak: 'break-all',
                      }}
                    >
                      New: {log.NewValues}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
