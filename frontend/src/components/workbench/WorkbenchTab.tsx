import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Check,
  Package,
  Plus,
  Trash2,
  Wrench,
  ShoppingBag,
  Pencil,
  Car,
  Layers,
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useVehicle } from '../../context/VehicleContext';
import { VehiculoBuild } from '../../types';

interface WorkbenchTabProps {
  onShowToast: (msg: string, type?: 'error' | 'success' | 'info') => void;
}

export const WorkbenchTab: React.FC<WorkbenchTabProps> = ({ onShowToast }) => {
  const {
    vehicles,
    activeVehicle,
    selectVehicle,
    accessoriesCatalog,
    compatibilityRules,
    savedBuilds,
    equipAccessory,
    unequipAccessory,
    saveBuild,
    loadBuild,
    renameBuild,
    deleteBuild,
    fetchAllBuilds,
    navigateToStore,
  } = useVehicle();

  const [selectedAccessoryId, setSelectedAccessoryId] = useState<string>('');
  const [buildName, setBuildName] = useState<string>('');
  const [equipping, setEquipping] = useState<boolean>(false);
  const [savingBuild, setSavingBuild] = useState<boolean>(false);
  const [loadingBuildId, setLoadingBuildId] = useState<number | null>(null);
  const [confirmDeleteBuildId, setConfirmDeleteBuildId] = useState<number | null>(null);

  // All builds filter state
  const [showAllBuilds, setShowAllBuilds] = useState<boolean>(false);
  const [allBuildsList, setAllBuildsList] = useState<VehiculoBuild[]>([]);

  // Rename inline state
  const [editingBuildId, setEditingBuildId] = useState<number | null>(null);
  const [editingBuildName, setEditingBuildName] = useState<string>('');

  useEffect(() => {
    if (showAllBuilds) {
      loadAll();
    }
  }, [showAllBuilds]);

  const loadAll = async () => {
    try {
      const data = await fetchAllBuilds();
      setAllBuildsList(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (vehicles.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
        <Wrench size={48} style={{ opacity: 0.3, marginBottom: '1rem', color: 'var(--accent-color)' }} />
        <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No tenés camionetas registradas</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Para armar proyectos y probar compatibilidad de partes mecánicas, primero registrá un vehículo en el Dashboard.
        </p>
      </div>
    );
  }

  const handleEquip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccessoryId || !activeVehicle) return;

    setEquipping(true);
    try {
      await equipAccessory(parseInt(selectedAccessoryId));
      setSelectedAccessoryId('');
      onShowToast('Accesorio equipado y validado por el motor de reglas mecánicas', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Error de compatibilidad mecánica', 'error');
    } finally {
      setEquipping(false);
    }
  };

  const handleUnequip = async (accessoryId: number, nombre: string) => {
    try {
      await unequipAccessory(accessoryId);
      onShowToast(`Accesorio '${nombre}' desequipado`, 'info');
    } catch (err: any) {
      onShowToast(err.message || 'Error al desequipar', 'error');
    }
  };

  const handleSaveBuild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildName.trim() || !activeVehicle) return;

    setSavingBuild(true);
    try {
      await saveBuild(buildName.trim());
      setBuildName('');
      if (showAllBuilds) await loadAll();
      onShowToast('Build guardada exitosamente en SQL Server', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Error al guardar build', 'error');
    } finally {
      setSavingBuild(false);
    }
  };

  const handleLoadBuild = async (buildId: number, nombre: string) => {
    if (!activeVehicle) return;

    setLoadingBuildId(buildId);
    try {
      await loadBuild(buildId);
      onShowToast(`Build '${nombre}' aplicada en ${activeVehicle.Marca} ${activeVehicle.Modelo}`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Error al cargar build', 'error');
    } finally {
      setLoadingBuildId(null);
    }
  };

  const handleRenameSubmit = async (buildId: number) => {
    if (!editingBuildName.trim()) return;

    try {
      await renameBuild(buildId, editingBuildName.trim());
      setEditingBuildId(null);
      if (showAllBuilds) await loadAll();
      onShowToast('Nombre de la build actualizado', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Error al renombrar build', 'error');
    }
  };

  const handleDeleteBuild = async (buildId: number) => {
    try {
      await deleteBuild(buildId);
      setConfirmDeleteBuildId(null);
      if (showAllBuilds) await loadAll();
      onShowToast('Build eliminada', 'info');
    } catch (err: any) {
      onShowToast(err.message || 'Error al eliminar build', 'error');
    }
  };

  const handleSearchInStore = (accessoryName: string) => {
    const query = activeVehicle
      ? `${accessoryName} ${activeVehicle.Marca} ${activeVehicle.Modelo}`
      : accessoryName;
    navigateToStore(query);
  };

  const equipped = activeVehicle?.AccesoriosEquipados || [];
  const equippedIds = new Set(equipped.map((a) => a.Id));
  const displayedBuilds = showAllBuilds ? allBuildsList : savedBuilds;

  // Evaluate rules for currently selected accessory in dropdown
  const selectedIdNum = parseInt(selectedAccessoryId) || 0;
  const selectedAccObj = accessoriesCatalog.find((a) => a.Id === selectedIdNum);
  const relevantRules = compatibilityRules.filter(
    (r) => r.ComponenteOrigenId === selectedIdNum || r.ComponenteDestinoId === selectedIdNum
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner: Vehicle Selection Switcher */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Car size={18} color="var(--accent-color)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
              Vehículo en Trabajo:
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
                  <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>({v.Patente})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {!activeVehicle ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <Car size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Seleccioná una camioneta arriba</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Hacé clic en cualquiera de tus vehículos en la barra superior para ver y armar sus builds.
          </p>
        </div>
      ) : (
        <>
          {/* Main Workbench Grid: Catalog & Current Setup */}
          <div className="layout-grid-workbench">
            {/* Column 1: Equipped Accessories & Vehicle Status */}
            <div className="glass-panel">
              <div className="panel-header">
                <div className="panel-title">
                  <Package size={18} color="var(--accent-color)" />
                  <span>Configuración Actual de {activeVehicle.Marca} {activeVehicle.Modelo}</span>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    background: 'rgba(249, 115, 22, 0.1)',
                    color: 'var(--accent-color)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '12px',
                    fontWeight: 700,
                  }}
                >
                  {equipped.length} partes instaladas
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', minHeight: '180px' }}>
                {equipped.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-secondary)' }}>
                    <Package size={36} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                    <p style={{ fontSize: '0.85rem' }}>Esta camioneta está con configuración de fábrica (stock).</p>
                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Seleccioná accesorios a la derecha para equiparla.</span>
                  </div>
                ) : (
                  equipped.map((acc) => (
                    <div
                      key={acc.Id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '10px',
                        padding: '0.85rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span
                            style={{
                              fontSize: '0.65rem',
                              background: 'rgba(255, 255, 255, 0.08)',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              color: 'var(--accent-color)',
                              fontWeight: 600,
                            }}
                          >
                            {acc.Categoria}
                          </span>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', margin: 0 }}>
                            {acc.Nombre}
                          </h4>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                          {acc.Descripcion}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                        <button
                          className="btn-secondary"
                          onClick={() => handleSearchInStore(acc.Nombre)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            background: 'rgba(255, 230, 0, 0.08)',
                            borderColor: 'rgba(255, 230, 0, 0.3)',
                            color: '#facc15',
                          }}
                          title="Ver opciones de compra en Mercado Libre"
                        >
                          <ShoppingBag size={13} />
                          <span>Buscar en Tienda</span>
                        </button>

                        <button
                          className="btn-danger-icon"
                          onClick={() => handleUnequip(acc.Id, acc.Nombre)}
                          style={{ padding: '0.35rem 0.5rem' }}
                          title="Desinstalar parte"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Column 2: Accessory Installation & Build Saver */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <Plus size={18} color="var(--accent-color)" />
                    <span>Instalar Accesorio / Parte</span>
                  </div>
                </div>

                <form onSubmit={handleEquip} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" htmlFor="accSelect">
                      Catálogo de Componentes 4x4
                    </label>
                    <select
                      id="accSelect"
                      className="form-select"
                      required
                      value={selectedAccessoryId}
                      onChange={(e) => setSelectedAccessoryId(e.target.value)}
                    >
                      <option value="">-- Seleccione una parte --</option>
                      {accessoriesCatalog.map((acc) => {
                        const alreadyEquipped = equippedIds.has(acc.Id);
                        return (
                          <option key={acc.Id} value={acc.Id} disabled={alreadyEquipped}>
                            [{acc.Categoria}] {acc.Nombre} {alreadyEquipped ? '(Ya instalado)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Live Datasheet & Compatibility Preview */}
                  {selectedAccObj && (
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '10px',
                        padding: '0.85rem',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>
                        📋 Ficha Técnica: {selectedAccObj.Nombre}
                      </div>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '0.6rem', fontSize: '0.78rem' }}>
                        {selectedAccObj.Descripcion || 'Componente off-road homologado.'}
                      </p>

                      {relevantRules.length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success-color)', fontSize: '0.75rem' }}>
                          <ShieldCheck size={14} />
                          <span>Instalación directa (sin restricciones previas)</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {compatibilityRules
                            .filter((r) => r.ComponenteOrigenId === selectedIdNum)
                            .map((r) => {
                              const isReq = r.Tipo === 'Requisito' || r.Tipo === '0';
                              const targetEquipped = equippedIds.has(r.ComponenteDestinoId);
                              const isOk = isReq ? targetEquipped : !targetEquipped;

                              return (
                                <div
                                  key={r.Id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    fontSize: '0.75rem',
                                    color: isOk ? 'var(--success-color)' : 'var(--warning-color)',
                                  }}
                                >
                                  {isOk ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                                  <span>
                                    {isReq
                                      ? `Requiere: ${r.ComponenteDestinoNombre} ${targetEquipped ? '(Instalado ✓)' : '(Falta instalar)'}`
                                      : `Incompatible con: ${r.ComponenteDestinoNombre} ${targetEquipped ? '(Conflicto activo ✗)' : '(Libre ✓)'}`}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}

                  <button type="submit" className="btn-primary" disabled={equipping || !selectedAccessoryId} style={{ width: '100%' }}>
                    <Plus size={16} />
                    <span>{equipping ? 'Validando compatibilidad...' : 'Equipar en Vehículo'}</span>
                  </button>
                </form>
              </div>

              {/* Save As Build Card */}
              <div className="glass-panel">
                <div className="panel-header">
                  <div className="panel-title">
                    <Bookmark size={18} color="var(--accent-color)" />
                    <span>Guardar Build de Proyecto</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                  Guardá la combinación actual de accesorios como una build permanente para intercambiar configuraciones en cualquier momento.
                </p>

                <form onSubmit={handleSaveBuild} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="Ej: Setup Overland / Travesía"
                    value={buildName}
                    onChange={(e) => setBuildName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn-secondary" disabled={savingBuild || !buildName.trim()} style={{ flexShrink: 0 }}>
                    <Check size={16} />
                    <span>{savingBuild ? 'Guardando...' : 'Guardar'}</span>
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Lower Section: Saved Builds Management */}
          <div className="glass-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Layers size={18} color="var(--accent-color)" />
                <span>
                  {showAllBuilds
                    ? 'Todas las Builds del Garaje'
                    : `Builds Guardadas de ${activeVehicle.Marca} ${activeVehicle.Modelo}`}
                </span>
              </div>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowAllBuilds(!showAllBuilds)}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
              >
                {showAllBuilds ? 'Ver solo de este vehículo' : 'Mostrar todas las builds'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
              {displayedBuilds.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  <Layers size={32} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                  <p style={{ fontSize: '0.85rem' }}>
                    {showAllBuilds
                      ? 'No hay ninguna build registrada en el garaje todavía.'
                      : `No hay builds guardadas para ${activeVehicle.Marca} ${activeVehicle.Modelo}.`}
                  </p>
                </div>
              ) : (
                displayedBuilds.map((b) => {
                  const isRenaming = editingBuildId === b.Id;
                  const isConfirmingDelete = confirmDeleteBuildId === b.Id;
                  const buildAccs = b.Accesorios || [];

                  return (
                    <div
                      key={b.Id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '12px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                      }}
                    >
                      <div>
                        {isRenaming ? (
                          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.5rem' }}>
                            <input
                              type="text"
                              className="form-input"
                              value={editingBuildName}
                              onChange={(e) => setEditingBuildName(e.target.value)}
                              style={{ fontSize: '0.8rem', padding: '0.3rem 0.5rem' }}
                            />
                            <button
                              className="btn-primary"
                              onClick={() => handleRenameSubmit(b.Id)}
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              <Check size={14} />
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={() => setEditingBuildId(null)}
                              style={{ padding: '0.3rem 0.5rem' }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', margin: 0 }}>
                              {b.Nombre}
                            </h4>
                            <button
                              onClick={() => {
                                setEditingBuildId(b.Id);
                                setEditingBuildName(b.Nombre);
                              }}
                              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.2rem' }}
                              title="Renombrar build"
                            >
                              <Pencil size={13} />
                            </button>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', marginBottom: '0.6rem' }}>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              background: 'rgba(249, 115, 22, 0.12)',
                              color: 'var(--accent-color)',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              fontWeight: 600,
                            }}
                          >
                            {b.CantidadAccesorios ?? buildAccs.length} partes
                          </span>

                          {b.Vehiculo && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                              • {b.Vehiculo}
                            </span>
                          )}
                        </div>

                        {/* Accessory Chips inside Build Card */}
                        {buildAccs.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {buildAccs.map((a) => (
                              <span
                                key={a.Id}
                                style={{
                                  fontSize: '0.68rem',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  color: '#e5e7eb',
                                  padding: '0.15rem 0.45rem',
                                  borderRadius: '4px',
                                }}
                              >
                                {a.Nombre}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--card-border)', paddingTop: '0.65rem' }}>
                        {isConfirmingDelete ? (
                          <>
                            <button
                              className="btn-primary"
                              onClick={() => handleDeleteBuild(b.Id)}
                              style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem', background: 'var(--danger-color)' }}
                            >
                              Confirmar Eliminar
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={() => setConfirmDeleteBuildId(null)}
                              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn-primary"
                              onClick={() => handleLoadBuild(b.Id, b.Nombre)}
                              disabled={loadingBuildId === b.Id}
                              style={{ flex: 1, padding: '0.4rem 0.65rem', fontSize: '0.75rem' }}
                            >
                              {loadingBuildId === b.Id ? 'Cargando...' : '📥 Cargar en Vehículo'}
                            </button>

                            <button
                              className="btn-danger-icon"
                              onClick={() => setConfirmDeleteBuildId(b.Id)}
                              style={{ padding: '0.4rem 0.5rem' }}
                              title="Eliminar build"
                            >
                              <Trash2 size={15} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
