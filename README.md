# Examen Sociología — Centuria

Sistema de evaluación virtual con panel docente, registro de asistencia, validación de alumnos, seguimiento de asistencia y consulta de resultados para la cátedra de **Sociología** del **Instituto Superior Centuria**.

---

## Tabla de Contenidos

- [Características Principales](#características-principales)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Páginas y Funcionalidades](#páginas-y-funcionalidades)
- [Configuración (Datos_Generales.txt)](#configuración-datos_generalestxt)
- [Flujo de Asistencia y Seguimiento](#flujo-de-asistencia-y-seguimiento)
- [Panel Docente](#panel-docente)
- [Importación de Archivos](#importación-de-archivos)
- [Credenciales](#credenciales)
- [Codificación UTF-8](#codificación-utf-8)
- [Utilidades](#utilidades)
- [Despliegue](#despliegue)
- [Requisitos](#requisitos)

---

## Características Principales

- **Examen interactivo** con selección múltiple y verdadero/falso (30 preguntas, 30 puntos).
- **Panel docente analítico** con monitoreo en vivo, filtros, métricas y control de asistencia.
- **Validación de alumnos** previa al examen mediante cédula y listado CSV.
- **Consulta pública de resultados** por cédula (mejor nota e historial de intentos).
- **Registro de asistencia** con QR de acceso, estado (Presente / Tarde) y sincronización a Google Sheets.
- **Seguimiento de % de asistencia** por alumno con barras de progreso, filtros y alertas de riesgo (< 75%).
- **Solicitud de examen extraordinario** con código de autorización y justificación.
- **Auditoría del examen** con panel lateral de intentos, puntaje válido y acta detallada.
- **Generación de actas** en formato imprimible / PDF con badges visuales OK / MAL.
- **Configuración dinámica** desde `public/Datos_Generales.txt` (materia, grupo, docente, enlaces, tiempos, etc.).
- **Persistencia local** con `localStorage` para resultados, intentos y registros de asistencia.

---

## Estructura del Proyecto

```
Asistencia/
├── public/
│   ├── index.html                    # Landing principal con acceso a módulos
│   ├── asistencia.html               # Registro público de asistencia (QR)
│   ├── seguimiento.html              # Seguimiento de % de asistencia por alumno
│   ├── validar.html                  # Validación de alumno antes del examen
│   ├── consultar.html                # Consulta pública de resultados del examen
│   ├── teacher_panel.html            # Consola analítica del docente
│   ├── script.js                     # Lógica central del sistema
│   ├── styles.css                    # Estilos personalizados y animaciones
│   ├── Datos_Generales.txt           # Configuración central del examen
│   ├── Ejercicios_Sociologia_VFuturo.txt  # Banco de preguntas futuras
│   └── Listado_Alumnos.csv           # Listado de alumnos habilitados
├── data/
│   ├── asistencia.txt                # Registro de asistencia (ejemplo / respaldo)
│   └── Examen (respuestas).csv       # Resultados exportados
├── derespaldo/
│   ├── 60_Preguntas_Sociologia.md    # Cuestionario teórico de respaldo
│   └── Examen (respuestas).xlsx      # Planilla de respaldo
├── utils/
│   ├── fix_encoding.py               # Corrector universal de codificación UTF-8
│   └── google_apps_script.gs         # Script de backend para Google Sheets
├── package.json
├── vercel.json
└── README.md
```

---

## Páginas y Funcionalidades

### `index.html` — Landing Principal

Menú de acceso a todos los módulos del sistema:
- Registrar Asistencia
- Consultar Resultados
- Validar Alumno
- Seguimiento de Asistencia
- Panel Docente

### `asistencia.html` — Registro de Asistencia

- **Botón principal** que abre el **Google Form oficial** de asistencia (`link.google.forms`).
- **Código QR** apuntando al formulario oficial para acceso rápido desde celular.
- **Modo offline** (colapsable): formulario local que guarda en `localStorage` cuando no hay internet.
- Campos del modo offline: **Nombre**, **Cédula**, **Carrera** (dos botones grandes: ADMINISTRACIÓN DE EMPRESAS / ADMINISTRACIÓN Y GESTIÓN), **Estado** (Presente / Tarde), **Observación**.
- Panel lateral con asistencias recientes (sincronizadas desde el CSV público o localStorage).

### `seguimiento.html` — Seguimiento de Asistencia

- Tabla completa con **% de asistencia por alumno**.
- Columnas: Cédula, Nombre, Carrera, Total de Clases, Presente, Tarde, Ausente, **% con barra de progreso**.
- **KPIs superiores**: total de alumnos, clases dictadas, promedio %, alumnos en riesgo (< 75%).
- Filtro por carrera y búsqueda por nombre/cédula.
- Ordenamiento automático por porcentaje (mayor a menor).
- Funciona con **Google Sheets** (vía API) o con datos locales si no hay conexión.
- **Cálculo**: Tarde cuenta como **0.5** en el porcentaje final.

### `validar.html` — Validación de Alumno

- Verificación de cédula contra el `Listado_Alumnos.csv`.
- Indica si el alumno está **habilitado para rendir** (`estado = *`).
- Si no está habilitado, redirige a **consultar resultados**.
- **Solicitud de examen extraordinario** con código de autorización (`CE-EXT-26` por defecto) y formulario de justificación.

### `consultar.html` — Consultar Resultados

- Búsqueda pública por cédula (sin autenticación).
- Muestra **todos los intentos** con puntaje, porcentaje y desglose por sección.
- Destaca la **mejor nota** obtenida.

### `teacher_panel.html` — Panel del Docente

- **KPIs en vivo**: alumnos activos, total evaluados, promedio global, control de frecuencia.
- **Monitoreo en Vivo** (`activeTab = 'live'`): tabla de estudiantes actualmente respondiendo.
- **Exámenes Entregados** (`history`): tabla con filtros por carrera, búsqueda y ordenamiento.
- **Métricas y Carreras** (`analytics`): distribución de rendimiento por unidad académica.
- **Control de Asistencia** (`attendance`): importación y visualización de registros.
- **Auditoría lateral**: seleccionar un alumno para ver todos sus intentos, respuestas detalladas y acta completa.
- **Módulo de Carga**: importar JSON, CSV, configuración TXT y asistencia TXT simultáneamente.
- **Exportación**: PDF resumen, PDF compilado total y respaldo de base de datos.

---

## Configuración (Datos_Generales.txt)

Editar `public/Datos_Generales.txt` para personalizar el examen sin modificar código:

| Clave | Descripción | Ejemplo |
|-------|-------------|---------|
| `name.docente` | Nombre del docente | `Christhian Keim` |
| `cedula.docente` | CI del docente | `1340130` |
| `cedula.prueba` | CI modo prueba (sin guardar) | `99` |
| `grupo` | Código de grupo | `S026` |
| `materia` | Nombre de la materia | `Sociologia` |
| `ano` | Año lectivo | `2026` |
| `seccion` | Sección / turno | `Ingenieria Comercial y Contabilidad` |
| `fecha.examen` | Fecha del examen | `19/05/2026` |
| `fecha.limite` | Fecha límite de entrega | `20/05/2026` |
| `tiempo.limite` | Minutos para el examen | `60` |
| `intentos.maximos` | Intentos permitidos | `2` |
| `puntaje.total` | Puntaje máximo | `30` |
| `puntaje.aprobacion` | % mínimo para aprobar | `60` |
| `link.google.forms` | **Formulario oficial de asistencia** (Google Forms) | `https://docs.google.com/forms/d/1a_SbpoS3KXzM9JuwwgDYubsKilUaW6WxqiWShFEMPh8/viewform` |
| `link.asistencia` | Planilla de asistencia (Google Sheets) | `https://docs.google.com/spreadsheets/d/1gdGxpa3-z61A7O06smRSv_055KIzH4SBaRYNb-RVYJk/edit` |
| `link.respuestas` | Planilla de respuestas del examen | `https://docs.google.com/spreadsheets/d/1isV0oyTbiSGAWB5DZuNUjU8R3fm8H6pnPxcp_eOHb5s` |
| `link.solicitudes.extraordinarias` | Formulario de solicitudes extraordinarias | `https://docs.google.com/forms/d/1ABC123XYZ/edit` |
| `asistencia.csv.url` | **CSV público** de la hoja de asistencia (para lectura / seguimiento) | *(ver instrucciones abajo)* |
| `asistencia.api.url` | URL del Web App (opcional, para escritura POST directa) | *(ver instrucciones abajo)* |
| `asistencia.carreras` | Carreras disponibles separadas por `\|` | `ADMINISTRACION DE EMPRESAS\|ADMINISTRACION Y GESTION` |

> **Nota interna**: las claves con punto (`.`) se convierten automáticamente a guion bajo (`_`) en JavaScript (`tiempo.limite` → `CONFIG.tiempo_limite`).

---

## Flujo de Asistencia y Seguimiento

### 1. Configurar el Formulario de Asistencia (Google Forms) - Opción A

**Paso obligatorio:** Vincular el formulario a la **planilla oficial**.

1. Abrir el **Google Form** de asistencia: `https://docs.google.com/forms/d/1a_SbpoS3KXzM9JuwwgDYubsKilUaW6WxqiWShFEMPh8/edit`
2. Ir a la pestaña **Respuestas**.
3. Hacer clic en el ícono de **Hoja de cálculo de Google** (verde).
4. Seleccionar **Hoja de cálculo existente**.
5. Pegar la URL de la planilla oficial:
   `https://docs.google.com/spreadsheets/d/1gdGxpa3-z61A7O06smRSv_055KIzH4SBaRYNb-RVYJk/edit?gid=178512863#gid=178512863`
6. Aceptar. Ahora las respuestas del formulario irán a **esa planilla**.
7. Copiar la URL del formulario y pegarla en `public/Datos_Generales.txt` bajo `link.google.forms`.

**Obtener la URL CSV pública (para el seguimiento):**
1. Abrir la **planilla oficial** vinculada.
2. **Archivo → Compartir → Publicar en la web**.
3. Seleccionar la hoja de respuestas del formulario (`gid=178512863`), formato **CSV**.
4. Copiar la URL generada y pegarla en `public/Datos_Generales.txt` bajo `asistencia.csv.url`.

### 1b. Configurar Google Apps Script (Opción B - Avanzado)

Si desea que la página web guarde directamente en Sheets sin pasar por el formulario:

1. Abrir el proyecto: https://script.google.com/home/projects/1hJhNk5IlDLqQuNa9Xoy3pmsm2nmVZjzoEJO9462n6ZpQMoc8GCAiSJp4/edit
2. Copiar el código de `utils/google_apps_script.gs`
3. **Implementar → Nuevo implementación → Web App**
4. Acceso: **"Cualquiera"**
5. Copiar la URL que termina en `/exec` y pegarla en `asistencia.api.url`

### 2. Registrar Asistencia (Alumno)

- El alumno accede a `asistencia.html` (escaneando el QR o por enlace directo).
- **Opción A**: Hace clic en **"Abrir Formulario"** y completa el **Google Form oficial**.
- **Opción B** (si configuró API): Completa el formulario directamente en la página y se guarda automáticamente.
- Los datos se guardan en la planilla del docente.
- Si no hay internet, puede usar el **modo offline** (registro local en `localStorage`).

### 3. Seguimiento (Docente)

- El docente accede a `seguimiento.html`.
- El sistema lee el **CSV público** de la planilla y calcula automáticamente:
  - Total de clases dictadas (fechas únicas).
  - Presentes, tardanzas y ausencias por alumno.
  - **Porcentaje de asistencia** (Tarde = 0.5).
- Puede filtrar por carrera, buscar por nombre/cédula y ver alertas de alumnos en **riesgo** (< 75%).

---

## Panel Docente

### Acceso

Ingresar la **Cédula de Identidad** del docente configurada en `cedula.docente` (por defecto: `1340130`).

### Funcionalidades Clave

1. **Monitoreo en Vivo** — estudiantes con sesión activa en tiempo real.
2. **Exámenes Entregados** — tabla con búsqueda, filtros por carrera y ordenamiento multicriterio.
3. **Métricas y Carreras** — paneles de distribución por carrera y rendimiento promedio.
4. **Control de Asistencia** — registro importado desde archivo o almacenamiento local.
5. **Auditoría del Examen** — panel lateral con:
   - Historial completo de intentos (puntaje, fecha, hora).
   - Puntaje Válido (mejor puntaje + porcentaje).
   - Acta detallada con badges **OK** / **MAL** por pregunta.
   - Botón **EXPEDIENTE** para descargar acta en PDF.

---

## Importación de Archivos

Usar el **Módulo de Carga** en el panel docente para procesar simultáneamente:

- **JSON** — respuestas exportadas de los navegadores de los alumnos.
- **CSV** — separador `;`, columnas: `Cedula`, `Nombre Apellido`, `Carrera`, `Puntaje`, `Intento`, `Marca temporal`, `Respuesta`.
- **Datos_Generales.txt** — configuración central del examen.
- **asistencia.txt** — registro de asistencia en formato TSV / CSV.

---

## Credenciales

| Rol | Cédula | Descripción |
|-----|--------|-------------|
| **Panel Docente** | `1340130` | Acceso total al panel analítico (configurable) |
| **Modo Prueba** | `99` | Render el examen sin guardar resultados |

---

## Codificación UTF-8

**IMPORTANTE**: todos los archivos de texto deben guardarse como **UTF-8 sin BOM** para preservar tildes, eñes y signos de puntuación.

El proyecto incluye `utils/fix_encoding.py` para corregir automáticamente archivos en Latin-1 / ANSI:

```bash
python utils/fix_encoding.py
```

Soporta extensiones: `.txt`, `.md`, `.html`, `.ini`, `.cfg`, `.js`, `.css`, `.json`. Es seguro ejecutarlo múltiples veces (detecta UTF-8 y no modifica).

---

## Utilidades

### `utils/fix_encoding.py`
Recorre todo el proyecto y convierte archivos a UTF-8 sin BOM.

### `utils/google_apps_script.gs`
Script de Google Apps Script para guardar asistencia directamente en Sheets:

**Instrucciones para implementar:**
1. Abrir el proyecto: https://script.google.com/home/projects/1hJhNk5IlDLqQuNa9Xoy3pmsm2nmVZjzoEJO9462n6ZpQMoc8GCAiSJp4/edit
2. Copiar el código de `utils/google_apps_script.gs`
3. Guardar (`Ctrl+S`)
4. **Implementar → Nuevo implementación → Web App**
5. Acceso: **"Cualquiera"** (o solo usuarios de la institución)
6. Copiar la URL que termina en `/exec` y pegarla en `asistencia.api.url`

**Funciones del script:**
- `doPost`: Recibe registros de asistencia vía POST y los guarda en la hoja **Registro**.
- `doGet`: Consulta registros (`?modo=registro`) o resumen (`?modo=resumen`).
- `recalcularResumen_`: Calcula automáticamente el % de asistencia en la hoja **Resumen**.
- **Anti-duplicados**: No permite registrar la misma cédula dos veces en el mismo día.
- **Validación de carreras**: Solo acepta ADMINISTRACIÓN DE EMPRESAS o ADMINISTRACIÓN Y GESTIÓN.
- **Funciones manuales**: `recalcularManualmente()`, `limpiarDatosDePrueba()`, `inicializarHojas()`.

---

## Despliegue

### GitHub Pages

```bash
git add .
git commit -m "Actualización del sistema de evaluación"
git push origin main
```

En **Settings → Pages**: Source = `Deploy from branch` → `main` / `(root)`.

> **URL de producción actual**: `https://wmlumen.github.io/Asistencia/asistencia.html`

### Vercel

```bash
vercel --prod
```

> El archivo `vercel.json` redirige `/` y `/consultar` a las páginas dentro de `public/`.

### Local

```bash
npm run dev
# o
npx serve public
```

---

## Requisitos

- Navegador moderno (Chrome, Firefox, Edge, Safari 13+).
- Conexión a internet (CDN para Tailwind CSS, Font Awesome, Alpine.js, html2canvas, jsPDF, QRCode.js).
- `localStorage` habilitado (los datos se almacenan en el navegador).
- Python 3 (opcional, solo si se usa `fix_encoding.py`).

---

## Licencia

Proyecto académico interno del **Instituto Superior Centuria**.
