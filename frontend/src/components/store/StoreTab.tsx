import React, { useState, useEffect } from 'react';
import {
  Search,
  ShoppingBag,
  ExternalLink,
  Truck,
  CheckCircle2,
  AlertCircle,
  Car,
  Filter,
} from 'lucide-react';
import { useVehicle } from '../../context/VehicleContext';
import { apiCall } from '../../services/api';
import { MercadoLibreItem, MercadoLibreSearchResult } from '../../types';

interface StoreTabProps {
  onShowToast: (msg: string, type?: 'error' | 'success' | 'info') => void;
}

const QUICK_CATEGORIES = [
  'Todos',
  'Pastillas de Freno',
  'Amortiguadores',
  'Neumáticos 4x4',
  'Malacate / Winch',
  'Snorkel',
  'Paragolpes Off-Road',
  'Faros LED Auxiliares',
  'Bloqueo de Diferencial',
];

export const StoreTab: React.FC<StoreTabProps> = ({ onShowToast }) => {
  const { activeVehicle, storeSearchQuery, setStoreSearchQuery } = useVehicle();

  const [searchTerm, setSearchTerm] = useState<string>(storeSearchQuery || '');
  const [filterByVehicle, setFilterByVehicle] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<MercadoLibreItem[]>([]);
  const [searchedQuery, setSearchedQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-search if storeSearchQuery was provided from another tab
  useEffect(() => {
    if (storeSearchQuery) {
      setSearchTerm(storeSearchQuery);
      performSearch(storeSearchQuery, false);
      setStoreSearchQuery('');
    } else if (results.length === 0 && activeVehicle) {
      // Default initial search
      const initialTerm = `Accesorios ${activeVehicle.Marca} ${activeVehicle.Modelo}`;
      setSearchTerm(initialTerm);
      performSearch(initialTerm, false);
    }
  }, [storeSearchQuery]);

  const performSearch = async (termToSearch: string, applyVehicleFilter: boolean) => {
    let finalQuery = termToSearch.trim();
    if (!finalQuery) return;

    if (applyVehicleFilter && activeVehicle && !finalQuery.toLowerCase().includes(activeVehicle.Modelo.toLowerCase())) {
      finalQuery = `${finalQuery} ${activeVehicle.Marca} ${activeVehicle.Modelo}`;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await apiCall<MercadoLibreSearchResult>(
        `/store/search?q=${encodeURIComponent(finalQuery)}&limit=24`
      );

      setResults(response.Results || []);
      setSearchedQuery(finalQuery);

      if (response.ErrorMessage) {
        setErrorMessage(response.ErrorMessage);
        onShowToast(response.ErrorMessage, 'info');
      } else if ((response.Results || []).length === 0) {
        onShowToast('No se encontraron publicaciones en Mercado Libre para este término', 'info');
      }
    } catch (err: any) {
      console.error('Error buscando en Mercado Libre:', err);
      setErrorMessage(err.message || 'Error al conectar con Mercado Libre');
      setResults([]);
      onShowToast('El servicio de Mercado Libre no está disponible en este momento', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchTerm, filterByVehicle);
  };

  const handleQuickCategory = (cat: string) => {
    if (cat === 'Todos') {
      const term = activeVehicle ? `Repuestos 4x4 ${activeVehicle.Marca} ${activeVehicle.Modelo}` : 'Accesorios 4x4';
      setSearchTerm(term);
      performSearch(term, false);
    } else {
      setSearchTerm(cat);
      performSearch(cat, filterByVehicle);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner: Marketplace Header & Search Bar */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
              <ShoppingBag size={22} color="var(--accent-color)" />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Tienda Oficial de Repuestos y Accesorios 4x4
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Precios reales minuto a minuto consultados directamente en el catálogo público de <strong>Mercado Libre Argentina</strong>.
            </p>
          </div>

          {activeVehicle && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
              }}
            >
              <Car size={15} color="var(--accent-color)" />
              <span style={{ color: 'var(--text-secondary)' }}>Vehículo Activo:</span>
              <strong style={{ color: '#fff' }}>{activeVehicle.Marca} {activeVehicle.Modelo}</strong>
            </div>
          )}
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por repuesto, accesorio, marca (ej: Pastillas de freno, Malacate Warn, Bumper de acero)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', fontSize: '0.95rem' }}
            />
            <Search
              size={18}
              color="var(--text-secondary)"
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0 1.5rem' }}>
            <Search size={16} />
            <span>{loading ? 'Consultando...' : 'Buscar'}</span>
          </button>
        </form>

        {/* Vehicle Filter Toggle & Quick Categories */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Quick Categories Chips */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {QUICK_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleQuickCategory(cat)}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--card-border)',
                  color: 'var(--text-secondary)',
                  borderRadius: '20px',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-color)';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--card-border)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Vehicle Filter Switch */}
          {activeVehicle && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={filterByVehicle}
                onChange={(e) => setFilterByVehicle(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'var(--accent-color)' }}
              />
              <span>Adaptar automáticamente a {activeVehicle.Modelo}</span>
            </label>
          )}
        </div>
      </div>

      {/* Results Header / Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {searchedQuery && (
            <span>
              Resultados para: <strong style={{ color: '#fff' }}>"{searchedQuery}"</strong> ({results.length} artículos encontrados)
            </span>
          )}
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
          Mercado Libre MLA API
        </span>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem' }}>
          <ShoppingBag size={40} className="animate-spin" style={{ opacity: 0.4, marginBottom: '1rem', color: 'var(--accent-color)' }} />
          <h3 style={{ color: '#fff', marginBottom: '0.35rem' }}>Buscando publicaciones en Mercado Libre...</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Consultando precios en tiempo real</p>
        </div>
      ) : errorMessage ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 2rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <AlertCircle size={40} style={{ color: 'var(--danger-color)', marginBottom: '0.75rem' }} />
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Información de Conexión</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
            {errorMessage}
          </p>
          <button className="btn-secondary" onClick={() => performSearch(searchTerm, false)}>
            Reintentar búsqueda
          </button>
        </div>
      ) : results.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Filter size={40} style={{ opacity: 0.25, marginBottom: '0.75rem' }} />
          <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Sin publicaciones encontradas</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Intentá buscar con términos más generales o seleccioná alguna categoría rápida de la barra superior.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {results.map((item) => (
            <div
              key={item.Id}
              className="glass-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1rem',
                transition: 'transform 0.2s, border-color 0.2s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--card-border)';
              }}
            >
              <div>
                {/* Product Image Thumbnail */}
                <div
                  style={{
                    height: '180px',
                    background: '#fff',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.85rem',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  {item.Thumbnail ? (
                    <img
                      src={item.Thumbnail}
                      alt={item.Title}
                      style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain' }}
                      loading="lazy"
                    />
                  ) : (
                    <ShoppingBag size={48} style={{ color: '#ccc' }} />
                  )}

                  {/* Free shipping badge overlay */}
                  {item.FreeShipping && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        left: '0.5rem',
                        background: '#16a34a',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.45rem',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <Truck size={12} />
                      <span>Envío Gratis</span>
                    </span>
                  )}
                </div>

                {/* Condition badge */}
                <span
                  style={{
                    fontSize: '0.65rem',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-secondary)',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '4px',
                    display: 'inline-block',
                    marginBottom: '0.35rem',
                  }}
                >
                  {item.Condition}
                </span>

                {/* Title */}
                <h4
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: '#fff',
                    lineHeight: 1.35,
                    height: '2.7em',
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    marginBottom: '0.65rem',
                  }}
                  title={item.Title}
                >
                  {item.Title}
                </h4>
              </div>

              <div>
                {/* Price */}
                <div style={{ marginBottom: '0.85rem' }}>
                  <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-color)' }}>
                    $ {Math.round(item.Price).toLocaleString('es-AR')}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>
                    {item.CurrencyId}
                  </span>
                </div>

                {/* External link to Mercado Libre */}
                <a
                  href={item.Permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    width: '100%',
                    padding: '0.55rem',
                    fontSize: '0.8rem',
                  }}
                >
                  <span>Ver en Mercado Libre</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
