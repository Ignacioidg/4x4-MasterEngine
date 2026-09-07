# Prompt de Continuidad de Sesión — 4x4 MasterEngine (4ME)

Si iniciás una nueva conversación con una IA o cambiás de asistente, podés **copiar y pegar el siguiente texto** al inicio del chat para que el asistente tenga el 100% del contexto de inmediato:

---

```markdown
Hola, estoy trabajando en el proyecto "4x4 MasterEngine (4ME)".
Aquí tienes el resumen completo del proyecto, stack y estado actual para que continuemos desde aquí:

### 1. ¿Qué es el proyecto?
4x4 MasterEngine es una aplicación web de ingeniería y gestión automotriz off-road para pick-ups y camionetas 4x4 (Toyota, Ford, Jeep, RAM, Chevrolet, etc.).

### 2. Stack Tecnológico:
- Backend: .NET 9 Web API (Clean Architecture: Domain, Application, Infrastructure, API, Tests).
- ORM & Base de Datos: Entity Framework Core 9 con SQL Server LocalDB (`(localdb)\mssqllocaldb`).
- Autenticación: JWT Bearer + BCrypt.
- Frontend: React 19 + TypeScript + Vite (Dark Theme Glassmorphism, Lucide Icons).
- APIs Externas:
  1. NHTSA vPIC API (Oficial de EE.UU.): Consulta de catálogos automotrices (Años, Marcas, Modelos, Trims oficiales) y decodificador de VIN / Chasis.
  2. Mercado Libre Argentina (MLA) API: Búsqueda en vivo de repuestos y accesorios con precios en ARS y fotos reales (sin persistencia en base de datos, timeout 5s).
- Ejecución Unificada: Presionando Play / F5 en Visual Studio, MSBuild ejecuta `npm run build` en el frontend, lo empaqueta en `4x4MasterEngine.API/wwwroot` y levanta tanto la API como la SPA en `http://localhost:5234` abriendo el navegador automáticamente.

### 3. Credenciales de Prueba:
- Administrador: usuario `admin` | contraseña `admin` (acceso a Admin Console de auditoría).
- Usuario estándar: usuario `user` | contraseña `user`.

### 4. Módulos Implementados:
- Dashboard: Lista de vehículos, alta con combos oficiales de NHTSA (Año, Marca, Modelo, Trim, Tracción 4x4/AWD/4x2, Patente, Km), edición rápida (✏️), baja (🗑️), y alertas de mantenimiento crítico (>= 80%) con botón directo "Buscar reemplazo en Mercado Libre".
- Build Workbench: Simulador de compatibilidad mecánica pura (sin carritos ni precios). Permite equipar accesorios validados por el motor de reglas, selector de vehículo activo, y CRUD de builds por camioneta (guardar, renombrar, cargar y eliminar) con botón de búsqueda en Tienda por accesorio.
- Tienda Oficial (ML): Buscador con Mercado Libre en vivo, categorías rápidas (Frenos, Suspensión, Neumáticos, Malacates, etc.) y toggle para filtrar automáticamente por el vehículo activo.
- Route Tracker: Registro de kilometraje por tipo de suelo (asfalto, arena, barro, roca) con multiplicadores de severidad y cálculo predictivo de desgaste en tiempo real.
- Admin Console: Historial de auditoría y monitoreo.

### 5. Repositorio Oficial:
- GitHub: https://github.com/Ignacioidg/4x4-MasterEngine.git

Por favor lee este contexto y confírmame que estás listo para continuar con las siguientes tareas.
```
