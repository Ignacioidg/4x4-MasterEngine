# 4x4 MasterEngine (4ME) — Arquitectura y Contexto Técnico para Agentes de IA

Este documento contiene todo el contexto arquitectónico, decisiones técnicas y flujos de datos del proyecto **4x4 MasterEngine (4ME)** para que cualquier agente de IA o desarrollador pueda comprender la base de código y continuar su desarrollo sin fricciones.

---

## 🏗️ 1. Visión General y Stack Tecnológico

**4x4 MasterEngine (4ME)** es una plataforma integral de ingeniería automotriz orientada a vehículos todoterreno, pick-ups y SUVs. Permite:
1. Simular configuraciones off-road (*Build Workbench*) con un motor de reglas de compatibilidad mecánica.
2. Calcular desgaste predictivo (*Route Tracker & Telemetría*) en función de terrenos severos (asfalto, arena, barro, roca).
3. Gestionar catálogos vehiculares oficiales en vivo vía **NHTSA vPIC API** (con decodificación de chasis/VIN).
4. Cotizar y buscar repuestos/accesorios reales en tiempo real mediante la **API pública de Mercado Libre Argentina (MLA)**.

### Stack:
- **Backend:** .NET 9 (C#) con ASP.NET Core Web API, Entity Framework Core 9, SQL Server LocalDB (`mssqllocaldb`), Autenticación JWT (Bearer) y BCrypt para hashing.
- **Frontend:** React 19 + TypeScript + Vite, Tailwind-like Glassmorphism CSS oscuro, Lucide React Icons.
- **Ejecución Unificada:** El proyecto `4x4MasterEngine.API.csproj` incluye un `Target` de MSBuild (`BuildFrontend`) que ejecuta automáticamente `npm run build` empaquetando la SPA en `4x4MasterEngine.API/wwwroot`, permitiendo ejecutar frontend y backend con **un solo clic (F5)** desde Visual Studio.

---

## 📂 2. Estructura de Proyectos (Clean Architecture)

```
4x4MasterEngine/
├── 4x4MasterEngine.Domain/            # Capa de Dominio (Entidades puras, Enums)
│   └── Entities/
│       ├── Accesorio.cs               # Partes off-road (Neumático, Suspensión, Winch, etc.)
│       ├── AuditLog.cs                # Bitácora de cambios
│       ├── ComponenteDesgaste.cs      # Componente del vehículo con vida útil y desgaste %
│       ├── ReglaCompatibilidad.cs     # Reglas mecánicas (Requisito, Incompatibilidad)
│       ├── Trayecto.cs                # Registro de recorrido en diferentes tipos de terreno
│       ├── User.cs                    # Usuario del sistema (Administrador / Usuario)
│       ├── Vehiculo.cs                # Camioneta registrada con Km inicial/actual, Trim y Tracción
│       └── VehiculoBuild.cs           # Configuración/setup guardado de accesorios por vehículo
│
├── 4x4MasterEngine.Application/       # Capa de Aplicación (Interfaces, DTOs, Lógica de Negocio)
│   ├── DTOs/                          # Objetos de transferencia de datos
│   └── Interfaces/
│       ├── ICompatibilidadRulesEngine.cs
│       ├── IMaintenanceTrackerService.cs
│       ├── IMercadoLibreService.cs    # Consumo de API Mercado Libre
│       ├── IVehicleCatalogService.cs  # Consumo de API NHTSA vPIC
│       └── ...
│
├── 4x4MasterEngine.Infrastructure/    # Capa de Infraestructura (EF Core, APIs externas)
│   ├── Data/
│   │   ├── ApplicationDbContext.cs    # Mapeo de tablas y relaciones N:N
│   │   └── Repositories/              # Repositorios genéricos y específicos
│   └── Services/
│       ├── CompatibilidadRulesEngine.cs # Algoritmo de validación mecánica (Result Pattern)
│       ├── MaintenanceTrackerService.cs # Desgaste con multiplicadores de suelo severo
│       ├── MercadoLibreService.cs     # Cliente HTTP a api.mercadolibre.com con 5s timeout
│       └── NhtsaVpicService.cs        # Cliente HTTP a vpic.nhtsa.dot.gov
│
├── 4x4MasterEngine.API/               # Capa de Presentación (Controllers, Program.cs, wwwroot)
│   ├── Controllers/
│   │   ├── AuthController.cs          # Login y Registro JWT
│   │   ├── CatalogController.cs       # Catálogo NHTSA (Años, Marcas, Modelos, Trims, VIN)
│   │   ├── MaintenanceController.cs   # Registro de trayectos y cálculo de desgaste
│   │   ├── StoreController.cs         # Búsqueda en vivo de Mercado Libre
│   │   └── VehiculosController.cs     # CRUD de vehículos y gestión de builds
│   └── wwwroot/                       # Salida compilada de React servida por Kestrel
│
└── frontend/                          # Single Page Application (React + TS + Vite)
    └── src/
        ├── components/
        │   ├── dashboard/DashboardTab.tsx   # Ficha técnica, alertas críticas, alta NHTSA
        │   ├── workbench/WorkbenchTab.tsx   # Simulador de builds (sin precios)
        │   ├── store/StoreTab.tsx           # Tienda oficial integrada a Mercado Libre
        │   ├── maintenance/MaintenanceTab.tsx # Route tracker y telemetría
        │   └── admin/AdminTab.tsx           # Auditoría y gestión de catálogo
        ├── context/
        │   ├── AuthContext.tsx              # Sesión JWT y control de roles
        │   └── VehicleContext.tsx           # Estado global de vehículos, builds y tienda
        └── services/api.ts                  # Cliente fetch con auto-inyección de token JWT
```

---

## ⚙️ 3. Reglas y Algoritmos Centrales

1. **Motor de Reglas de Compatibilidad (`CompatibilidadRulesEngine.cs`):**
   - No lanza excepciones (`ValidationResult`).
   - Valida reglas de tipo `Requisito` (ej: Neumático 37" requiere Suspensión 4") e `Incompatibilidad` (ej: Neumático 37" es incompatible con Suspensión 2").
2. **Algoritmo de Desgaste (`MaintenanceTrackerService.cs`):**
   - Multiplicadores por suelo: Asfalto (1.0x), Arena (1.5x), Barro (2.0x), Piedra/Roca (3.0x).
   - Calcula $KmEquivalentes = KmReales \times Multiplicador$.
   - Calcula $Desgaste\% = (KmEquivalentesAcumulados / VidaUtilKm) \times 100$.
   - Al alcanzar $\ge 80\%$, se activa la alerta crítica con enlace a Mercado Libre.
3. **Persistencia SQL Server (`ApplicationDbContext.cs`):**
   - Base de datos permanente en `(localdb)\mssqllocaldb`.
   - Se removió `EnsureDeleted()` en `Program.cs` para garantizar persistencia continua.
