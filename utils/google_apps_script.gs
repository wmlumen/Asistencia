/**
 * ASISTENCIA CENTURIA - Google Apps Script
 * ==========================================
 * Planilla: https://docs.google.com/spreadsheets/d/1fMdrHltDZNeSq857KPbXs5K8QXm4SCjCVylCTUX5EdA/edit
 * 
 * INSTRUCCIONES:
 * 1. Copiar este código en el editor de Apps Script
 * 2. Guardar (Ctrl+S)
 * 3. EJECUTAR UNA VEZ la función autorizarDrive() para dar permisos
 * 4. Implementar > Nuevo implementacion > Web App
 * 5. Acceso: Cualquiera
 * 6. Copiar la URL de la Web App y pegarla en asistencia.api.url
 * 
 * IMPORTANTE: La primera vez que se usa Drive, Google pedirá autorización.
 * Asegúrese de aceptar todos los permisos.
 * ==========================================
 */

const SPREADSHEET_ID = '1fMdrHltDZNeSq857KPbXs5K8QXm4SCjCVylCTUX5EdA';
const SHEET_REGISTRO = 'Registro';
const SHEET_RESUMEN = 'Resumen';
const SHEET_PLANIFICACION = 'Planificacion';
const SHEET_EXAMEN = 'ExamenParcial';
const SHEET_EXAMEN_TEST = 'Examen999';

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
    } else if (name === SHEET_RESUMEN) {
      sheet.appendRow(['Cedula','Nombre','Carrera','TotalClases','Presentes','Tardanzas','AusJustificadas','Ausencias','Porcentaje']);
    } else if (name === SHEET_PLANIFICACION) {
      sheet.appendRow(['CODIGO','Cedula','Nombre y Apellido','COD_ASIGNATURA','COD_SECCION','COD_CARRERA','Fecha de Inicio','Fecha de Cierre','SALA','SEDE','Modalidad','Observaciones']);
    } else if (name === SHEET_EXAMEN) {
      sheet.appendRow(['Fecha','Hora','Nombre','Cedula','Carrera','Seccion','Materia','Nota','TipoExamen','MarcaTemporal']);
    } else if (name === SHEET_EXAMEN_TEST) {
      sheet.appendRow(['Fecha','Hora','Nombre','Cedula','Carrera','Seccion','Materia','Nota','TipoExamen','MarcaTemporal']);
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
      const sheet = getSheet_(SHEET_REGISTRO);
      const values = sheet.getDataRange().getValues();
      if (values.length <= 1) return jsonResponse({ justificaciones: [] });
      const headers = values[0];
      const justificaciones = values.slice(1)
        .filter(row => row[6] === 'Ausencia Justificada')
        .reverse()
        .map(row => {
          return headers.reduce((acc, h, i) => { 
            acc[h] = row[i]; 
            return acc; 
          }, {});
        });
      return jsonResponse({ justificaciones, total: justificaciones.length });
    }

    if (modo === 'buscar') {
      const cedula = (data.cedula || '').toString().replace(/\./g, '').trim();
      if (!cedula) return jsonResponse({ registros: [] });
      
      const sheet = getSheet_(SHEET_REGISTRO);
      const values = sheet.getDataRange().getValues();
      if (values.length <= 1) return jsonResponse({ registros: [] });
      
      const headers = values[0];
      const registros = values.slice(1)
        .filter(row => {
          const rowCedula = (row[2] || '').toString().replace(/\./g, '').trim();
          return rowCedula === cedula;
        })
        .reverse()
        .map(row => {
          return headers.reduce((acc, h, i) => { 
            acc[h] = row[i]; 
            return acc; 
          }, {});
        });
      
      console.log('Buscar cedula:', cedula, '- Encontrados:', registros.length);
      return jsonResponse({ registros, total: registros.length });
    }

    if (modo === 'planificaciones') {
      const sheet = getSheet_(SHEET_PLANIFICACION);
      const values = sheet.getDataRange().getValues();
      if (values.length <= 1) return jsonResponse({ planificaciones: [] });
      
      const headers = values[0];
      const planificaciones = values.slice(1).map(row => {
        return headers.reduce((acc, h, i) => { 
          acc[h] = row[i]; 
          return acc; 
        }, {});
      });
      
      return jsonResponse({ planificaciones, total: planificaciones.length });
    }

    // Modo examenes — obtener registros de ExamenParcial
    if (modo === 'examenes') {
      const sheet = getSheet_(SHEET_EXAMEN);
      const values = sheet.getDataRange().getValues();
      if (values.length <= 1) return jsonResponse({ examenes: [] });
      const headers = values[0];
      const examenes = values.slice(1).reverse().map(row => {
        return headers.reduce((acc, h, i) => { 
          acc[h] = row[i]; 
          return acc; 
        }, {});
      });
      return jsonResponse({ examenes, total: examenes.length });
    }

    // Modo catalogos — extrae asignaturas, secciones y carreras únicas de Planificacion
    if (modo === 'catalogos') {
      const sheet = getSheet_(SHEET_PLANIFICACION);
      const values = sheet.getDataRange().getValues();
      if (values.length <= 1) return jsonResponse({ asignaturas: [], secciones: [], carreras: [] });
      
      const asignaturasSet = new Set();
      const seccionesSet = new Set();
      const carrerasSet = new Set();
      
      values.slice(1).forEach(row => {
        const codAsig = (row[3] || '').toString().trim();
        const codSec = (row[4] || '').toString().trim();
        const codCarr = (row[5] || '').toString().trim();
        
        if (codAsig) asignaturasSet.add(codAsig);
        if (codSec) seccionesSet.add(codSec);
        if (codCarr) carrerasSet.add(codCarr);
      });
      
      // Convertir a array de objetos {codigo, nombre}
      const parseItem = (item) => {
        const partes = item.split('-');
        if (partes.length >= 2 && !isNaN(partes[0])) {
          return { codigo: partes[0], nombre: partes.slice(1).join('-') };
        }
        return { codigo: item, nombre: item };
      };
      
      const asignaturas = Array.from(asignaturasSet).sort().map(parseItem);
      const secciones = Array.from(seccionesSet).sort().map(parseItem);
      const carreras = Array.from(carrerasSet).sort().map(parseItem);
      
      return jsonResponse({ asignaturas, secciones, carreras });
    }

    // Modo planificación via GET (para guardar desde planificacion.html)
    if (modo === 'planificacion') {
      const sheet = getSheet_(SHEET_PLANIFICACION);
      
      const codigo = (data.codigo || '').trim();
      const cedula = (data.cedula || '').toString().replace(/\./g, '').trim();
      const nombre = (data.nombre || '').trim().toUpperCase();
      const codAsignatura = (data.codAsignatura || '').trim();
      const codSeccion = (data.codSeccion || '').trim();
      const codCarrera = (data.codCarrera || '').trim();
      const fechaInicio = (data.fechaInicio || '').trim();
      const fechaCierre = (data.fechaCierre || '').trim();
      const sala = (data.sala || '').trim();
      const sede = (data.sede || '').trim();
      const modalidad = (data.modalidad || '').trim();
      const observaciones = (data.observaciones || '').trim();
      
      if (!codigo || !cedula || !nombre || !codAsignatura || !codSeccion || !codCarrera || !fechaInicio || !fechaCierre) {
        return jsonResponse({ ok: false, error: 'Faltan datos requeridos para planificación' });
      }
      
      // Verificar si ya existe el código (editar) o es nuevo
      const valores = sheet.getDataRange().getValues();
      let filaEditar = -1;
      
      for (let i = 1; i < valores.length; i++) {
        if (valores[i][0] === codigo) {
          filaEditar = i + 1;
          break;
        }
      }
      
      if (filaEditar > 0) {
        sheet.getRange(filaEditar, 1, 1, 12).setValues([[codigo, cedula, nombre, codAsignatura, codSeccion, codCarrera, fechaInicio, fechaCierre, sala, sede, modalidad, observaciones]]);
        return jsonResponse({ ok: true, mensaje: 'Planificación actualizada correctamente', codigo: codigo });
      } else {
        sheet.appendRow([codigo, cedula, nombre, codAsignatura, codSeccion, codCarrera, fechaInicio, fechaCierre, sala, sede, modalidad, observaciones]);
        return jsonResponse({ ok: true, mensaje: 'Planificación guardada correctamente', codigo: codigo });
      }
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
      return jsonResponse({ ok: false, error: 'Acceso no autorizado. API key inválida.' });
    }

    // Modo planificación — guarda en hoja Planificacion
    if (data.modo === 'planificacion') {
      const sheet = getSheet_(SHEET_PLANIFICACION);
      
      const codigo = (data.codigo || '').trim();
      const cedula = (data.cedula || '').toString().replace(/\./g, '').trim();
      const nombre = (data.nombre || '').trim().toUpperCase();
      const codAsignatura = (data.codAsignatura || '').trim();
      const codSeccion = (data.codSeccion || '').trim();
      const codCarrera = (data.codCarrera || '').trim();
      const fechaInicio = (data.fechaInicio || '').trim();
      const fechaCierre = (data.fechaCierre || '').trim();
      
      if (!codigo || !cedula || !nombre || !codAsignatura || !codSeccion || !codCarrera || !fechaInicio || !fechaCierre) {
        return jsonResponse({ ok: false, error: 'Faltan datos requeridos para planificación' });
      }
      
      // Verificar si ya existe el código (editar) o es nuevo
      const valores = sheet.getDataRange().getValues();
      let filaEditar = -1;
      
      for (let i = 1; i < valores.length; i++) {
        if (valores[i][0] === codigo) {
          filaEditar = i + 1; // +1 porque Sheets es 1-based
          break;
        }
      }
      
      if (filaEditar > 0) {
        // Editar fila existente
        sheet.getRange(filaEditar, 1, 1, 8).setValues([[codigo, cedula, nombre, codAsignatura, codSeccion, codCarrera, fechaInicio, fechaCierre]]);
        return jsonResponse({ ok: true, mensaje: 'Planificación actualizada correctamente', codigo: codigo });
      } else {
        // Nueva fila
        sheet.appendRow([codigo, cedula, nombre, codAsignatura, codSeccion, codCarrera, fechaInicio, fechaCierre]);
        return jsonResponse({ ok: true, mensaje: 'Planificación guardada correctamente', codigo: codigo });
      }
    }

    // Modo guardar_examen — registra examen parcial en hoja ExamenParcial
    if (data.modo === 'guardar_examen') {
      const sheet = getSheet_(SHEET_EXAMEN);
      const now = new Date();
      const fecha = Utilities.formatDate(now, 'America/Asuncion', 'dd/MM/yyyy');
      const hora = Utilities.formatDate(now, 'America/Asuncion', 'HH:mm:ss');
      const marcaTemporal = Utilities.formatDate(now, 'America/Asuncion', 'dd/MM/yyyy HH:mm:ss');

      const nombre = (data.studentName || data.nombre || '').trim().toUpperCase();
      const cedula = (data.studentId || data.cedula || '').toString().replace(/\./g, '').trim();
      const carrera = (data.career || data.carrera || '').trim();
      const seccion = (data.seccion || data.section || '').trim();
      const materia = (data.materia || '').trim();
      const nota = (data.nota || '').trim();
      const tipoExamen = (data.tipoExamen || 'Parcial').trim();

      if (!nombre || !cedula || !carrera || !seccion || !materia) {
        return jsonResponse({ ok: false, error: 'Faltan datos requeridos: nombre, cedula, carrera, seccion o materia' });
      }

      sheet.appendRow([fecha, hora, nombre, cedula, carrera, seccion, materia, nota, tipoExamen, marcaTemporal]);
      return jsonResponse({ ok: true, mensaje: 'Examen registrado correctamente en la hoja ' + SHEET_EXAMEN });
    }

    // Modo guardar_examen_999 — registra examen en hoja Examen999 (prueba)
    if (data.modo === 'guardar_examen_999') {
      const sheet = getSheet_(SHEET_EXAMEN_TEST);
      const now = new Date();
      const fecha = Utilities.formatDate(now, 'America/Asuncion', 'dd/MM/yyyy');
      const hora = Utilities.formatDate(now, 'America/Asuncion', 'HH:mm:ss');
      const marcaTemporal = Utilities.formatDate(now, 'America/Asuncion', 'dd/MM/yyyy HH:mm:ss');

      const nombre = (data.studentName || data.nombre || '').trim().toUpperCase();
      const cedula = (data.studentId || data.cedula || '').toString().replace(/\./g, '').trim();
      const carrera = (data.career || data.carrera || '').trim();
      const seccion = (data.seccion || data.section || '').trim();
      const materia = (data.materia || '').trim();
      const nota = (data.nota || '').trim();
      const tipoExamen = (data.tipoExamen || 'Parcial').trim();

      if (!nombre || !cedula || !carrera || !seccion || !materia) {
        return jsonResponse({ ok: false, error: 'Faltan datos requeridos: nombre, cedula, carrera, seccion o materia' });
      }

      sheet.appendRow([fecha, hora, nombre, cedula, carrera, seccion, materia, nota, tipoExamen, marcaTemporal]);
      return jsonResponse({ ok: true, mensaje: 'Examen registrado correctamente en la hoja ' + SHEET_EXAMEN_TEST + ' (PRUEBA)' });
    }

    // Modo justificación de ausencia — guarda en Registro con estado "Ausencia Justificada"
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
      const fileData = data.fileData || '';
      const fileName = data.fileName || '';

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
        return jsonResponse({ ok: false, error: 'Carrera no válida: ' + carrera });
      }

      // Subir archivo a Drive si se proporcionó
      let fileUrl = '';
      let fileId = '';
      if (fileData && fileName) {
        try {
          const folderId = '1mpEs3pytsFEWsb1esJRRay9fiktBh8e0';
          console.log('Subiendo archivo a Drive. Folder ID:', folderId);
          console.log('Nombre archivo:', fileName);
          console.log('Tamaño datos:', fileData.length);
          
          const folder = DriveApp.getFolderById(folderId);
          const decoded = Utilities.base64Decode(fileData);
          console.log('Bytes decodificados:', decoded.length);
          
          const blob = Utilities.newBlob(decoded, getMimeType_(fileName), fileName);
          const file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          fileUrl = file.getUrl();
          fileId = file.getId();
          console.log('Archivo subido exitosamente. URL:', fileUrl);
        } catch (driveError) {
          console.error('Error al subir a Drive:', driveError);
          console.error('Stack:', driveError.stack);
        }
      }

      // Construir observación combinada: motivo + link + observación original
      let obsCombinada = motivo ? 'Motivo: ' + motivo : '';
      if (fileUrl) obsCombinada += (obsCombinada ? ' | ' : '') + 'Doc: ' + fileUrl;
      if (observacion) obsCombinada += (obsCombinada ? ' | ' : '') + 'Obs: ' + observacion;

      sheet.appendRow([fechaAusencia, nombre, cedula, carreraValida, seccion, obsCombinada, 'Ausencia Justificada', marcaTemporal]);
      recalcularResumen_();
      return jsonResponse({ ok: true, mensaje: 'Ausencia justificada registrada correctamente en la planilla de asistencia', fileUrl: fileUrl });
    }

    // Modo subir archivo a Drive (separado de la justificación)
    if (data.modo === 'subirArchivo') {
      const nombre = (data.studentName || data.nombre || '').trim().toUpperCase();
      const cedula = (data.studentId || data.cedula || '').toString().replace(/\./g, '').trim();
      const fileData = data.fileData || '';
      const fileName = data.fileName || '';

      if (!fileData || !fileName) {
        return jsonResponse({ ok: false, error: 'No se proporcionó archivo' });
      }

      // Subir archivo a Drive
      let fileUrl = '';
      try {
        const folderId = '1mpEs3pytsFEWsb1esJRRay9fiktBh8e0';
        console.log('Subiendo archivo a Drive. Folder ID:', folderId);
        console.log('Nombre archivo:', fileName);
        console.log('Tamaño datos:', fileData.length);
        
        const folder = DriveApp.getFolderById(folderId);
        const decoded = Utilities.base64Decode(fileData);
        console.log('Bytes decodificados:', decoded.length);
        
        // Renombrar archivo con cédula y nombre para identificarlo
        const nombreArchivo = cedula + '_' + nombre.replace(/\s+/g, '_') + '_' + fileName;
        const blob = Utilities.newBlob(decoded, getMimeType_(fileName), nombreArchivo);
        const file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        fileUrl = file.getUrl();
        console.log('Archivo subido exitosamente. URL:', fileUrl);
        
        return jsonResponse({ ok: true, mensaje: 'Archivo subido correctamente', fileUrl: fileUrl });
      } catch (driveError) {
        console.error('Error al subir a Drive:', driveError);
        console.error('Stack:', driveError.stack);
        return jsonResponse({ ok: false, error: 'Error al subir archivo: ' + driveError.message });
      }
    }

    // Modo asistencia (default) - ahora soporta Presente y Ausencia Justificada
    const sheet = getSheet_(SHEET_REGISTRO);
    const now = new Date();
    const marcaTemporal = Utilities.formatDate(now, 'America/Asuncion', 'dd/MM/yyyy HH:mm:ss');

    const nombre = (data.studentName || data.nombre || '').trim().toUpperCase();
    const cedula = (data.studentId || data.cedula || '').toString().replace(/\./g, '').trim();
    const carrera = (data.career || data.carrera || '').trim();
    const seccion = (data.seccion || data.section || '').trim();
    const observacion = (data.notes || data.observacion || '').trim();
    const estado = (data.estado || 'Presente').trim();
    const fechaAusencia = (data.fechaAusencia || '').trim();

    if (!nombre || !cedula || !carrera || !seccion) {
      return jsonResponse({ ok: false, error: 'Faltan datos requeridos: nombre, cedula, carrera o seccion' });
    }

    // Determinar fecha a usar
    let fechaStr;
    if (estado === 'Ausencia Justificada' && fechaAusencia) {
      // Convertir fecha YYYY-MM-DD a DD/MM/YYYY
      const partes = fechaAusencia.split('-');
      if (partes.length === 3) {
        fechaStr = partes[2] + '/' + partes[1] + '/' + partes[0];
      } else {
        fechaStr = fechaAusencia;
      }
    } else {
      fechaStr = Utilities.formatDate(now, 'America/Asuncion', 'dd/MM/yyyy');
    }

    // Evitar duplicados exactos en la misma fecha (solo para Presente)
    if (estado === 'Presente') {
      const datos = sheet.getDataRange().getValues();
      const yaExiste = datos.some(row => {
        const rowCedula = (row[2] || '').toString().replace(/\./g, '').trim();
        return rowCedula === cedula && row[0] === fechaStr;
      });

      if (yaExiste) {
        return jsonResponse({ ok: false, duplicado: true, mensaje: 'Ya existe un registro para esta cedula en la fecha actual' });
      }
    }

    sheet.appendRow([fechaStr, nombre, cedula, carrera, seccion, observacion, estado, marcaTemporal]);
    recalcularResumen_();

    const mensaje = estado === 'Ausencia Justificada' 
      ? 'Ausencia justificada registrada correctamente' 
      : 'Asistencia registrada correctamente';

    return jsonResponse({ ok: true, mensaje: mensaje, duplicado: false });
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

    // Mapa: cedula -> { nombre, carrera, total, presente, tarde, ausenciaJustificada }
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
      const puntaje = r.presente + (r.tarde * 0.5) + (r.ausenciaJustificada * 0.5); // Tarde y AJ = 0.5
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

/* ============================================================
   PRUEBA MANUAL DE ESCRITURA (ejecutar desde el editor)
   ============================================================ */

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

/* ============================================================
   UTILIDAD: Determinar MIME type por extension de archivo
   ============================================================ */

function getMimeType_(fileName) {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const mimeTypes = {
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/* ============================================================
   AUTORIZAR DRIVE - Ejecutar manualmente antes de usar archivos
   ============================================================ */

function autorizarDrive() {
  try {
    const folderId = '1mpEs3pytsFEWsb1esJRRay9fiktBh8e0';
    const folder = DriveApp.getFolderById(folderId);
    console.log('Drive autorizado correctamente. Carpeta:', folder.getName());
    
    // Crear un archivo de prueba
    const testBlob = Utilities.newBlob('Test', 'text/plain', 'test.txt');
    const testFile = folder.createFile(testBlob);
    testFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    console.log('Archivo de prueba creado:', testFile.getUrl());
    
    // Eliminar archivo de prueba
    testFile.setTrashed(true);
    console.log('Autorización completada exitosamente');
    
    return 'Autorización exitosa. Ya puede subir archivos.';
  } catch (error) {
    console.error('Error de autorización:', error);
    throw new Error('Debe autorizar los permisos de Drive. Vaya a Implementar > Ver implementaciones > Autorizar.');
  }
}
