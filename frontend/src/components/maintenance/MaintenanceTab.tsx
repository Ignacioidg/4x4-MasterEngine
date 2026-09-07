import React, { useState } from 'react';
import { Activity, Compass, Mountain, Send } from 'lucide-react';
import { useVehicle } from '../../context/VehicleContext';

interface MaintenanceTabProps {
  onShowToast: (msg: string, type?: 'error' | 'success' | 'info') => void;
}

export const MaintenanceTab: React.FC<MaintenanceTabProps> = ({ onShowToast }) => {
  const { activeVehicle, logRoute } = useVehicle();
  const [kilometros, setKilometros] = useState<string>('');
  const [terreno, setTerreno] = useState<string>('1');
  const [logging, setLogging] = useState<boolean>(false);

  if (!activeVehicle) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
        <Compass size={48} style={{ opacity: 0.3, marginBottom: '1rem', color: 'var(--accent-color)' }} />
        <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Seleccione un Vehículo</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Seleccione un vehículo para consultar su desgaste mecánico o ingresar nuevas rutas.
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
      onShowToast('¡Trayecto registrado y desgaste predictivo actualizado!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Error al registrar trayecto', 'error');
    } finally {
      setLogging(false);
    }
  };

  const components = activeVehicle.ComponentesDesgaste || [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
      {/* Column 1: Wear Components */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="panel-header">
          <div>
            <div className="panel-title">
              <Activity size={20} color="var(--accent-color)" />
              <span>Desgaste Predictivo de Componentes</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Telemetría calculada según severidad de terreno acumulada
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
              const isCritical = pct >= 90.0;

              let barColor = 'var(--success-color)';
              if (pct >= 80.0) barColor = 'var(--danger-color)';
              else if (pct >= 50.0) barColor = 'var(--warning-color)';

              return (
                <div
                  key={comp.Id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: isCritical ? '1px solid var(--danger-color)' : '1px solid var(--card-border)',
                    borderRadius: '12px',
                    padding: '1.15rem 1.25rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{comp.Nombre}</span>
                    <span
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        color: barColor,
                      }}
                    >
                      {pct.toFixed(1)}% {isCritical ? '⚠️ REEMPLAZO' : ''}
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span>Km Severos Acumulados: <strong style={{ color: '#fff' }}>{comp.KilometrosSeverosAcumulados.toFixed(0)} km</strong></span>
                    <span>Vida Útil Estimada: {comp.VidaUtilKmEquivalentes.toFixed(0)} km</span>
                  </div>
                </div>
              );
            })
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
              Kilómetros Recorridos
            </label>
            <input
              id="routeKm"
              type="number"
              min="1"
              step="any"
              className="form-input"
              required
              placeholder="Ej: 120"
              value={kilometros}
              onChange={(e) => setKilometros(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="routeTerrain">
              Tipo de Terreno (Coeficiente)
            </label>
            <select
              id="routeTerrain"
              className="form-select"
              required
              value={terreno}
              onChange={(e) => setTerreno(e.target.value)}
            >
              <option value="1">🛣️ Asfalto (Coeficiente: 1.0)</option>
              <option value="3">🏖️ Arena / Médanos (Coeficiente: 1.5)</option>
              <option value="2">🌧️ Barro / Off-Road (Coeficiente: 2.0)</option>
              <option value="4">🪨 Piedra / Extremo (Coeficiente: 2.5)</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={logging} style={{ width: '100%', marginTop: '0.5rem' }}>
            <Send size={16} />
            <span>{logging ? 'Calculando...' : 'Registrar Trayecto'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
