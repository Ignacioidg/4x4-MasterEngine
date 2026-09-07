# 4x4 MasterEngine (4ME) 🛞

Plataforma integral de ingeniería automotriz, simulación off-road y telemetría de desgaste para vehículos todoterreno, pick-ups y SUVs.

[![.NET 9](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

---

## 🚀 Características Principales

1. **Catálogo Oficial NHTSA vPIC & Decodificador VIN:**
   - Consulta en tiempo real de años, marcas y modelos oficiales.
   - Dropdown dinámico de versiones (*Trims*) obtenido del dataset de especificaciones técnicas.
   - Selector especializado de tracción mecánica (*4WD con reductora, AWD, 4x2*).
   - Autocompletado inteligente mediante número de chasis (VIN de 17 caracteres).

2. **Build Workbench (Simulador de Compatibilidad Mecánica):**
   - Entorno técnico para ensayar configuraciones sin interferencia comercial.
   - Motor de reglas mecánicas (*Requisitos e Incompatibilidades*) que valida combinaciones de suspensión, rodado y accesorios.
   - CRUD de proyectos/builds por camioneta (guardar, renombrar, cargar y borrar).

3. **Tienda Oficial (Integración en Vivo con Mercado Libre MLA):**
   - Buscador en tiempo real de repuestos y accesorios en pesos argentinos (ARS).
   - Filtro inteligente automático adaptado a la camioneta activa.
   - Chips de acceso rápido por categoría (*Frenos, Suspensión, Neumáticos, Malacates, Snorkels, Paragolpes*).
   - Acceso directo a las publicaciones oficiales en Mercado Libre.

4. **Route Tracker & Telemetría Predictiva de Desgaste:**
   - Registro de kilómetros con factores de multiplicación según el tipo de terreno (Asfalto 1.0x, Arena 1.5x, Barro 2.0x, Roca 3.0x).
   - Alertas de mantenimiento preventivo al superar el 80% de vida útil con enlace directo para buscar el repuesto en Mercado Libre.

5. **Persistencia Permanente & Auditoría:**
   - Base de datos SQL Server LocalDB permanente.
   - Control de acceso por roles (Administrador / Usuario) con tokens JWT y hashing seguro BCrypt.
   - Bitácora de auditoría detallada de operaciones.

---

## 💻 Inicio Rápido (Un Solo Clic en Visual Studio)

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/Ignacioidg/4x4-MasterEngine.git
   ```
2. Abrir `4x4MasterEngine.sln` en **Visual Studio 2022**.
3. Presionar **Play / F5** ▶️.
   - Visual Studio compila automáticamente React, lo empaqueta dentro de `wwwroot`, inicia el backend y abre el navegador en `http://localhost:5234`.

### Credenciales de Prueba:
- **Administrador:** `admin` / `admin`
- **Usuario Estándar:** `user` / `user`

---

## 📖 Documentación y Contexto
- [Arquitectura del Sistema](docs/ai_context/SYSTEM_ARCHITECTURE.md)
- [Prompt de Continuidad de Sesión para IA](docs/chat_continuity/CONTINUATION_PROMPT.md)
