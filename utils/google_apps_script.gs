/**
 * ASISTENCIA CENTURIA - Google Apps Script
 * ==========================================
 * Planilla: https://docs.google.com/spreadsheets/d/1fMdrHltDZNeSq857KPbXs5K8QXm4SCjCVylCTUX5EdA/edit
 * 
 * INSTRUCCIONES:
 * 1. Copiar este código en el editor de Apps Script
 * 2. Guardar (Ctrl+S)
 * 3. Implementar > Nuevo implementacion > Web App
 * 4. Acceso: Cualquiera
 * 5. Copiar la URL de la Web App y pegarla en asistencia.api.url
 * ==========================================
 */

const SPREADSHEET_ID = '1fMdrHltDZNeSq857KPbXs5K8QXm4SCjCVylCTUX5EdA';
const SHEET_REGISTRO = 'Registro';
const SHEET_JUSTIFICACIONES = 'Justificaciones';
const SHEET_RESUMEN = 'Resumen';

// CAMBIAR ESTA CLAVE Y MANTENERLA EN SECRETO
const API_SECRET = 'CenturiaApi2024!';

/* ============================================================
   CONFIGURACIÓN INICIAL DE HOJAS
   ============================================================ */

function getSheet_(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
    if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === SHEET_REGISTRO) {
      sheet.appendRow(['Fecha','Nombre','Cedula','Carrera','Seccion','Observacion','Estado','MarcaTemporal']);
      sheet.getRange('A:A').setNumberFormat('dd/MM/yyyy');
    } else if (name === SHEET_JUSTIFICACIONES) {
      sheet.appendRow(['FechaAusencia','Cedula','Nombre','Carrera','Motivo','Observacion','MarcaTemporal']);
      sheet.getRange('A:A').setNumberFormat('dd/MM/yyyy');
    } else if (name === SHEET_RESUMEN) {
      sheet.appendRow(['Cedula','Nombre','Carrera','TotalClases','Asistencias','Tardanzas','Ausencias','Porcentaje']);
    }
  }
  return sheet;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ============================================================
   CORS - Manejar peticiones OPTIONS (preflight)
   ============================================================ */

function doOptions(e) {
  return jsonResponse({});
}

/* ============================================================
   LEER ASISTENCIA (GET)
   ============================================================ */

function doGet(e) {
  try {
    const data = e?.parameter || {};
    
    // Validar API key
    const key = (data.apiKey || data.api_secret || '').trim();
    if (key !== API_SECRET) {
      return jsonResponse({ ok: false, error: 'Acceso no autorizado. API key inválida.' });
    }
    
    const modo = data.modo || 'registro';

    if (modo === 'resumen') {
      return jsonResponse({ resumen: obtenerResumen_() });
    }

    if (modo === 'csv') {
      return exportarCSV_();
    }

    if (modo === 'justificaciones') {
      const sheet = getSheet_(SHEET_JUSTIFICACIONES);
      const values = sheet.getDataRange().getValues();
      if (values.length <= 1) return jsonResponse({ justificaciones: [] });
      const headers = values[0];
      const justificaciones = values.slice(1).reverse().map(row => {
        return headers.reduce((acc, h, i) => { 
          acc[h] = row[i]; 
          return acc; 
        }, {});
      });
      return jsonResponse({ justificaciones, total: justificaciones.length });
    }

    // modo = 'registro' por defecto
    const sheet = getSheet_(SHEET_REGISTRO);
    const values = sheet.getDataRange().getValues();

    if (values.length <= 1) return jsonResponse({ registros: [] });

    const headers = values[0];
    const registros = values.slice(1).reverse().map(row => {
      return headers.reduce((acc, h, i) => { 
        acc[h] = row[i]; 
        return acc; 
      }, {});
    });

    return jsonResponse({ registros, total: registros.length });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  }
}

/* ============================================================
   GUARDAR ASISTENCIA (POST)
   ============================================================ */

function doPost(e) {
  try {
    let data = {};
    
    // Intentar leer body JSON
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch(parseErr) {
        console.warn('Error parseando JSON:', parseErr);
      }
    }
    
    // Mergear query params como fallback
    if (e.parameter) {
      Object.keys(e.parameter).forEach(function(key) {
        data[key] = e.parameter[key];
      });
    }
    
    console.log('doPost recibido. Keys:', Object.keys(data).join(', '));

    // Validar API key
    const key = (data.apiKey || data.api_secret || '').trim();
    if (key !== API_SECRET) {
      return jsonResponse({ ok: false, error: 'Acceso no autorizado. API key inválida.' });
    }

    // Modo justificación de ausencia
    if (data.modo === 'justificar') {
      const sheet = getSheet_(SHEET_JUSTIFICACIONES);
      const now = new Date();
      const marcaTemporal = Utilities.formatDate(now, 'America/Asuncion', 'dd/MM/yyyy HH:mm:ss');

      const nombre = (data.studentName || data.nombre || '').trim().toUpperCase();
      const cedula = (data.studentId || data.cedula || '').toString().replace(/\./g, '').trim();
      const carrera = (data.career || data.carrera || '').trim();
      const fechaAusencia = (data.fechaAusencia || data.fecha || '').trim();
      const motivo = (data.motivo || '').trim();
      const observacion = (data.notes || data.observacion || '').trim();

      if (!nombre || !cedula || !carrera || !fechaAusencia) {
        return jsonResponse({ ok: false, error: 'Faltan datos requeridos: nombre, cedula, carrera o fecha de ausencia' });
      }

      const carrerasValidas = [
        'LICENCIATURA EN ADMINISTRACION DE EMPRESAS',
        'LICENCIATURA EN CONTABILIDAD',
        'LICENCIATURA EN ADMINISTRACION ADUANERA',
        'LICENCIATURA EN ADMINISTRACION Y GESTION PUBLICA',
        'INGENIERIA COMERCIAL',
        'MAESTRIA EN ADMINISTRACION Y GESTION PUBLICA',
        'OTRO'
      ];
      const carreraNormalizada = carrera.toUpperCase().trim();
      const carreraValida = carrerasValidas.find(c => carreraNormalizada.includes(c));
      if (!carreraValida) {
        return jsonResponse({ ok: false, error: 'Carrera no válida: ' + carrera });
      }

      sheet.appendRow([fechaAusencia, cedula, nombre, carreraValida, motivo, observacion, marcaTemporal]);
      return jsonResponse({ ok: true, mensaje: 'Justificación registrada correctamente' });
    }

    // Modo asistencia (default)
    const sheet = getSheet_(SHEET_REGISTRO);
    const now = new Date();
    const fechaStr = Utilities.formatDate(now, 'America/Asuncion', 'dd/MM/yyyy');
    const marcaTemporal = Utilities.formatDate(now, 'America/Asuncion', 'dd/MM/yyyy HH:mm:ss');

    const nombre = (data.studentName || data.nombre || '').trim().toUpperCase();
    const cedula = (data.studentId || data.cedula || '').toString().replace(/\./g, '').trim();
    const carrera = (data.career || data.carrera || '').trim();
    const seccion = (data.seccion || data.section || '').trim();
    const observacion = (data.notes || data.observacion || '').trim();

    if (!nombre || !cedula || !carrera || !seccion) {
      return jsonResponse({ ok: false, error: 'Faltan datos requeridos: nombre, cedula, carrera o seccion' });
    }

    // Evitar duplicados exactos en la misma fecha
    const datos = sheet.getDataRange().getValues();
    const yaExiste = datos.some(row => {
      const rowCedula = (row[2] || '').toString().replace(/\./g, '').trim();
      return rowCedula === cedula && row[0] === fechaStr;
    });

    if (yaExiste) {
      return jsonResponse({ ok: false, duplicado: true, mensaje: 'Ya existe un registro para esta cedula en la fecha actual' });
    }

    sheet.appendRow([fechaStr, nombre, cedula, carrera, seccion, observacion, 'Presente', marcaTemporal]);
    recalcularResumen_();

    return jsonResponse({ ok: true, mensaje: 'Asistencia registrada correctamente', duplicado: false });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message || 'Error desconocido' });
  }
}

/* ============================================================
   RECALCULAR RESUMEN (% DE ASISTENCIA)
   ============================================================ */

function recalcularResumen_() {
  try {
    const regSheet = getSheet_(SHEET_REGISTRO);
    const resSheet = getSheet_(SHEET_RESUMEN);

    const datos = regSheet.getDataRange().getValues();
    if (datos.length <= 1) {
      // Limpiar resumen si no hay datos
      if (resSheet.getLastRow() > 1) {
        resSheet.getRange(2, 1, resSheet.getLastRow() - 1, 8).clearContent();
      }
      return;
    }

    // Mapa: cedula -> { nombre, carrera, total, presente, tarde }
    const mapa = {};
    const fechasUnicas = new Set();

    for (let i = 1; i < datos.length; i++) {
      const [fecha, nombre, cedula, carrera, seccion, observacion, estado] = datos[i];
      const cedulaLimpia = (cedula || '').toString().replace(/\./g, '').trim();
      if (!cedulaLimpia) continue;
      
      fechasUnicas.add(fecha);

      if (!mapa[cedulaLimpia]) {
        mapa[cedulaLimpia] = { 
          nombre: nombre || '', 
          carrera: carrera || '', 
          total: 0, 
          presente: 0, 
          tarde: 0 
        };
      }
      mapa[cedulaLimpia].total++;
      if (estado === 'Presente') mapa[cedulaLimpia].presente++;
      else if (estado === 'Tarde') mapa[cedulaLimpia].tarde++;
    }

    const totalClases = fechasUnicas.size;
    const filas = Object.keys(mapa).sort().map(cedula => {
      const r = mapa[cedula];
      const asistencias = r.presente + (r.tarde * 0.5); // Tarde = 0.5
      const ausencias = Math.max(0, totalClases - r.presente - r.tarde);
      const porcentaje = totalClases > 0 ? Math.round((asistencias / totalClases) * 100) : 0;
      return [
        cedula, 
        r.nombre, 
        r.carrera, 
        totalClases, 
        r.presente, 
        r.tarde, 
        ausencias, 
        porcentaje
      ];
    });

    // Limpiar y reescribir
    if (resSheet.getLastRow() > 1) {
      resSheet.getRange(2, 1, resSheet.getLastRow() - 1, 8).clearContent();
    }
    if (filas.length) {
      resSheet.getRange(2, 1, filas.length, 8).setValues(filas);
    }
  } catch (error) {
    console.error('Error en recalcularResumen_:', error);
  }
}

function obtenerResumen_() {
  try {
    const sheet = getSheet_(SHEET_RESUMEN);
    const values = sheet.getDataRange().getValues();
    if (values.length <= 1) return [];

    const headers = values[0];
    return values.slice(1).map(row => {
      return headers.reduce((acc, h, i) => { 
        acc[h] = row[i]; 
        return acc; 
      }, {});
    });
  } catch (error) {
    console.error('Error en obtenerResumen_:', error);
    return [];
  }
}

/* ============================================================
   EXPORTAR CSV (para compatibilidad)
   ============================================================ */

function exportarCSV_() {
  try {
    const sheet = getSheet_(SHEET_REGISTRO);
    const values = sheet.getDataRange().getValues();
    
    if (values.length <= 1) {
      return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
    }

    const csv = values.map(row => 
      row.map(cell => {
        const str = String(cell || '').replace(/"/g, '""');
        return '"' + str + '"';
      }).join(',')
    ).join('\n');

    return ContentService.createTextOutput(csv).setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService.createTextOutput('Error: ' + error.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

/* ============================================================
   FUNCIONES UTILITARIAS (ejecutar manualmente desde el editor)
   ============================================================ */

function recalcularManualmente() {
  recalcularResumen_();
  console.log('Resumen recalculado manualmente');
}

function limpiarDatosDePrueba() {
  const sheet = getSheet_(SHEET_REGISTRO);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 7).clearContent();
  }
  recalcularResumen_();
  console.log('Datos de prueba eliminados');
}

function inicializarHojas() {
  getSheet_(SHEET_REGISTRO);
  getSheet_(SHEET_RESUMEN);
  console.log('Hojas inicializadas correctamente');
}
