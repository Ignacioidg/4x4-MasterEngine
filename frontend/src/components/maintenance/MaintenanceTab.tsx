import React, { useState } from 'react';
import {
  Activity,
  Compass,
  Mountain,
  Send,
  ShoppingBag,
  Wrench,
  Trash2,
  History,
  Car,
  CheckCircle2,
} from 'lucide-react';
import { useVehicle } from '../../context/VehicleContext';

interface MaintenanceTabProps {
  onShowToast: (msg: string, type?: 'error' | 'success' | 'info') => void;
}

const TERRAIN_INFO: Record<number, { label: string; icon: string; coeff: number; color: string }> = {
  1: { label: 'Asfalto', icon: '🛣️', coeff: 1.0, color: '#3b82f6' },
  3: { label: 'Arena / Médanos', icon: '🏖️', coeff: 1.5, color: '#eab308' },
  2: { label: 'Barro / Off-Road', icon: '🌧️', coeff: 2.0, color: '#f97316' },
  4: { label: 'Piedra / Extremo', icon: '🪨', coeff: 2.5, color: '#ef4444' },
};

export const MaintenanceTab: React.FC<MaintenanceTabProps> = ({ onShowToast }) => {
  const {
    vehicles,
    activeVehicle,
    selectVehicle,
    logRoute,
    deleteRoute,
    resetComponentWear,
    navigateToStore,
  } = useVehicle();

  const [kilometros, setKilometros] = useState<string>('');
  const [terreno, setTerreno] = useState<string>('1');
  const [logging, setLogging] = useState<boolean>(false);
  const [resettingId, setResettingId] = useState<number | null>(null);
  const [deletingRouteId, setDeletingRouteId] = useState<number | null>(null);

  if (vehicles.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
        <Compass size={48} style={{ opacity: 0.3, marginBottom: '1rem', color: 'var(--accent-color)' }} />
        <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No tenés vehículos registrados</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Registrá un vehículo en el Dashboard para monitorear su desgaste mecánico y cargar travesías.
        </p>
      </div>
    );
  }

  const handleLogRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kilometros || parseFloat(kilometros) <= 0) {
      onShowToast('Ingrese un kilometraje válido mayor a 0', 'error');
      return;
    }

    setLogging(true);
    try {
      await logRoute(parseFloat(kilometros), parseInt(terreno));
      setKilometros('');
      onShowToast('¡Trayecto registrado, odómetro y desgaste predictivo actualizados!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Error al registrar trayecto', 'error');
    } finally {
      setLogging(false);
    }
  };

  const handleResetWear = async (compId: number, compNombre: string) => {
    setResettingId(compId);
    try {
      await resetComponentWear(compId);
      onShowToast(`Service registrado: '${compNombre}' restaurado al 100% de vida útil (0% desgaste)`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Error al registrar service del componente', 'error');
    } finally {
      setResettingId(null);
    }
  };

  const handleDeleteRoute = async (trayectoId: number, km: number) => {
    setDeletingRouteId(trayectoId);
    try {
      await deleteRoute(trayectoId);
      onShowToast(`Trayecto de ${km} km eliminado y desgaste revertido`, 'info');
    } catch (err: any) {
      onShowToast(err.message || 'Error al eliminar trayecto', 'error');
    } finally {
      setDeletingRouteId(null);
    }
  };

  const components = activeVehicle?.ComponentesDesgaste || [];
  const trayectos = [...(activeVehicle?.Trayectos || [])].sort(
    (a, b) => new Date(b.Fecha).getTime() - new Date(a.Fecha).getTime()
  );

  const previewKm = parseFloat(kilometros) || 0;
  const selectedTerrainMeta = TERRAIN_INFO[parseInt(terreno)] || TERRAIN_INFO[1];
  const previewEquivKm = previewKm * selectedTerrainMeta.coeff;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Vehicle Switcher Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Car size={18} color="var(--accent-color)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
              Monitoreando Telemetría de:
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {vehicles.map((v) => {
              const isSelected = activeVehicle?.Id === v.Id;
              return (
                <button
                  key={v.Id}
                  onClick={() => selectVehicle(v.Id)}
                  style={{
                    background: isSelected ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#fff' : 'var(--text-secondary)',
                    border: isSelected ? '1px solid var(--accent-color)' : '1px solid var(--card-border)',
                    borderRadius: '8px',
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.8rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span>{v.Marca} {v.Modelo}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.85 }}>
                    ({v.KilometrajeActual?.toLocaleString() || 0} km)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeVehicle && (
        <div className="layout-grid-maintenance">
          {/* Column 1: Wear Components & Route History */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Wear Components Panel */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="panel-header" style={{ marginBottom: 0 }}>
                <div>
                  <div className="panel-title">
                    <Activity size={20} color="var(--accent-color)" />
                    <span>Desgaste Predictivo de Componentes ({activeVehicle.Marca} {activeVehicle.Modelo})</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Odómetro actual: <strong style={{ color: '#fff' }}>{activeVehicle.KilometrajeActual.toLocaleString()} km</strong> • Umbral de alerta preventiva: ≥ 80%
                  </p>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: 'var(--primary-blue)',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    fontWeight: 600,
                  }}
                >
                  Fórmula Severa 4ME
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {components.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No hay componentes de desgaste registrados.
                  </div>
                ) : (
                  components.map((comp) => {
                    const pct = comp.DesgasteAcumulado;
                    const isCritical = pct >= 80.0;
                    const remainingEquivKm = Math.max(0, comp.VidaUtilKmEquivalentes - comp.KilometrosSeverosAcumulados);

                    let barColor = 'var(--success-color)';
                    if (pct >= 80.0) barColor = 'var(--danger-color)';
                    else if (pct >= 50.0) barColor = 'var(--warning-color)';

                    return (
                      <div
                        key={comp.Id}
                        style={{
                          background: isCritical ? 'rgba(239, 68, 68, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                          border: isCritical ? '1px solid var(--danger-color)' : '1px solid var(--card-border)',
                          borderRadius: '12px',
                          padding: '1.15rem 1.25rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{comp.Nombre}</span>
                          <span
                            style={{
                              fontSize: '0.95rem',
                              fontWeight: 700,
                              color: barColor,
                            }}
                          >
                            {pct.toFixed(1)}% {isCritical ? '⚠️ REEMPLAZO REQUERIDO' : ''}
                          </span>
                        </div>

                        {/* Progress bar container */}
                        <div
                          style={{
                            width: '100%',
                            height: '8px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            marginBottom: '0.65rem',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(pct, 100)}%`,
                              height: '100%',
                              backgroundColor: barColor,
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <span>
                              Km Severos: <strong style={{ color: '#fff' }}>{comp.KilometrosSeverosAcumulados.toFixed(0)} km</strong>
                            </span>
                            <span>
                              Vida Útil: <strong>{comp.VidaUtilKmEquivalentes.toFixed(0)} km</strong>
                            </span>
                            <span>
                              Autonomía Restante: <strong style={{ color: isCritical ? 'var(--danger-color)' : 'var(--success-color)' }}>{remainingEquivKm.toFixed(0)} km eq.</strong>
                            </span>
                          </div>

                          {/* Component Actions: Service Reset & ML Store */}
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {isCritical && (
                              <button
                                type="button"
                                className="btn-secondary"
                                onClick={() =>
                                  navigateToStore(`${comp.Nombre} ${activeVehicle.Marca} ${activeVehicle.Modelo}`)
                                }
                                style={{
                                  padding: '0.3rem 0.65rem',
                                  fontSize: '0.73rem',
                                  background: 'rgba(250, 204, 21, 0.12)',
                                  borderColor: 'rgba(250, 204, 21, 0.35)',
                                  color: '#facc15',
                                }}
                              >
                                <ShoppingBag size={12} />
                                <span>Comprar Reemplazo</span>
                              </button>
                            )}

                            {pct > 0 && (
                              <button
                                type="button"
                                className="btn-secondary"
                                disabled={resettingId === comp.Id}
                                onClick={() => handleResetWear(comp.Id, comp.Nombre)}
                                style={{
                                  padding: '0.3rem 0.65rem',
                                  fontSize: '0.73rem',
                                  borderColor: 'rgba(34, 197, 94, 0.35)',
                                  color: 'var(--success-color)',
                                }}
                                title="Registrar cambio físico de la pieza y reiniciar desgaste a 0%"
                              >
                                <Wrench size={12} />
                                <span>{resettingId === comp.Id ? 'Reiniciando...' : 'Registrar Service (0%)'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Route History Panel (CU06 & CU06.3) */}
            <div className="glass-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <History size={18} color="var(--accent-color)" />
                  <span>Historial de Trayectos y Travesías ({trayectos.length})</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  CU06 - Trazabilidad de Odómetro
                </span>
              </div>

              {trayectos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Todavía no registraste ningún trayecto para {activeVehicle.Marca} {activeVehicle.Modelo}.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '340px', overflowY: 'auto' }}>
                  {trayectos.map((t) => {
                    const sueloCode = t.Suelo ?? t.TipoSuelo ?? 1;
                    const meta = TERRAIN_INFO[sueloCode] || TERRAIN_INFO[1];
                    const equivKm = t.Kilometros * meta.coeff;
                    const fechaStr = new Date(t.Fecha).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={t.Id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--card-border)',
                          borderRadius: '10px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.75rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '1.35rem' }}>{meta.icon}</span>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <strong style={{ color: '#fff', fontSize: '0.9rem' }}>
                                +{t.Kilometros.toLocaleString()} km reales
                              </strong>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  color: meta.color,
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                }}
                              >
                                {meta.label} ({meta.coeff}x)
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                              Impacto mecánico: <strong style={{ color: 'var(--accent-color)' }}>{equivKm.toFixed(0)} km equivalentes</strong> • {fechaStr}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="btn-danger-icon"
                          disabled={deletingRouteId === t.Id}
                          onClick={() => handleDeleteRoute(t.Id, t.Kilometros)}
                          title="Eliminar trayecto y revertir desgaste (CU06.3)"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Log Route Form */}
          <div className="glass-panel" style={{ height: 'fit-content' }}>
            <div className="panel-header">
              <div className="panel-title">
                <Mountain size={18} color="var(--accent-color)" />
                <span>Ingresar Ruta Realizada</span>
              </div>
            </div>

            <form onSubmit={handleLogRoute} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="routeKm">
                  Kilómetros Recorridos (Reales)
                </label>
                <input
                  id="routeKm"
                  type="number"
                  min="1"
                  step="any"
                  className="form-input"
                  required
                  placeholder="Ej: 150"
                  value={kilometros}
                  onChange={(e) => setKilometros(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="routeTerrain">
                  Tipo de Terreno (Severidad)
                </label>
                <select
                  id="routeTerrain"
                  className="form-select"
                  required
                  value={terreno}
                  onChange={(e) => setTerreno(e.target.value)}
                >
                  <option value="1">🛣️ Asfalto / Ruta (Coeficiente: 1.0x)</option>
                  <option value="3">🏖️ Arena / Médanos (Coeficiente: 1.5x)</option>
                  <option value="2">🌧️ Barro / Huella (Coeficiente: 2.0x)</option>
                  <option value="4">🪨 Piedra / Roca Extrema (Coeficiente: 2.5x)</option>
                </select>
              </div>

              {previewKm > 0 && (
                <div
                  style={{
                    background: 'rgba(249, 115, 22, 0.08)',
                    border: '1px solid rgba(249, 115, 22, 0.25)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    fontSize: '0.8rem',
                  }}
                >
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    Vista Previa de Impacto Severo:
                  </div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                    {previewKm} km × {selectedTerrainMeta.coeff} ={' '}
                    <span style={{ color: 'var(--accent-color)' }}>{previewEquivKm.toFixed(0)} km equivalentes</span>
                  </div>
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={logging} style={{ width: '100%', marginTop: '0.25rem' }}>
                <Send size={16} />
                <span>{logging ? 'Calculando...' : 'Registrar Trayecto'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
