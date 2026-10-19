import React, { useState, useEffect } from 'react';
import {
  History,
  RefreshCw,
  ShieldAlert,
  Users,
  Plus,
  Wrench,
  GitBranch,
  Trash2,
  Search,
} from 'lucide-react';
import { apiCall } from '../../services/api';
import { AuditLog, SystemUserDto } from '../../types';
import { useVehicle } from '../../context/VehicleContext';

interface AdminTabProps {
  onShowToast: (msg: string, type?: 'error' | 'success' | 'info') => void;
}

export const AdminTab: React.FC<AdminTabProps> = ({ onShowToast }) => {
  const { accessoriesCatalog, compatibilityRules, refreshCatalog } = useVehicle();

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemUsers, setSystemUsers] = useState<SystemUserDto[]>([]);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [logFilter, setLogFilter] = useState<string>('');

  // New Accessory Form State (CU08)
  const [accNombre, setAccNombre] = useState<string>('');
  const [accCategoria, setAccCategoria] = useState<string>('Suspensión');
  const [accDescripcion, setAccDescripcion] = useState<string>('');
  const [creatingAcc, setCreatingAcc] = useState<boolean>(false);

  // New Compatibility Rule Form State (CU08)
  const [ruleOrigenId, setRuleOrigenId] = useState<string>('');
  const [ruleDestinoId, setRuleDestinoId] = useState<string>('');
  const [ruleTipo, setRuleTipo] = useState<string>('0'); // 0 = Requisito, 1 = Incompatibilidad
  const [creatingRule, setCreatingRule] = useState<boolean>(false);

  const fetchAdminData = async () => {
    setLoadingLogs(true);
    try {
      const [logs, users] = await Promise.all([
        apiCall<AuditLog[]>('/audit'),
        apiCall<SystemUserDto[]>('/audit/users').catch(() => [] as SystemUserDto[]),
      ]);
      setAuditLogs(Array.isArray(logs) ? logs : []);
      setSystemUsers(Array.isArray(users) ? users : []);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      onShowToast('Error al cargar datos de auditoría', 'error');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleCreateAccessory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accNombre.trim()) return;

    setCreatingAcc(true);
    try {
      await apiCall('/accesorios', 'POST', {
        nombre: accNombre.trim(),
        categoria: accCategoria,
        descripcion: accDescripcion.trim() || 'Componente técnico off-road homologado',
        precio: 0,
      });
      setAccNombre('');
      setAccDescripcion('');
      await Promise.all([refreshCatalog(), fetchAdminData()]);
      onShowToast('Nueva ficha técnica de accesorio indexada en el catálogo', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Error al crear accesorio', 'error');
    } finally {
      setCreatingAcc(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleOrigenId || !ruleDestinoId) return;
    if (ruleOrigenId === ruleDestinoId) {
      onShowToast('Seleccione dos componentes distintos para la regla', 'error');
      return;
    }

    setCreatingRule(true);
    try {
      await apiCall('/accesorios/rules', 'POST', {
        componenteOrigenId: parseInt(ruleOrigenId),
        componenteDestinoId: parseInt(ruleDestinoId),
        tipo: parseInt(ruleTipo),
      });
      setRuleOrigenId('');
      setRuleDestinoId('');
      await Promise.all([refreshCatalog(), fetchAdminData()]);
      onShowToast('Regla mecánica agregada al motor de compatibilidad', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Error al crear regla de compatibilidad', 'error');
    } finally {
      setCreatingRule(false);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    try {
      await apiCall(`/accesorios/rules/${ruleId}`, 'DELETE');
      await Promise.all([refreshCatalog(), fetchAdminData()]);
      onShowToast('Regla de compatibilidad eliminada', 'info');
    } catch (err: any) {
      onShowToast(err.message || 'Error al eliminar regla', 'error');
    }
  };

  const filteredLogs = auditLogs.filter((l) => {
    if (!logFilter.trim()) return true;
    const q = logFilter.toLowerCase();
    return (
      l.EntityName.toLowerCase().includes(q) ||
      l.Action.toLowerCase().includes(q) ||
      l.Username.toLowerCase().includes(q) ||
      (l.NewValues && l.NewValues.toLowerCase().includes(q))
    );
  });

  return (
    <div className="layout-grid-admin">
      {/* Column 1: Users Matrix & CU08 Knowledge Base Management */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Users & Roles Matrix */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="panel-header" style={{ marginBottom: 0 }}>
            <div className="panel-title">
              <Users size={20} color="var(--accent-color)" />
              <span>Matriz de Usuarios y Roles (SQL Server)</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {systemUsers.length} cuentas activas
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '0.75rem' }}>Usuario</th>
                  <th style={{ padding: '0.75rem' }}>Email</th>
                  <th style={{ padding: '0.75rem' }}>Rol</th>
                  <th style={{ padding: '0.75rem' }}>Operaciones Auditadas</th>
                  <th style={{ padding: '0.75rem' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {systemUsers.map((u) => {
                  const isAdmin = u.Role.toLowerCase().includes('admin');
                  return (
                    <tr key={u.Id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600, color: '#fff' }}>{u.Username}</td>
                      <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)' }}>{u.Email}</td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <span
                          style={{
                            background: isAdmin ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)',
                            color: isAdmin ? 'var(--danger-color)' : '#3b82f6',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          {u.Role}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: '#fff' }}>{u.ActionsCount} eventos</td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <span style={{ color: 'var(--success-color)', fontWeight: 600, fontSize: '0.75rem' }}>
                          {u.Status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* CU08: Cargar Fichas Técnicas y Reglas de Negocio */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="panel-header" style={{ marginBottom: 0 }}>
            <div className="panel-title">
              <Wrench size={18} color="var(--accent-color)" />
              <span>CU08 - Base de Conocimientos: Catálogo y Reglas Mecánicas</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {accessoriesCatalog.length} partes • {compatibilityRules.length} reglas
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {/* Form 1: New Accessory Datasheet */}
            <form
              onSubmit={handleCreateAccessory}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--card-border)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Plus size={15} color="var(--accent-color)" />
                <span>Nueva Ficha Técnica de Accesorio</span>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Nombre del Componente</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder='Ej: Bloqueo Diferencial ARB Air Locker'
                  value={accNombre}
                  onChange={(e) => setAccNombre(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Categoría Técnica</label>
                <select
                  className="form-select"
                  value={accCategoria}
                  onChange={(e) => setAccCategoria(e.target.value)}
                >
                  <option value="Suspensión">Suspensión</option>
                  <option value="Neumático">Neumático</option>
                  <option value="Paragolpes">Paragolpes / Bumper</option>
                  <option value="Rescate">Rescate / Winch</option>
                  <option value="Motor">Motor / Admisión</option>
                  <option value="Iluminación">Iluminación</option>
                  <option value="Transmisión">Transmisión / Bloqueos</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Especificación / Datasheet</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Requiere compresor 12V de alta presión"
                  value={accDescripcion}
                  onChange={(e) => setAccDescripcion(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={creatingAcc} style={{ marginTop: 'auto' }}>
                <Plus size={15} />
                <span>{creatingAcc ? 'Indexando...' : 'Indexar en Catálogo'}</span>
              </button>
            </form>

            {/* Form 2: New Compatibility Rule */}
            <form
              onSubmit={handleCreateRule}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--card-border)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <GitBranch size={15} color="var(--accent-color)" />
                <span>Nueva Regla de Compatibilidad</span>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Si el usuario equipa (Origen):</label>
                <select
                  className="form-select"
                  required
                  value={ruleOrigenId}
                  onChange={(e) => setRuleOrigenId(e.target.value)}
                >
                  <option value="">-- Seleccione Origen --</option>
                  {accessoriesCatalog.map((a) => (
                    <option key={a.Id} value={a.Id}>
                      [{a.Categoria}] {a.Nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tipo de Restricción:</label>
                <select
                  className="form-select"
                  value={ruleTipo}
                  onChange={(e) => setRuleTipo(e.target.value)}
                >
                  <option value="0">🔗 Requisito Obligatorio (Exige tener instalado)</option>
                  <option value="1">🚫 Incompatibilidad Física (Bloquea combinación)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Componente Afectado (Destino):</label>
                <select
                  className="form-select"
                  required
                  value={ruleDestinoId}
                  onChange={(e) => setRuleDestinoId(e.target.value)}
                >
                  <option value="">-- Seleccione Destino --</option>
                  {accessoriesCatalog.map((a) => (
                    <option key={a.Id} value={a.Id}>
                      [{a.Categoria}] {a.Nombre}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn-secondary" disabled={creatingRule} style={{ marginTop: 'auto' }}>
                <GitBranch size={15} />
                <span>{creatingRule ? 'Guardando...' : 'Agregar Regla al Motor'}</span>
              </button>
            </form>
          </div>

          {/* Active Rules List */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Reglas Activas en el Motor ({compatibilityRules.length}):
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {compatibilityRules.map((r) => {
                const isReq = r.Tipo === 'Requisito' || r.Tipo === '0';
                return (
                  <div
                    key={r.Id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--card-border)',
                      borderRadius: '8px',
                      padding: '0.55rem 0.85rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8rem',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <strong style={{ color: '#fff' }}>{r.ComponenteOrigenNombre}</strong>{' '}
                      <span
                        style={{
                          color: isReq ? 'var(--warning-color)' : 'var(--danger-color)',
                          fontWeight: 700,
                          margin: '0 0.35rem',
                        }}
                      >
                        {isReq ? '➔ REQUIERE ➔' : '➔ INCOMPATIBLE CON ➔'}
                      </span>{' '}
                      <strong style={{ color: '#fff' }}>{r.ComponenteDestinoNombre}</strong>
                    </div>
                    <button
                      type="button"
                      className="btn-danger-icon"
                      onClick={() => handleDeleteRule(r.Id)}
                      title="Eliminar regla"
                      style={{ padding: '0.25rem 0.4rem' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Column 2: Audit Logs */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content' }}>
        <div className="panel-header" style={{ marginBottom: 0 }}>
          <div className="panel-title">
            <History size={18} color="var(--accent-color)" />
            <span>Trazabilidad / Auditoría</span>
          </div>
          <button
            onClick={fetchAdminData}
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

        {/* Filter input for logs */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Filtrar por entidad, usuario o acción..."
            value={logFilter}
            onChange={(e) => setLogFilter(e.target.value)}
            style={{ paddingLeft: '2.1rem', fontSize: '0.8rem', paddingBlock: '0.45rem' }}
          />
          <Search
            size={14}
            color="var(--text-secondary)"
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '600px', overflowY: 'auto' }}>
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              No hay eventos de auditoría que coincidan.
            </div>
          ) : (
            filteredLogs.map((log) => {
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
