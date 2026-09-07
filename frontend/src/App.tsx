import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VehicleProvider, useVehicle } from './context/VehicleContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AuthView } from './components/auth/AuthView';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { WorkbenchTab } from './components/workbench/WorkbenchTab';
import { MaintenanceTab } from './components/maintenance/MaintenanceTab';
import { AdminTab } from './components/admin/AdminTab';
import { StoreTab } from './components/store/StoreTab';
import { Toast, ToastProps } from './components/common/Toast';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#fff', maxWidth: '500px', margin: '4rem auto' }} className="glass-panel">
          <h3 style={{ color: 'var(--danger-color)', marginBottom: '0.75rem' }}>⚠️ Ocurrió una advertencia visual</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            {this.state.error?.message || 'Error al procesar la vista. Por favor recargue la página.'}
          </p>
          <button
            className="btn-primary"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Recargar Pantalla
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainLayout: React.FC<{ onShowToast: (msg: string, type?: 'error' | 'success' | 'info') => void }> = ({
  onShowToast,
}) => {
  const { isAuthenticated } = useAuth();
  const { activeTab } = useVehicle();

  if (!isAuthenticated) {
    return <AuthView onShowToast={onShowToast} />;
  }

  return (
    <div style={{ display: 'flex', gap: '1.5rem', maxWidth: '1400px', margin: '1.5rem auto', padding: '0 1.5rem' }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0 }}>
        <ErrorBoundary>
          {activeTab === 'dashboard' && <DashboardTab onShowToast={onShowToast} />}
          {activeTab === 'workbench' && <WorkbenchTab onShowToast={onShowToast} />}
          {activeTab === 'store' && <StoreTab onShowToast={onShowToast} />}
          {activeTab === 'maintenance' && <MaintenanceTab onShowToast={onShowToast} />}
          {activeTab === 'admin' && <AdminTab onShowToast={onShowToast} />}
        </ErrorBoundary>
      </main>
    </div>
  );
};

export function App() {
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'info' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    setToast({ message, type });
  };

  return (
    <AuthProvider>
      <VehicleProvider>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <MainLayout onShowToast={showToast} />
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </div>
      </VehicleProvider>
    </AuthProvider>
  );
}

export default App;
