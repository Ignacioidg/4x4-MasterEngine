import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  Car,
  Calendar,
  Gauge,
  Plus,
  Sparkles,
  Tag,
  Search,
  Pencil,
  Trash2,
  Check,
  X,
  Compass,
  ShoppingBag,
} from 'lucide-react';
import { useVehicle } from '../../context/VehicleContext';
import { apiCall } from '../../services/api';
import { VehicleMake, VehicleModel, VinDecodeResult } from '../../types';

interface DashboardTabProps {
  onShowToast: (msg: string, type?: 'error' | 'success' | 'info') => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ onShowToast }) => {
  const { vehicles, activeVehicle, selectVehicle, createVehicle, updateVehicle, deleteVehicle, navigateToStore } = useVehicle();

  // NHTSA Catalog State
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [selectedMake, setSelectedMake] = useState<string>('');
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [trims, setTrims] = useState<string[]>([]);
  const [selectedTrim, setSelectedTrim] = useState<string>('');
  const [selectedTraccion, setSelectedTraccion] = useState<string>('4WD / 4x4 (Alta y Baja)');
  const [patente, setPatente] = useState<string>('');
  const [kilometrajeInicial, setKilometrajeInicial] = useState<string>('');

  // VIN Lookup State
  const [vinInput, setVinInput] = useState<string>('');
  const [decodingVin, setDecodingVin] = useState<boolean>(false);

  // Loading States
  const [loadingYears, setLoadingYears] = useState<boolean>(false);
  const [loadingMakes, setLoadingMakes] = useState<boolean>(false);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);
  const [loadingTrims, setLoadingTrims] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);

  // Edit Vehicle Modal / State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editPatente, setEditPatente] = useState<string>('');
  const [editKm, setEditKm] = useState<string>('');
  const [editTrimId, setEditTrimId] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Load Years and Makes on Mount
  useEffect(() => {
    const loadInitialCatalog = async () => {
      setLoadingYears(true);
      setLoadingMakes(true);
      try {
        const [yearsData, makesData] = await Promise.all([
          apiCall<number[]>('/catalog/years'),
          apiCall<VehicleMake[]>('/catalog/makes'),
        ]);
        setYears(yearsData);
        setMakes(makesData);
      } catch (err) {
        console.error('Error loading vehicle catalog:', err);
      } finally {
        setLoadingYears(false);
        setLoadingMakes(false);
      }
    };

    loadInitialCatalog();
  }, []);

  // Sync Edit form with active vehicle
  useEffect(() => {
    if (activeVehicle) {
      setEditPatente(activeVehicle.Patente);
      setEditKm(activeVehicle.KilometrajeActual?.toString() || '0');
      setEditTrimId(activeVehicle.TrimId || '');
      setIsEditing(false);
    }
  }, [activeVehicle]);

  // Fetch Models
  const fetchModels = async (year: string, make: string) => {
    if (!year || !make) {
      setModels([]);
      setSelectedModel('');
      setTrims([]);
      setSelectedTrim('');
      return;
    }

    setLoadingModels(true);
    try {
      const data = await apiCall<VehicleModel[]>(
        `/catalog/models?year=${year}&make=${encodeURIComponent(make)}`
      );
      setModels(data);
      setTrims([]);
      setSelectedTrim('');
      if (data.length === 0) {
        onShowToast(`No se encontraron modelos NHTSA para ${make} (${year})`, 'info');
      }
    } catch (err) {
      console.error('Error loading models from NHTSA:', err);
      onShowToast('Error al consultar modelos en vivo desde NHTSA', 'error');
    } finally {
      setLoadingModels(false);
    }
  };

  // Fetch Trims
  const fetchTrims = async (year: string, make: string, model: string) => {
    if (!year || !make || !model) {
      setTrims([]);
      setSelectedTrim('');
      return;
    }

    setLoadingTrims(true);
    try {
      const data = await apiCall<string[]>(
        `/catalog/trims?year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}`
      );
      if (Array.isArray(data) && data.length > 0) {
        setTrims(data);
        setSelectedTrim(data[0]);
      } else {
        const fallback = ['Base / Standard', 'XLT / Mid-Level', 'Limited / Premium', 'Off-Road / Rubicon / Raptor'];
        setTrims(fallback);
        setSelectedTrim(fallback[0]);
      }
    } catch (err) {
      console.warn('Fallback trims used due to API response:', err);
      const fallback = ['Base / Standard', 'XLT / Mid-Level', 'Limited / Premium', 'Off-Road / Rubicon / Raptor'];
      setTrims(fallback);
      setSelectedTrim(fallback[0]);
    } finally {
      setLoadingTrims(false);
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setSelectedModel('');
    setTrims([]);
    setSelectedTrim('');
    if (selectedMake && year) {
      fetchModels(year, selectedMake);
    }
  };

  const handleMakeChange = (make: string) => {
    setSelectedMake(make);
    setSelectedModel('');
    setTrims([]);
    setSelectedTrim('');
    if (selectedYear && make) {
      fetchModels(selectedYear, make);
    }
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    if (selectedYear && selectedMake && model) {
      fetchTrims(selectedYear, selectedMake, model);
    }
  };

  // Decode VIN Search
  const handleDecodeVin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vinInput.trim() || vinInput.trim().length < 11) {
      onShowToast('Ingrese un VIN / Chasis válido (mínimo 11 caracteres)', 'error');
      return;
    }

    setDecodingVin(true);
    try {
      const result = await apiCall<VinDecodeResult>(`/catalog/decode-vin/${vinInput.trim()}`);
      if (result && result.Make) {
        if (result.Year) {
          setSelectedYear(result.Year.toString());
        }

        const matchedMake = makes.find(
          (m) => m.MakeName.toLowerCase() === result.Make.toLowerCase()
        );
        const makeToUse = matchedMake ? matchedMake.MakeName : result.Make;
        setSelectedMake(makeToUse);

        if (result.Year) {
          await fetchModels(result.Year.toString(), makeToUse);
        }

        setSelectedModel(result.Model);

        if (result.Year && result.Model) {
          await fetchTrims(result.Year.toString(), makeToUse, result.Model);
        }

        if (result.Trim) {
          setSelectedTrim(result.Trim);
        }

        if (result.DriveType) {
          if (result.DriveType.toLowerCase().includes('4wd') || result.DriveType.includes('4x4')) {
            setSelectedTraccion('4WD / 4x4 (Alta y Baja)');
          } else if (result.DriveType.toLowerCase().includes('awd')) {
            setSelectedTraccion('AWD (Integral Permanente)');
          } else {
            setSelectedTraccion('4x2 (Tracción Simple)');
          }
        }

        onShowToast(
          `¡VIN decodificado!: ${result.Make} ${result.Model} ${result.Year || ''}`,
          'success'
        );
      }
    } catch (err: any) {
      onShowToast(err.message || 'No se pudo decodificar el VIN', 'error');
    } finally {
      setDecodingVin(false);
    }
  };

  // Submit New Vehicle
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedYear || !selectedMake || !selectedModel || !patente || !kilometrajeInicial) {
      onShowToast('Por favor complete todos los campos obligatorios', 'error');
      return;
    }

    setCreating(true);
    try {
      const fullTrimSpecification = `${selectedTrim || 'Base'} [${selectedTraccion}]`;

      await createVehicle({
        anio: parseInt(selectedYear),
        marca: selectedMake,
        modelo: selectedModel,
        trimId: fullTrimSpecification,
        patente: patente.trim().toUpperCase(),
        kilometrajeInicial: parseFloat(kilometrajeInicial),
      });

      // Reset form
      setSelectedYear('');
      setSelectedMake('');
      setSelectedModel('');
      setTrims([]);
      setSelectedTrim('');
      setPatente('');
      setKilometrajeInicial('');
      setVinInput('');
      onShowToast('¡Vehículo registrado y guardado permanentemente en la base de datos!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Error al registrar el vehículo', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Handle Edit Submit
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeVehicle) return;

    setSavingEdit(true);
    try {
      await updateVehicle(activeVehicle.Id, {
        patente: editPatente.trim().toUpperCase(),
        kilometrajeActual: parseFloat(editKm),
        trimId: editTrimId.trim(),
      });
      setIsEditing(false);
      onShowToast('¡Vehículo actualizado con éxito!', 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Error al actualizar vehículo', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Delete Vehicle
  const handleDeleteVehicle = async () => {
    if (!activeVehicle) return;

    const confirmed = window.confirm(
      `¿Está seguro de que desea eliminar el vehículo '${activeVehicle.Marca} ${activeVehicle.Modelo} (${activeVehicle.Patente})'? Se borrarán todos sus registros asociados.`
    );

    if (!confirmed) return;

    try {
      await deleteVehicle(activeVehicle.Id);
      onShowToast('Vehículo eliminado con éxito', 'info');
    } catch (err: any) {
      onShowToast(err.message || 'Error al eliminar vehículo', 'error');
    }
  };

  // Check critical wear (>= 80%)
  const criticalWearComponents =
    activeVehicle?.ComponentesDesgaste?.filter((c) => c.DesgasteAcumulado >= 80.0) || [];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem' }}>
      {/* Column 1: Vehicle List & Add Vehicle Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Vehicles List */}
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Car size={18} color="var(--accent-color)" />
              <span>Mis Vehículos</span>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                background: 'rgba(255, 255, 255, 0.06)',
                padding: '0.2rem 0.5rem',
                borderRadius: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              {vehicles.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '240px', overflowY: 'auto' }}>
            {vehicles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                No tenés vehículos registrados aún.
              </div>
            ) : (
              vehicles.map((v) => {
                const isSelected = activeVehicle?.Id === v.Id;
                return (
                  <div
                    key={v.Id}
                    onClick={() => selectVehicle(v.Id)}
                    style={{
                      background: isSelected ? 'rgba(249, 115, 22, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '1px solid var(--accent-color)' : '1px solid var(--card-border)',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: isSelected ? 'var(--accent-color)' : '#fff' }}>
                        {v.Marca} {v.Modelo}
                      </h4>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          background: 'rgba(0,0,0,0.3)',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {v.Anio}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                      Patente: <strong style={{ color: '#fff' }}>{v.Patente}</strong> | Km: {v.KilometrajeActual?.toLocaleString() || '0'}
                    </div>
                    {v.TrimId && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--accent-color)', marginTop: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.TrimId}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Add Vehicle (NHTSA vPIC API) */}
        <div className="glass-panel">
          <div className="panel-header">
            <div className="panel-title">
              <Plus size={18} color="var(--accent-color)" />
              <span>Agregar Vehículo</span>
            </div>
            <span
              style={{
                fontSize: '0.65rem',
                background: 'rgba(34, 197, 94, 0.12)',
                color: 'var(--success-color)',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                fontWeight: 700,
              }}
            >
              NHTSA vPIC Live
            </span>
          </div>

          {/* Optional VIN Quick Decoder */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--card-border)',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
              ⚡ Autocompletar con VIN / Chasis (Opcional):
            </span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="17 dígitos de chasis"
                value={vinInput}
                onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={handleDecodeVin}
                disabled={decodingVin}
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.75rem' }}
              >
                <Search size={13} />
                <span>{decodingVin ? '...' : 'Decodificar'}</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateVehicle}>
            {/* Año */}
            <div className="form-group">
              <label className="form-label" htmlFor="vehAnio">
                Año
              </label>
              <select
                id="vehAnio"
                className="form-select"
                required
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                disabled={loadingYears}
              >
                <option value="">{loadingYears ? 'Cargando años...' : '-- Seleccione Año --'}</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Marca (NHTSA 4x4 Curated) */}
            <div className="form-group">
              <label className="form-label" htmlFor="vehMarca">
                Marca
              </label>
              <select
                id="vehMarca"
                className="form-select"
                required
                disabled={loadingMakes}
                value={selectedMake}
                onChange={(e) => handleMakeChange(e.target.value)}
              >
                <option value="">{loadingMakes ? 'Cargando marcas...' : '-- Seleccione Marca --'}</option>
                {makes.map((m) => (
                  <option key={m.MakeId} value={m.MakeName}>
                    {m.MakeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Modelo (NHTSA Real-Time) */}
            <div className="form-group">
              <label className="form-label" htmlFor="vehModelo">
                Modelo (NHTSA Live)
              </label>
              <select
                id="vehModelo"
                className="form-select"
                required
                disabled={!selectedYear || !selectedMake || loadingModels}
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
              >
                <option value="">
                  {loadingModels
                    ? 'Consultando API oficial de NHTSA...'
                    : !selectedYear || !selectedMake
                    ? 'Seleccione Año y Marca primero'
                    : models.length === 0
                    ? 'Sin modelos encontrados'
                    : '-- Seleccione Modelo --'}
                </option>
                {models.map((m, idx) => (
                  <option key={`${m.ModelId}-${idx}`} value={m.ModelName}>
                    {m.ModelName}
                  </option>
                ))}
              </select>
            </div>

            {/* Versión / Trim (NHTSA Specs Dropdown) */}
            <div className="form-group">
              <label className="form-label" htmlFor="vehTrimSelect">
                Versión / Trim (NHTSA)
              </label>
              <select
                id="vehTrimSelect"
                className="form-select"
                required
                disabled={!selectedModel || loadingTrims}
                value={selectedTrim}
                onChange={(e) => setSelectedTrim(e.target.value)}
              >
                <option value="">
                  {loadingTrims
                    ? 'Obteniendo versiones de NHTSA...'
                    : !selectedModel
                    ? 'Seleccione Modelo primero'
                    : '-- Seleccione Versión --'}
                </option>
                {Array.isArray(trims) &&
                  trims.map((t, idx) => (
                    <option key={`${t}-${idx}`} value={t}>
                      {t}
                    </option>
                  ))}
              </select>
            </div>

            {/* Tipo de Tracción (Dropdown Mecánico) */}
            <div className="form-group">
              <label className="form-label" htmlFor="vehTraccion">
                Tipo de Tracción
              </label>
              <select
                id="vehTraccion"
                className="form-select"
                required
                value={selectedTraccion}
                onChange={(e) => setSelectedTraccion(e.target.value)}
              >
                <option value="4WD / 4x4 (Alta y Baja)">🛞 4WD / 4x4 (Part-Time con Reductora)</option>
                <option value="AWD (Integral Permanente)">⚙️ AWD (Tracción Integral Permanente)</option>
                <option value="4x2 Tracción Trasera (RWD)">🚗 4x2 Tracción Trasera (RWD)</option>
                <option value="4x2 Tracción Delantera (FWD)">🚗 4x2 Tracción Delantera (FWD)</option>
              </select>
            </div>

            {/* Patente */}
            <div className="form-group">
              <label className="form-label" htmlFor="vehPatente">
                Patente
              </label>
              <input
                id="vehPatente"
                type="text"
                className="form-input"
                required
                placeholder="Ej: AE987CD"
                value={patente}
                onChange={(e) => setPatente(e.target.value)}
              />
            </div>

            {/* Kilometraje Inicial */}
            <div className="form-group">
              <label className="form-label" htmlFor="vehKilometrajeInicial">
                Kilometraje Inicial (OBLIGATORIO)
              </label>
              <input
                id="vehKilometrajeInicial"
                type="number"
                min="0"
                className="form-input"
                required
                placeholder="Ej: 45000"
                value={kilometrajeInicial}
                onChange={(e) => setKilometrajeInicial(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={creating} style={{ width: '100%', marginTop: '0.5rem' }}>
              <Plus size={16} />
              <span>{creating ? 'Registrando...' : 'Guardar Vehículo'}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Column 2: Selected Vehicle Overview & Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ minHeight: '400px' }}>
          {activeVehicle ? (
            <div className="animate-fade-in">
              {/* Header with Title & Edit/Delete Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  borderBottom: '1px solid var(--card-border)',
                  paddingBottom: '1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>🛞</span>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff' }}>
                      {activeVehicle.Marca} {activeVehicle.Modelo}
                    </h2>
                  </div>

                  {/* Hard vehicle info compact line */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={14} color="var(--accent-color)" />
                      Año: <strong style={{ color: '#fff' }}>{activeVehicle.Anio}</strong>
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Tag size={14} color="var(--accent-color)" />
                      Patente: <strong style={{ color: '#fff' }}>{activeVehicle.Patente}</strong>
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Gauge size={14} color="var(--accent-color)" />
                      Km Actual: <strong style={{ color: '#fff' }}>{activeVehicle.KilometrajeActual?.toLocaleString() || '0'} km</strong>
                    </span>
                  </div>

                  {activeVehicle.TrimId && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: 600, marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Compass size={14} />
                      <span>{activeVehicle.TrimId}</span>
                    </div>
                  )}
                </div>

                {/* Right Header: Badges & Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn-secondary"
                      onClick={() => setIsEditing(!isEditing)}
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Editar vehículo"
                    >
                      <Pencil size={14} />
                      <span>{isEditing ? 'Cancelar' : 'Editar'}</span>
                    </button>

                    <button
                      className="btn-danger-icon"
                      onClick={handleDeleteVehicle}
                      style={{ padding: '0.4rem 0.6rem' }}
                      title="Eliminar vehículo"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div
                    style={{
                      background: 'rgba(249, 115, 22, 0.1)',
                      border: '1px solid rgba(249, 115, 22, 0.25)',
                      borderRadius: '8px',
                      padding: '0.35rem 0.75rem',
                      textAlign: 'right',
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Accesorios: <strong style={{ color: 'var(--accent-color)' }}>{activeVehicle.AccesoriosEquipados?.length || 0}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Inline Edit Form Modal / Panel */}
              {isEditing && (
                <div
                  style={{
                    background: 'rgba(249, 115, 22, 0.05)',
                    border: '1px solid var(--accent-color)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    marginBottom: '1.5rem',
                  }}
                  className="animate-fade-in"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Pencil size={15} color="var(--accent-color)" />
                      <span>Modificar Datos de la Camioneta</span>
                    </h4>
                    <button
                      onClick={() => setIsEditing(false)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" htmlFor="editPat">Patente</label>
                      <input
                        id="editPat"
                        type="text"
                        className="form-input"
                        required
                        value={editPatente}
                        onChange={(e) => setEditPatente(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" htmlFor="editKmVal">Kilometraje Actual</label>
                      <input
                        id="editKmVal"
                        type="number"
                        min="0"
                        className="form-input"
                        required
                        value={editKm}
                        onChange={(e) => setEditKm(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" htmlFor="editTrim">Versión / Tracción</label>
                      <input
                        id="editTrim"
                        type="text"
                        className="form-input"
                        placeholder="Ej: Rubicon [4x4]"
                        value={editTrimId}
                        onChange={(e) => setEditTrimId(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={savingEdit}
                      style={{ padding: '0.65rem 1rem', height: 'fit-content' }}
                    >
                      <Check size={16} />
                      <span>{savingEdit ? 'Guardando...' : 'Guardar'}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* Critical Maintenance Alert Banners */}
              {criticalWearComponents.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                  {criticalWearComponents.map((comp) => (
                    <div
                      key={comp.Id}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid var(--danger-color)',
                        borderRadius: '10px',
                        padding: '0.85rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                        color: 'var(--danger-color)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <AlertOctagon size={22} style={{ flexShrink: 0 }} />
                        <div style={{ fontSize: '0.9rem' }}>
                          <strong>⚠️ MANTENIMIENTO CRÍTICO:</strong> El componente <strong>{comp.Nombre}</strong> ha alcanzado un{' '}
                          <strong>{comp.DesgasteAcumulado.toFixed(1)}%</strong> de desgaste y requiere reemplazo inmediato para circular seguro.
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => {
                          const query = `${comp.Nombre} ${activeVehicle.Marca} ${activeVehicle.Modelo}`;
                          navigateToStore(query);
                        }}
                        style={{
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: 'var(--accent-color)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <ShoppingBag size={14} />
                        <span>Buscar reemplazo en Mercado Libre</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Vehicle Description / Guidance */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                  }}
                >
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Sparkles size={16} color="var(--accent-color)" />
                    Mesa de Trabajo (Workbench)
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Equipá neumáticos todoterreno, suspensiones y malacates validados por el motor de reglas mecánicas sin romper la compatibilidad de tu vehículo.
                  </p>
                </div>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                  }}
                >
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Gauge size={16} color="var(--primary-blue)" />
                    Route Tracker & Telemetría
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Registrá los kilómetros en Asfalto, Arena, Barro o Piedra para calcular el factor de desgaste predictivo acumulado de frenos, amortiguadores y gomas.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', color: 'var(--text-secondary)' }}>
              <Car size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
              <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Ningún Vehículo Seleccionado</h3>
              <p style={{ fontSize: '0.9rem' }}>Seleccione una camioneta de la lista o registre una nueva para comenzar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
