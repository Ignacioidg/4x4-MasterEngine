import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiCall } from '../services/api';
import { Accesorio, BudgetResponse, Vehiculo, VehiculoBuild } from '../types';
import { useAuth } from './AuthContext';

interface VehicleContextType {
  vehicles: Vehiculo[];
  activeVehicle: Vehiculo | null;
  accessoriesCatalog: Accesorio[];
  budget: BudgetResponse | null;
  savedBuilds: VehiculoBuild[];
  isLoading: boolean;
  activeTab: 'dashboard' | 'workbench' | 'maintenance' | 'admin' | 'store';
  setActiveTab: (tab: 'dashboard' | 'workbench' | 'maintenance' | 'admin' | 'store') => void;
  storeSearchQuery: string;
  setStoreSearchQuery: (query: string) => void;
  navigateToStore: (query: string) => void;
  selectVehicle: (id: number) => Promise<void>;
  refreshVehicles: () => Promise<void>;
  createVehicle: (data: {
    marca: string;
    modelo: string;
    anio: number;
    patente: string;
    trimId: string;
    kilometrajeInicial: number;
  }) => Promise<Vehiculo>;
  updateVehicle: (id: number, data: {
    patente?: string;
    trimId?: string;
    kilometrajeActual?: number;
    marca?: string;
    modelo?: string;
    anio?: number;
  }) => Promise<void>;
  deleteVehicle: (id: number) => Promise<void>;
  equipAccessory: (accessoryId: number) => Promise<void>;
  unequipAccessory: (accessoryId: number) => Promise<void>;
  saveBuild: (nombre: string) => Promise<void>;
  loadBuild: (buildId: number) => Promise<void>;
  renameBuild: (buildId: number, newName: string) => Promise<void>;
  deleteBuild: (buildId: number) => Promise<void>;
  fetchAllBuilds: () => Promise<VehiculoBuild[]>;
  logRoute: (kilometros: number, suelo: number) => Promise<void>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const VehicleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [vehicles, setVehicles] = useState<Vehiculo[]>([]);
  const [activeVehicle, setActiveVehicle] = useState<Vehiculo | null>(null);
  const [accessoriesCatalog, setAccessoriesCatalog] = useState<Accesorio[]>([]);
  const [budget, setBudget] = useState<BudgetResponse | null>(null);
  const [savedBuilds, setSavedBuilds] = useState<VehiculoBuild[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'workbench' | 'maintenance' | 'admin' | 'store'>('dashboard');
  const [storeSearchQuery, setStoreSearchQuery] = useState<string>('');

  const fetchCatalog = async () => {
    try {
      const data = await apiCall<Accesorio[]>('/accesorios');
      setAccessoriesCatalog(data);
    } catch (err) {
      console.error('Error fetching accessories catalog:', err);
    }
  };

  const fetchBuilds = async (vehId: number) => {
    try {
      const data = await apiCall<VehiculoBuild[]>(`/vehiculos/${vehId}/builds`);
      setSavedBuilds(data);
    } catch (err) {
      console.error('Error fetching saved builds:', err);
    }
  };

  const fetchBudget = async (vehId: number) => {
    try {
      const data = await apiCall<BudgetResponse>(`/vehiculos/${vehId}/budget`);
      setBudget(data);
    } catch (err) {
      console.error('Error fetching budget:', err);
    }
  };

  const selectVehicle = useCallback(async (id: number) => {
    setIsLoading(true);
    try {
      const vehicle = await apiCall<Vehiculo>(`/vehiculos/${id}`);
      setActiveVehicle(vehicle);
      await Promise.all([fetchBudget(id), fetchBuilds(id)]);
    } catch (err) {
      console.error('Error selecting vehicle:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshVehicles = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await apiCall<Vehiculo[]>('/vehiculos');
      setVehicles(data);
      if (data.length > 0) {
        if (!activeVehicle || !data.some((v) => v.Id === activeVehicle.Id)) {
          await selectVehicle(data[0].Id);
        } else {
          await selectVehicle(activeVehicle.Id);
        }
      } else {
        setActiveVehicle(null);
        setBudget(null);
        setSavedBuilds([]);
      }
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  }, [isAuthenticated, activeVehicle, selectVehicle]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshVehicles();
      fetchCatalog();
    } else {
      setVehicles([]);
      setActiveVehicle(null);
      setBudget(null);
      setSavedBuilds([]);
    }
  }, [isAuthenticated]);

  const createVehicle = async (payload: {
    marca: string;
    modelo: string;
    anio: number;
    patente: string;
    trimId: string;
    kilometrajeInicial: number;
  }) => {
    const vehicle = await apiCall<Vehiculo>('/vehiculos', 'POST', payload);
    await refreshVehicles();
    await selectVehicle(vehicle.Id);
    return vehicle;
  };

  const equipAccessory = async (accessoryId: number) => {
    if (!activeVehicle) throw new Error('Seleccione un vehículo primero');
    await apiCall(`/vehiculos/${activeVehicle.Id}/accessories/${accessoryId}`, 'POST');
    await selectVehicle(activeVehicle.Id);
  };

  const unequipAccessory = async (accessoryId: number) => {
    if (!activeVehicle) throw new Error('Seleccione un vehículo primero');
    await apiCall(`/vehiculos/${activeVehicle.Id}/accessories/${accessoryId}`, 'DELETE');
    await selectVehicle(activeVehicle.Id);
  };

  const saveBuild = async (nombre: string) => {
    if (!activeVehicle) throw new Error('Seleccione un vehículo primero');
    await apiCall(`/vehiculos/${activeVehicle.Id}/builds`, 'POST', { nombre });
    await fetchBuilds(activeVehicle.Id);
  };

  const loadBuild = async (buildId: number) => {
    if (!activeVehicle) throw new Error('Seleccione un vehículo primero');
    await apiCall(`/vehiculos/${activeVehicle.Id}/builds/${buildId}/load`, 'POST');
    await selectVehicle(activeVehicle.Id);
  };

  const logRoute = async (kilometros: number, suelo: number) => {
    if (!activeVehicle) throw new Error('Seleccione un vehículo primero');
    await apiCall(`/maintenance/vehicles/${activeVehicle.Id}/trayecto`, 'POST', { kilometros, suelo });
    await selectVehicle(activeVehicle.Id);
  };

  const updateVehicle = async (id: number, data: any) => {
    await apiCall(`/vehiculos/${id}`, 'PUT', data);
    await refreshVehicles();
    await selectVehicle(id);
  };

  const deleteVehicle = async (id: number) => {
    await apiCall(`/vehiculos/${id}`, 'DELETE');
    await refreshVehicles();
  };

  const navigateToStore = (query: string) => {
    setStoreSearchQuery(query);
    setActiveTab('store');
  };

  const renameBuild = async (buildId: number, newName: string) => {
    if (!activeVehicle) throw new Error('Seleccione un vehículo primero');
    await apiCall(`/vehiculos/${activeVehicle.Id}/builds/${buildId}`, 'PUT', { nombre: newName });
    await fetchBuilds(activeVehicle.Id);
  };

  const deleteBuild = async (buildId: number) => {
    if (!activeVehicle) throw new Error('Seleccione un vehículo primero');
    await apiCall(`/vehiculos/${activeVehicle.Id}/builds/${buildId}`, 'DELETE');
    await fetchBuilds(activeVehicle.Id);
  };

  const fetchAllBuilds = async (): Promise<VehiculoBuild[]> => {
    try {
      return await apiCall<VehiculoBuild[]>('/vehiculos/builds/all');
    } catch {
      return [];
    }
  };

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        activeVehicle,
        accessoriesCatalog,
        budget,
        savedBuilds,
        isLoading,
        activeTab,
        setActiveTab,
        storeSearchQuery,
        setStoreSearchQuery,
        navigateToStore,
        selectVehicle,
        refreshVehicles,
        createVehicle,
        updateVehicle,
        deleteVehicle,
        equipAccessory,
        unequipAccessory,
        saveBuild,
        loadBuild,
        renameBuild,
        deleteBuild,
        fetchAllBuilds,
        logRoute,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicle = () => {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicle must be used within a VehicleProvider');
  }
  return context;
};
