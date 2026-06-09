/**
 * ASISTENCIA CENTURIA - Google Apps Script
 * ==========================================
 * Planilla: https://docs.google.com/spreadsheets/d/1fMdrHltDZNeSq857KPbXs5K8QXm4SCjCVylCTUX5EdA/edit
 * 
 * INSTRUCCIONES:
 * 1. Copiar este codigo COMPLETO en el editor de Apps Script
 * 2. Guardar (Ctrl+S)
 * 3. Implementar > Nuevo implementacion > Web App
 * 4. Acceso: Cualquiera
 * 5. Copiar la URL y pegarla en asistencia.api.url
 * ==========================================
 */

const SPREADSHEET_ID = '1fMdrHltDZNeSq857KPbXs5K8QXm4SCjCVylCTUX5EdA';
const SHEET_REGISTRO = 'Registro';
const SHEET_RESUMEN = 'Resumen';

// CAMBIAR ESTA CLAVE Y MANTENERLA EN SECRETO
const API_SECRET = 'CenturiaApi2024!';

/* ============================================================
   CONFIGURACION INICIAL DE HOJAS
   ============================================================ */

function getSheet_(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === SHEET_REGISTRO) {
      sheet.appendRow(['Fecha','Nombre','Cedula','Carrera','Seccion','Observacion','Estado','MarcaTemporal']);
      sheet.getRange('A:A').setNumberFormat('dd/MM/yyyy');
    } else if (name === SHEET_RESUMEN) {
      sheet.appendRow(['Cedula','Nombre','Carrera','TotalClases','Presentes','Tardanzas','AusJustificadas','Ausencias','Porcentaje']);
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
      return jsonResponse({ ok: false, error: 'Acceso no autorizado. API key invalida.' });
    }
    
    const modo = data.modo || 'registro';

    if (modo === 'resumen') {
      return jsonResponse({ resumen: obtenerResumen_() });
    }

    if (modo === 'csv') {
      return exportarCSV_();
    }

    if (modo === 'buscar') {
      const cedula = (data.cedula || '').toString().replace(/\./g, '').trim();
      if (!cedula) return jsonResponse({ registros: [] });
      
      const sheet = getSheet_(SHEET_REGISTRO);
      const values = sheet.getDataRange().getValues();
      const headers = values[0];
      const registros = values.slice(1)
        .filter(row => (row[2] || '').toString().replace(/\./g, '').trim() === cedula)
        .map(row => {
          return headers.reduce((acc, h, i) => { acc[h] = row[i]; return acc; }, {});
        })
        .reverse();
      return jsonResponse({ registros, total: registros.length });
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
    // Si se ejecuta manualmente desde el editor, e es undefined
    if (!e) {
      console.log('doPost ejecutado manualmente sin evento HTTP');
      return jsonResponse({ ok: false, error: 'Ejecutar via Web App, no manualmente' });
    }
    
    // Leer datos de query params (el frontend envia todo como URL params)
    const data = e.parameter || {};
    
    console.log('doPost recibido. Keys:', Object.keys(data).join(', '));
    console.log('studentName:', data.studentName);
    console.log('studentId:', data.studentId);

    // Validar API key
    const key = (data.apiKey || data.api_secret || '').trim();
    if (key !== API_SECRET) {
      return jsonResponse({ ok: false, error: 'Acceso no autorizado. API key invalida.' });
    }

    // Modo justificacion de ausencia
    if (data.modo === 'justificar') {
      const sheet = getSheet_(SHEET_REGISTRO);
      const now = new Date();
      const marcaTemporal = Utilities.formatDate(now, 'America/Asuncion', 'dd/MM/yyyy HH:mm:ss');

      const nombre = (data.studentName || data.nombre || '').trim().toUpperCase();
      const cedula = (data.studentId || data.cedula || '').toString().replace(/\./g, '').trim();
      const carrera = (data.career || data.carrera || '').trim();
      const seccion = (data.seccion || data.section || '').trim();
      const fechaAusencia = (data.fechaAusencia || data.fecha || '').trim();
      const motivo = (data.motivo || '').trim();
      const observacion = (data.notes || data.observacion || '').trim();

      if (!nombre || !cedula || !carrera || !seccion || !fechaAusencia) {
        return jsonResponse({ ok: false, error: 'Faltan datos requeridos: nombre, cedula, carrera, seccion o fecha de ausencia' });
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
        return jsonResponse({ ok: false, error: 'Carrera no valida: ' + carrera });
      }

      // Construir observacion combinada
      let obsCombinada = motivo ? 'Motivo: ' + motivo : '';
      if (observacion) obsCombinada += (obsCombinada ? ' | ' : '') + 'Obs: ' + observacion;

      sheet.appendRow([fechaAusencia, nombre, cedula, carreraValida, seccion, obsCombinada, 'Ausencia Justificada', marcaTemporal]);
      recalcularResumen_();
      return jsonResponse({ ok: true, mensaje: 'Ausencia justificada registrada correctamente' });
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
      return jsonResponse({ ok: false, error: 'Faltan datos: ' + [nombre, cedula, carrera, seccion].join('|') });
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
      if (resSheet.getLastRow() > 1) {
        resSheet.getRange(2, 1, resSheet.getLastRow() - 1, 9).clearContent();
      }
      return;
    }

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
          tarde: 0,
          ausenciaJustificada: 0
        };
      }
      mapa[cedulaLimpia].total++;
      if (estado === 'Presente') mapa[cedulaLimpia].presente++;
      else if (estado === 'Tarde') mapa[cedulaLimpia].tarde++;
      else if (estado === 'Ausencia Justificada') mapa[cedulaLimpia].ausenciaJustificada++;
    }

    const totalClases = fechasUnicas.size;
    const filas = Object.keys(mapa).sort().map(cedula => {
      const r = mapa[cedula];
      const puntaje = r.presente + (r.tarde * 0.5) + (r.ausenciaJustificada * 0.5);
      const ausencias = Math.max(0, totalClases - r.presente - r.tarde - r.ausenciaJustificada);
      const porcentaje = totalClases > 0 ? Math.round((puntaje / totalClases) * 100) : 0;
      return [
        cedula, 
        r.nombre, 
        r.carrera, 
        totalClases, 
        r.presente, 
        r.tarde, 
        r.ausenciaJustificada,
        ausencias, 
        porcentaje
      ];
    });

    if (resSheet.getLastRow() > 1) {
      resSheet.getRange(2, 1, resSheet.getLastRow() - 1, 9).clearContent();
    }
    if (filas.length) {
      resSheet.getRange(2, 1, filas.length, 9).setValues(filas);
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
   EXPORTAR CSV
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
   FUNCIONES UTILITARIAS
   ============================================================ */

function recalcularManualmente() {
  recalcularResumen_();
  console.log('Resumen recalculado manualmente');
}

function limpiarDatosDePrueba() {
  const sheet = getSheet_(SHEET_REGISTRO);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 8).clearContent();
  }
  recalcularResumen_();
  console.log('Datos de prueba eliminados');
}

function inicializarHojas() {
  getSheet_(SHEET_REGISTRO);
  getSheet_(SHEET_RESUMEN);
  console.log('Hojas inicializadas correctamente');
}

function probarEscrituraManual() {
  console.log('Iniciando probarEscrituraManual...');
  console.log('SPREADSHEET_ID:', SPREADSHEET_ID);
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('Planilla abierta. Nombre:', ss.getName());
    console.log('URL:', ss.getUrl());
    
    let sheet = ss.getSheetByName(SHEET_REGISTRO);
    console.log('Hoja Registro existe?', sheet ? 'SI' : 'NO');
    
    if (!sheet) {
      console.log('Creando hoja Registro...');
      sheet = ss.insertSheet(SHEET_REGISTRO);
      sheet.appendRow(['Fecha','Nombre','Cedula','Carrera','Seccion','Observacion','Estado','MarcaTemporal']);
      console.log('Hoja creada');
    }
    
    const now = new Date();
    const fechaStr = Utilities.formatDate(now, 'America/Asuncion', 'dd/MM/yyyy');
    const marcaTemporal = Utilities.formatDate(now, 'America/Asuncion', 'dd/MM/yyyy HH:mm:ss');
    
    console.log('Insertando fila...');
    sheet.appendRow([fechaStr, 'TEST MANUAL', '9999999', 'CONTABILIDAD', 'S026', '', 'Presente', marcaTemporal]);
    console.log('Fila insertada. Total filas:', sheet.getLastRow());
    
  } catch (error) {
    console.error('ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}
