// ============================================



// SCRIPT DE CARGA DE CONFIGURACIÃ“N



// Lectura de Datos_Generales.txt y reemplazo de placeholders



// ============================================







// Objeto CONFIG global



let CONFIG = {};







async function cargarConfiguracion() {



    try {



        // Intentar cargar desde archivo externo (raiz o data/)

        let respuesta = await fetch('Datos_Generales.txt');
        if (!respuesta.ok) {

            console.log('No se pudo cargar Datos_Generales.txt, usando valores por defecto');

            throw new Error(`Error: ${respuesta.status}`);

        }

        

        const texto = await respuesta.text();

        CONFIG = parsearConfig(texto);



        



        console.log('CONFIG loaded from file:', CONFIG);



        



    } catch (error) {



        console.log('Usando configuraciÃ³n por defecto:', error.message);



        



        // Valores por defecto hardcodeados en el HTML



        CONFIG = {



            name_docente: 'Christhian Keim',



            cedula_docente: '1340130',



            cedula_prueba: '99',



            grupo: 'S026',



            materia: 'Sociologia',



            ano: '2026',



            fecha_examen: '19/05/2026',



            tiempo_limite: 60,



            intentos_maximos: 2,



            preguntas_seleccion_multiple: 15,



            preguntas_verdadero_falso: 15,



            puntaje_total: 30,



            puntaje_aprobacion: 60,



            link_google_forms: 'https://docs.google.com/forms/d/1vChM_H3-KlrlvSOJPKdSpv4W-80Uv-ObKQKGv99aQUw/viewform',



            link_asistencia: 'https://docs.google.com/spreadsheets/d/1gdGxpa3-z61A7O06smRSv_055KIzH4SBaRYNb-RVYJk/edit?resourcekey=&gid=178512863#gid=178512863',



            link_respuestas: 'https://docs.google.com/spreadsheets/d/1isV0oyTbiSGAWB5DZuNUjU8R3fm8H6pnPxcp_eOHb5s'



        };



    }



    



    // Reemplazar placeholders en todo el documento



    reemplazarPlaceholders();



}







function parsearConfig(texto) {



    const lineas = texto.split('\n');



    const config = {};



    



    lineas.forEach(linea => {



        const trimmed = linea.trim();



        



        // Ignorar lÃ­neas vacÃ­as o comentarios



        if (!trimmed || trimmed.startsWith('#')) {



            return;



        }



        



        const igualIndex = trimmed.indexOf('=');



        if (igualIndex === -1) {



            return;



        }



        



        let clave = trimmed.substring(0, igualIndex).trim();



        const valor = trimmed.substring(igualIndex + 1).trim();



        



        // Reemplazar puntos por guiones bajos



        // tiempo.limite -> tiempo_limite



        clave = clave.replace(/\./g, '_');



        



        config[clave] = valor;



    });



    



    return config;



}







function reemplazarPlaceholders() {



    // Reemplazar en todo el body



    const body = document.body;



    



    // FunciÃ³n recursiva para buscar y reemplazar en todos los nodos



    function procesarNodo(nodo) {



        if (nodo.nodeType === Node.TEXT_NODE) {



            const texto = nodo.textContent;



            // Buscar patrones como ${CONFIG.grupo} o ${CONFIG.tiempo_limite}



            if (texto.includes('${CONFIG.')) {



                const nuevoTexto = texto.replace(/\$\{CONFIG\.([a-zA-Z_]+)\}/g, (match, clave) => {



                    // Intentar con guiones bajos primero



                    if (CONFIG[clave] !== undefined) {



                        return CONFIG[clave];



                    }



                    // Si no existe, dejar el placeholder original



                    return match;



                });



                nodo.textContent = nuevoTexto;



            }



        } else if (nodo.nodeType === Node.ELEMENT_NODE) {



            // Procesar atributos



            const atributos = ['placeholder', 'title', 'alt', 'value', 'href', 'src'];



            atributos.forEach(attr => {



                if (nodo.hasAttribute(attr)) {



                    const valor = nodo.getAttribute(attr);



                    if (valor && valor.includes('${CONFIG.')) {



                        const nuevoValor = valor.replace(/\$\{CONFIG\.([a-zA-Z_]+)\}/g, (match, clave) => {



                            return CONFIG[clave] !== undefined ? CONFIG[clave] : match;



                        });



                        nodo.setAttribute(attr, nuevoValor);



                    }



                }



            });



            



            // Procesar hijos recursivamente



            if (nodo.childNodes) {



                nodo.childNodes.forEach(procesarNodo);



            }



        }



    }



    



    // Procesar todo el body



    if (body) {



        procesarNodo(body);



    }



    



    // Update header elements with CONFIG values



    const headerMateria = document.getElementById('header-materia');



    if (headerMateria) headerMateria.textContent = CONFIG.materia || 'Sociologia General';




    const headerGrupo = document.getElementById('header-grupo');




    if (headerGrupo) headerGrupo.textContent = (CONFIG.grupo ? `${CONFIG.grupo} - ` : '') + (CONFIG.ano || 'Periodo Lectivo Actual');









    // Tambien procesar el titulo de la pagina



    if (document.title && document.title.includes('${CONFIG.')) {



        document.title = document.title.replace(/\$\{CONFIG\.([a-zA-Z_]+)\}/g, (match, clave) => {



            return CONFIG[clave] !== undefined ? CONFIG[clave] : match;



        });



    }



    



    console.log('Placeholders reemplazados correctamente');



}







// ============================================



// INICIALIZACIÃ“N - EJECUTAR UNA VEZ



// ============================================







let configLoaded = false;







async function ensureConfigLoaded() {



    if (configLoaded) return;



    await cargarConfiguracion();



    configLoaded = true;



}







if (document.readyState === 'complete' || document.readyState === 'interactive') {



    ensureConfigLoaded().then(() => {



        initTeacherPanel();
        initAttendanceRegistrationPage();



    });



} else {



    document.addEventListener('DOMContentLoaded', function() {



        ensureConfigLoaded().then(() => {



            initTeacherPanel();
            initAttendanceRegistrationPage();



        });



    });



}







// ============================================



// MAPA DE CLAVES PARA REFERENCIA



// ============================================



// clave_en_archivo -> clave_en_JavaScript



// name.docente -> name_docente



// cedula.docente -> cedula_docente



// tiempo.limite -> tiempo_limite



// intentos.maximos -> intentos_maximos



// preguntas.seleccion.multiple -> preguntas_seleccion_multiple



// preguntas.verdadero.falso -> preguntas_verdadero_falso



// puntaje.total -> puntaje_total



// puntaje.aprobacion -> puntaje_aprobacion



// ==============================



// Teacher Panel Functions



// ==============================







// Storage key for teacher records



const STORAGE_KEY = 'teacherRecords';







/** Load records from localStorage */



function loadRecords() {



    const data = localStorage.getItem(STORAGE_KEY);



    return data ? JSON.parse(data) : [];



}







/** Save records to localStorage */



function saveRecords(records) {



    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));



}







/** Render tables, counters, and stats */



function renderAll() {



    const records = loadRecords();



    const searchTerm = document.getElementById('search-input').value.trim().toLowerCase();



    const careerFilter = document.getElementById('career-filter').value;



    const sortKey = document.getElementById('sort-select').value;







    // Filter records



    let filtered = records.filter(r => {



        const matchesSearch =



            (r.cedula && r.cedula.toString().toLowerCase().includes(searchTerm)) ||



            (r.nombre && r.nombre.toLowerCase().includes(searchTerm)) ||



            (r.carrera && r.carrera.toLowerCase().includes(searchTerm));



        const matchesCareer = careerFilter === '' || r.carrera === careerFilter;



        return matchesSearch && matchesCareer;



    });







    // Sort records



    filtered.sort((a, b) => {



        if (['nombre', 'apellido', 'carrera'].includes(sortKey)) {



            return (a[sortKey] || '').localeCompare(b[sortKey] || '');



        }



        if (sortKey === 'ci') {



            return (a.cedula || 0) - (b.cedula || 0);



        }



        if (sortKey === 'puntaje') {



            return (b.puntaje || 0) - (a.puntaje || 0);



        }



        if (sortKey === 'intento') {



            return (a.intento || 0) - (b.intento || 0);



        }



        return 0;



    });







    // Separate active (estado "Rendiendo") and delivered



    const active = filtered.filter(r => (r.estado || '').toLowerCase() === 'rendiendo');



    const delivered = filtered.filter(r => (r.estado || '').toLowerCase() !== 'rendiendo');



    



    // Populate active table



    const activeBody = document.getElementById('active-students');



    activeBody.innerHTML = '';



    active.forEach(r => {



        const activeRow = document.createElement('tr');



        activeRow.className = "bg-rose-50/30 hover:bg-rose-50/60 transition-all border-b border-slate-100";



        activeRow.innerHTML = `



            <td class="py-3 px-4 font-mono text-slate-500">${r.cedula || ''}</td>



            <td class="py-3 px-4 font-medium text-slate-900">${normalizarNombre(r.nombre)} ${normalizarNombre(r.apellido)}</td>



            <td class="py-3 px-4 text-slate-500">${r.carrera || ''}</td>



            <td class="py-3 px-4 text-center font-medium">${r.intento || ''}</td>



            <td class="py-3 px-4 text-center">



                <span class="inline-flex items-center gap-1 text-red-600 font-semibold">



                    <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span> Escribiendo...



                </span>



            </td>



        `;



        activeBody.appendChild(activeRow);



    });







    // Populate delivered table



    const deliveredBody = document.getElementById('students-list');



    deliveredBody.innerHTML = '';



    // Group by cedula to show both attempts in one row
    const grouped = {};
    delivered.forEach(r => {
        const key = r.cedula || 'sin-ci';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r);
    });

    Object.values(grouped).forEach(recs => {
        const first = recs[0];
        const att1 = recs.find(r => parseInt(r.intento) === 1);
        const att2 = recs.find(r => parseInt(r.intento) === 2);
        const bestAttempt = recs.reduce((max, r) => (parseFloat(r.puntaje) || 0) > (parseFloat(max.puntaje) || 0) ? r : max, recs[0]);

        function getField(rec, ...names) {
            for (const n of names) { const v = rec[n]; if (v) return v; }
            return '';
        }

        const score1 = att1 ? `${att1.puntaje}/${att1.puntajeTotal}` : '-';
        const score2 = att2 ? `${att2.puntaje}/${att2.puntajeTotal}` : '-';
        const fechaHora = bestAttempt ? `${bestAttempt.fecha || ''} ${bestAttempt.hora || ''}`.trim() : '';
        const carrera = getField(first, 'carrera', 'Carrera', 'CARRERA');

        let estadoHTML = `<span class="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">${bestAttempt.estado || 'Entregado'}</span>`;

        const tr = document.createElement('tr');

        tr.className = "hover:bg-slate-50 transition-all cursor-pointer border-b border-slate-100";

        tr.innerHTML = `
            <td class="py-3 px-4 font-mono font-medium text-slate-600">${first.cedula || ''}</td>
            <td class="py-3 px-4 font-semibold text-slate-900">${normalizarNombre(first.nombre)} ${normalizarNombre(first.apellido)}</td>
            <td class="py-3 px-4 text-slate-500">${carrera}</td>
            <td class="py-3 px-4 text-center font-bold ${att1 ? 'text-blue-600' : 'text-slate-300'}">${score1}</td>
            <td class="py-3 px-4 text-center font-bold ${att2 ? 'text-blue-600' : 'text-slate-300'}">${score2}</td>
            <td class="py-3 px-4 text-center text-[11px] text-slate-400">${fechaHora || '-'}</td>
            <td class="py-3 px-4 text-center">${estadoHTML}</td>
            <td class="py-3 px-4 text-center">
                <button data-cedula="${first.cedula || ''}" class="btn-generar-acta text-[10px] bg-institucional-base hover:bg-institucional-dark text-white px-2 py-1 rounded-lg font-semibold transition-all"><i class="fas fa-file-pdf mr-0.5"></i> PDF</button>
            </td>
        `;

        tr.addEventListener('click', (e) => {
            if (e.target.closest('.btn-generar-acta')) return;
            showExamDetail(bestAttempt);
        });

        deliveredBody.appendChild(tr);
    });







    // Update counters



    document.getElementById('active-count').textContent = active.length;



    document.getElementById('total-count').textContent = records.length;



    const avg = records.length ? (records.reduce((sum, r) => sum + (parseFloat(r.puntaje) || 0), 0) / records.length).toFixed(2) : '-';



    document.getElementById('sidebar-active-badge').textContent = active.length; // Update sidebar badge



    document.getElementById('avg-score').textContent = avg;



    // Update career filter options dynamically



    populateCareerFilter(records);



    // Compute and render stats



    computeStats(records);



}











/** Populate career dropdown */



function populateCareerFilter(records) {



    const select = document.getElementById('career-filter');



    const careers = [...new Set(records.map(r => r.carrera).filter(Boolean))];



    // Clear existing except placeholder



    const existing = Array.from(select.options).map(o => o.value);



    careers.forEach(c => {



        if (!existing.includes(c)) {



            const opt = document.createElement('option');



            opt.value = c;



            opt.textContent = c;



            select.appendChild(opt);



        }



    });



}







/** Compute stats per career */



function computeStats(records) {



    const container = document.getElementById('stats-container');



    container.innerHTML = '';



    const stats = {};



    records.forEach(r => {



        const carrera = r.carrera || 'Sin Carrera';



        if (!stats[carrera]) {



            stats[carrera] = { count: 0, totalScore: 0, passed: 0, failed: 0 };



        }



        const s = stats[carrera];



        s.count++;



        const score = parseFloat(r.puntaje) || 0;



        // Only consider the best score for stats if multiple attempts exist for the same student



        // This logic needs to be refined if 'records' already contains only best attempts or all attempts



        // For now, assuming 'records' contains all attempts and we want stats based on individual attempts



        s.totalScore += score; 



        // Assuming CONFIG.puntaje_aprobacion is a percentage, convert score to percentage



        const scorePercentage = (score / (CONFIG.puntaje_total || 30)) * 100;



        const aprobo = scorePercentage >= (CONFIG.puntaje_aprobacion || 60);



        if (aprobo) s.passed++; else s.failed++; //



    });



    for (const [carrera, s] of Object.entries(stats)) {



        const avg = (s.totalScore / s.count).toFixed(2);



        const card = document.createElement('div');



        card.className = 'p-4 border border-slate-200 rounded-xl bg-white shadow-sm';



        card.innerHTML = `



            <div class="flex items-center gap-2 mb-2"><div class="w-2 h-2 rounded-full bg-institucional-accent"></div><h3 class="font-bold text-sm text-slate-900">${carrera}</h3></div>



            <h3 class="font-bold text-sm mb-1">${carrera}</h3>



            <p class="text-xs">Alumnos: ${s.count}</p>



            <p class="text-xs">Promedio: ${avg}</p>



            <p class="text-xs text-green-600">Aprobados: ${s.passed}</p>



            <p class="text-xs text-red-600">Reprobados: ${s.failed}</p>



        `;



        container.appendChild(card);



    }



}







/** Currently selected student cedula for expediente download */



let selectedCedula = null;







/** Show detailed exam info with all attempts, best score, and acta */



function showExamDetail(r) {



    const records = loadRecords();



    const allAttempts = records.filter(rec => rec.cedula === r.cedula);



    const best = allAttempts.reduce((max, rec) => (parseFloat(rec.puntaje) || 0) > (parseFloat(max.puntaje) || 0) ? rec : max, allAttempts[0] || r);



    const bestScore = parseFloat(best.puntaje) || 0;



    const bestTotal = parseFloat(best.puntajeTotal) || 30;



    const bestPct = ((bestScore / bestTotal) * 100).toFixed(0);



    const aprobado = bestPct >= (parseFloat(CONFIG.puntaje_aprobacion) || 60);







    selectedCedula = r.cedula;







    const sorted = allAttempts.sort((a, b) => (a.intento || 1) - (b.intento || 1));



    const rowsHTML = sorted.map(rec => {



        const p = rec.puntaje || 0;



        const t = rec.puntajeTotal || 30;



        return `<tr class="border-b border-slate-100">



            <td class="py-2 px-3 font-medium text-slate-700 text-[12px]">Intento ${rec.intento || 1}</td>



            <td class="py-2 px-3 font-mono text-slate-600 text-[12px]">${p}/${t}</td>



            <td class="py-2 px-3 text-[11px] text-slate-400">${rec.fecha || ''} ${rec.hora || ''}</td>



        </tr>`;



    }).join('');







    const detail = document.getElementById('exam-detail');



    detail.innerHTML = `



        <div class="space-y-4">



            <div class="flex items-start justify-between border-b border-slate-200 pb-3">



                <div>



                    <h3 class="font-bold text-base text-slate-900">${escapeHtml(normalizarNombre(r.nombre))} ${escapeHtml(normalizarNombre(r.apellido))}</h3>



                    <p class="text-xs text-slate-500">C.I.: ${escapeHtml(r.cedula || '')} | ${escapeHtml(r.carrera || '')}</p>



                </div>



                <button data-cedula="${escapeHtml(r.cedula || '')}" class="btn-generar-acta bg-institucional-base hover:bg-institucional-dark text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm"><i class="fas fa-file-pdf mr-1"></i> Generar Acta</button>



            </div>







            <div>



                <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">



                    <table class="w-full text-left text-xs">



                        <thead>



                            <tr class="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px]">



                                <th class="py-2 px-3 font-semibold">Intento</th>



                                <th class="py-2 px-3 font-semibold">Puntaje</th>



                                <th class="py-2 px-3 font-semibold">Fecha/Hora</th>



                            </tr>



                        </thead>



                        <tbody>${rowsHTML}</tbody>



                    </table>



                </div>



                <div class="mt-2 bg-emerald-50 border ${aprobado ? 'border-emerald-400' : 'border-red-300'} rounded-lg px-4 py-2 flex items-center justify-between">



                    <span class="text-[11px] font-semibold text-slate-600">Puntaje VÃ¡lido</span>



                    <div class="text-right">



                        <span class="text-sm font-bold ${aprobado ? 'text-emerald-700' : 'text-red-600'}">${bestScore}/${bestTotal}</span>



                        <span class="text-xs font-semibold ${aprobado ? 'text-emerald-600' : 'text-red-500'} ml-2">${bestPct}% ${aprobado ? 'APROBADO' : 'REPROBADO'}</span>



                    </div>



                </div>



            </div>







            ${best.respuesta ? `



            <div>



                <p class="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Acta del Examen</p>



                <div class="bg-white border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto custom-scrollbar">${formatearRespuesta(best.respuesta)}</div>



            </div>` : ''}



        </div>



    `;







    // Show right panel and expediente button



    const panel = document.getElementById('exam-detail-panel');



    const expedienteBtn = document.getElementById('btn-descargar-expediente');



    if (panel) panel.classList.remove('hidden');



    if (expedienteBtn) expedienteBtn.classList.remove('hidden');



}







function formatearRespuesta(texto) {



    const lineas = texto.split('\n');



    let html = '';



    let enSeccion = false;



    let seccionTipo = '';







    lineas.forEach(linea => {



        const l = linea.trim();







        if (!l) {



            if (enSeccion) html += '</div></div>';



            enSeccion = false;



            return;



        }







        if (l.startsWith('SECCION I') || l.startsWith('SECCION II')) {



            if (enSeccion) html += '</div></div>';



            const icono = l.includes('MULTIPLE') ? 'list-check' : 'check-double';



            html += `<div class="border-b border-slate-100"><div class="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2"><i class="fas fa-${icono} text-institucional-accent"></i> ${escapeHtml(l)}</div><div class="divide-y divide-slate-50">`;



            enSeccion = true;



            seccionTipo = l.includes('MULTIPLE') ? 'multiple' : 'vf';



            return;



        }







        // Parse answer line: I.1: A | Correcta: A | OK | question



        const partes = l.split(' | ');



        if (partes.length >= 4) {



            const numPreg = partes[0].trim();



            const respAlumno = partes[1] ? partes[1].replace('Correcta: ', '').trim() : '';



            const estado = partes[2] ? partes[2].trim() : '';



            const pregunta = partes.slice(3).join(' | ').trim();



            const esOk = estado === 'OK';







            html += `<div class="flex items-start gap-3 px-4 py-2 ${esOk ? 'bg-white' : 'bg-red-50/40'} hover:bg-slate-50/60 transition-colors">



                <span class="flex-shrink-0 w-16 text-[10px] font-mono font-bold ${esOk ? 'text-emerald-600' : 'text-red-500'}">${escapeHtml(numPreg)}</span>



                <div class="flex-1 min-w-0">



                    <p class="text-[11px] text-slate-700 leading-snug">${escapeHtml(pregunta)}</p>



                    <div class="flex flex-wrap items-center gap-2 mt-0.5">



                        <span class="text-[10px] ${esOk ? 'text-emerald-600' : 'text-red-500'}"><span class="text-slate-400">Respuesta:</span> <strong>${escapeHtml(respAlumno)}</strong></span>



                        <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${esOk ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}"><i class="fas fa-${esOk ? 'check' : 'times'}"></i> ${estado}</span>



                    </div>



                </div>



            </div>`;



            return;



        }







        // Parse header lines (Estudiante, Cedula, etc.)



        if (l.includes(':')) {



            const idx = l.indexOf(':');



            const clave = l.substring(0, idx).trim();



            const valor = l.substring(idx + 1).trim();



            const iconos = { Estudiante: 'user-graduate', Cedula: 'id-card', Puntaje: 'star', Intento: 'redo', Fecha: 'calendar-alt' };



            const icono = iconos[clave] || 'info-circle';



            html += `<div class="flex items-center gap-2 px-4 py-1.5 bg-slate-50/50 border-b border-slate-100"><i class="fas fa-${icono} text-slate-400 text-[10px] w-4"></i><span class="text-[10px] font-semibold text-slate-500 w-16">${escapeHtml(clave)}</span><span class="text-[11px] text-slate-800 font-medium">${escapeHtml(valor)}</span></div>`;



            return;



        }







        html += `<div class="px-4 py-1.5 text-[11px] text-slate-600">${escapeHtml(l)}</div>`;



    });







    if (enSeccion) html += '</div></div>';



    return html;



}







function formatearRespuestaPDF(texto) {



    const lineas = texto.split('\n');



    let html = '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;font-size:10px;">';



    let enSeccion = false;







    const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');







    lineas.forEach(linea => {



        const l = linea.trim();



        if (!l) { enSeccion = false; return; }







        if (l.startsWith('SECCION I') || l.startsWith('SECCION II')) {



            html += `<div style="background:#f1f5f9;padding:6px 10px;font-weight:bold;font-size:10px;color:#334155;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e2e8f0;">${esc(l)}</div><div style="border-bottom:1px solid #e2e8f0;">`;



            enSeccion = true;



            return;



        }







        const partes = l.split(' | ');



        if (partes.length >= 4) {



            const numPreg = partes[0].trim();



            const respAlumno = partes[1] ? partes[1].replace('Correcta: ', '').trim() : '';



            const estado = partes[2] ? partes[2].trim() : '';



            const pregunta = partes.slice(3).join(' | ').trim();



            const esOk = estado === 'OK';



            const bg = esOk ? '#ffffff' : '#fef2f2';



            const colorNum = esOk ? '#16a34a' : '#dc2626';



            const colorRpta = esOk ? '#16a34a' : '#dc2626';



            const badgeBg = esOk ? '#dcfce7' : '#fee2e2';



            const badgeColor = esOk ? '#15803d' : '#b91c1c';



            html += `<div style="display:flex;align-items:flex-start;gap:8px;padding:5px 10px;background:${bg};border-bottom:1px solid #f8fafc;">



                <span style="flex-shrink:0;width:48px;font-family:'Courier New',monospace;font-weight:bold;font-size:9px;color:${colorNum};">${esc(numPreg)}</span>



                <div style="flex:1;min-width:0;">



                    <p style="margin:0;font-size:10px;color:#334155;line-height:1.4;">${esc(pregunta)}</p>



                    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:4px;margin-top:2px;">



                        <span style="font-size:9px;color:${colorRpta};"><span style="color:#94a3b8;">Respuesta:</span> <strong>${esc(respAlumno)}</strong></span>



                        <span style="display:inline-flex;align-items:center;gap:2px;padding:1px 5px;border-radius:3px;font-size:8px;font-weight:bold;text-transform:uppercase;background:${badgeBg};color:${badgeColor};">${esOk ? 'âœ“' : 'âœ—'} ${estado}</span>



                    </div>



                </div>



            </div>`;



            return;



        }







        if (l.includes(':')) {



            const idx = l.indexOf(':');



            const clave = l.substring(0, idx).trim();



            const valor = l.substring(idx + 1).trim();



            html += `<div style="display:flex;align-items:center;gap:6px;padding:4px 10px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">



                <span style="font-size:9px;font-weight:600;color:#64748b;width:64px;">${esc(clave)}</span>



                <span style="font-size:10px;color:#1e293b;font-weight:500;">${esc(valor)}</span>



            </div>`;



            return;



        }







        html += `<div style="padding:4px 10px;font-size:10px;color:#475569;">${esc(l)}</div>`;



    });







    if (enSeccion) html += '</div>';



    html += '</div>';



    return html;



}







/** Generate and download full acta PDF for a student's best attempt */



function generarActa(cedula) {



    const records = loadRecords();



    const allAttempts = records.filter(rec => rec.cedula === cedula);



    if (!allAttempts.length) { alert('No se encontraron registros para esta cÃ©dula.'); return; }







    const best = allAttempts.reduce((max, rec) => (parseFloat(rec.puntaje) || 0) > (parseFloat(max.puntaje) || 0) ? rec : max);



    const bestScore = parseFloat(best.puntaje) || 0;



    const bestTotal = parseFloat(best.puntajeTotal) || 30;



    const bestPct = ((bestScore / bestTotal) * 100).toFixed(0);



    const aprobado = bestPct >= (parseFloat(CONFIG.puntaje_aprobacion) || 60);







    const nombre = normalizarNombre(best.nombre);



    const apellido = normalizarNombre(best.apellido);



    const carrera = best.carrera || '';



    const fecha = best.fecha || '';



    const hora = best.hora || '';







    let attemptsList = allAttempts.sort((a, b) => (a.intento || 1) - (b.intento || 1)).map(rec => {



        const p = parseFloat(rec.puntaje) || 0;



        const t = parseFloat(rec.puntajeTotal) || 30;



        return `<tr><td style="padding:4px 8px;border:1px solid #ddd;">Intento ${rec.intento || 1}</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:center;">${p}/${t}</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:center;">${((p/t)*100).toFixed(0)}%</td><td style="padding:4px 8px;border:1px solid #ddd;text-align:center;">${rec.fecha || ''} ${rec.hora || ''}</td></tr>`;



    }).join('');







    const respuesta = best.respuesta || '';







    const win = window.open('', '_blank');



    win.document.write(`



    <!DOCTYPE html>



    <html>



    <head><meta charset="UTF-8"><title>Acta ${nombre} ${apellido}</title>



    <style>



        body { font-family: 'Times New Roman', serif; margin: 20px; font-size: 12px; }



        .acta { border: 3px double #333; padding: 20px; max-width: 800px; margin: 0 auto; }



        h1 { text-align: center; font-size: 16px; margin: 0 0 5px 0; color: #1e3f20; }



        .subtitle { text-align: center; font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; border-bottom: 2px solid #2c5d3d; padding-bottom: 10px; }



        .datos { margin: 10px 0; }



        .datos p { margin: 3px 0; }



        .score-box { text-align: center; padding: 12px; background: #f0fdf4; border: 2px solid ${aprobado ? '#22c55e' : '#ef4444'}; border-radius: 8px; margin: 12px 0; }



        .score-box .num { font-size: 28px; font-weight: bold; color: ${aprobado ? '#16a34a' : '#dc2626'}; }



        .score-box .pct { font-size: 16px; color: ${aprobado ? '#15803d' : '#b91c1c'}; }



        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 11px; }



        th { background: #1e3f20; color: white; padding: 6px 8px; text-align: left; }



        td { padding: 4px 8px; border: 1px solid #ddd; }



        .firmas { display: flex; justify-content: space-between; margin-top: 30px; }



        .firma { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 5px; font-size: 10px; }



        .footer { text-align: center; font-size: 9px; color: #999; margin-top: 15px; }



    </style>



    </head>



    <body>



    <div class="acta">



        <h1>INSTITUTO SUPERIOR CENTURIA</h1>



        <div class="subtitle">Acta de Examen â€” ${CONFIG.materia || 'SociologÃ­a'}</div>







        <div class="datos">



            <p><strong>Estudiante:</strong> ${nombre} ${apellido}</p>



            <p><strong>CÃ©dula:</strong> ${cedula}</p>



            <p><strong>Carrera:</strong> ${carrera}</p>



            <p><strong>Fecha:</strong> ${fecha} ${hora}</p>



            <p><strong>Grupo:</strong> ${CONFIG.grupo || ''}</p>



        </div>







        <div class="score-box">



            <div class="num">${bestScore} / ${bestTotal}</div>



            <div class="pct">${bestPct}% â€” ${aprobado ? 'APROBADO' : 'REPROBADO'}</div>



        </div>







        <h3 style="margin:8px 0 4px;font-size:11px;">Historial de Intentos</h3>



        <table>



            <tr><th>Intento</th><th>Puntaje</th><th>%</th><th>Fecha/Hora</th></tr>



            ${attemptsList}



        </table>







        ${respuesta ? `<h3 style="margin:8px 0 4px;font-size:11px;">Detalle de Respuestas (Mejor Intento)</h3>${formatearRespuestaPDF(respuesta)}` : ''}







        <div class="firmas">



            <div class="firma">Firma del Estudiante</div>



            <div class="firma">Lic. ${CONFIG.name_docente || 'Docente'}</div>



        </div>



        <div class="footer">Documento generado el ${new Date().toLocaleDateString('es-ES')} â€” Sistema de GestiÃ³n AcadÃ©mica</div>



    </div>



    <div style="text-align:center;margin-top:15px;">



        <button onclick="window.print()" style="background:#1e3f20;color:white;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:12px;">Imprimir / Guardar PDF</button>



    </div>



    </body>



    </html>



    `);



    win.document.close();



}







/** Export whole panel as PDF */



function exportPanelPDF() {



    const panel = document.querySelector('main');



    if (!panel) return;



    html2canvas(panel).then(canvas => {



        const imgData = canvas.toDataURL('image/png');



        const pdf = new jspdf.jsPDF('p', 'mm', 'a4');



        const imgProps = pdf.getImageProperties(imgData);



        const pdfWidth = pdf.internal.pageSize.getWidth();



        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;



        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);



        pdf.save('Panel_Docente.pdf');



    });



}







/** Export all tables as a single PDF (reuse same logic) */



function exportAllPDF() {



    exportPanelPDF();



}







/** AutoÃ¢â‚¬â€˜refresh toggle */



let autoRefreshInterval = null;



function toggleAutoRefresh() {



    const chk = document.getElementById('auto-refresh');



    if (chk.checked) {



        if (!autoRefreshInterval) {



            autoRefreshInterval = setInterval(renderAll, 5000);



        }



    } else {



        clearInterval(autoRefreshInterval);



        autoRefreshInterval = null;



    }



}



function toggleImportPanel() {



    const panel = document.getElementById('import-panel');



    if (panel) {



        panel.classList.toggle('hidden');



    }



}







/** Import student JSON files */



function updateSelectedFilesLabel() {



    const input = document.getElementById('import-file');



    const label = document.getElementById('selected-files-label');



    if (!input || !label) return;



    if (!input.files.length) {



        label.textContent = 'NingÃºn archivo seleccionado';



        return;



    }



    const names = Array.from(input.files).map(file => file.name);



    label.textContent = names.join(', ');



}







function updateSelectedConfigLabel() {



    const input = document.getElementById('config-file');



    const label = document.getElementById('selected-config-label');



    if (!input || !label) return;



    if (!input.files.length) {



        label.textContent = 'NingÃºn archivo de configuraciÃ³n seleccionado';



        return;



    }



    const names = Array.from(input.files).map(file => file.name);



    label.textContent = names.join(', ');



}







function importConfigFile() {



    const input = document.getElementById('config-file');



    if (!input || !input.files.length) {



        alert('Seleccione el archivo Datos_Generales.txt para cargar la configuraciÃ³n.');



        return;



    }







    const file = input.files[0];



    const reader = new FileReader();



    reader.onload = function(e) {



        try {



            const text = e.target.result;



            const parsedConfig = parsearConfig(text);



            if (Object.keys(parsedConfig).length === 0) {



                alert('El archivo de configuraciÃ³n no tiene datos vÃ¡lidos.');



                return;



            }



            CONFIG = { ...CONFIG, ...parsedConfig };



            reemplazarPlaceholders();



            updateSelectedConfigLabel();



            alert('ConfiguraciÃ³n de Datos_Generales cargada correctamente.');



        } catch (err) {



            console.error('Error al leer Datos_Generales.txt:', err);



            alert('No se pudo leer el archivo de configuraciÃ³n. Verifique que sea un archivo de texto vÃ¡lido.');



        }



    };



    reader.readAsText(file, 'UTF-8');



}







function importStudentJSONWithUI() {

    const input = document.getElementById('import-file');

    const files = Array.from(input.files);

    if (!files.length) {

        alert('Seleccione al menos un archivo JSON para procesar.');

        return;

    }

    Promise.all(files.map(f => f.text().then(JSON.parse)))

        .then(arrays => {

            const newRecs = arrays.flat().map(corregirRecord);

            const records = loadRecords();

            records.push(...newRecs);

            saveRecords(records);

            renderAll();

            input.value = '';

            updateSelectedFilesLabel();

            alert(`Se cargaron ${newRecs.length} registros correctamente.`);

        })

        .catch(err => {

            console.error('Import error:', err);

            alert('Error importando archivos JSON. Verifique el formato y vuelva a intentarlo.');

        });

}




function updateSelectedCSVLabel() {

    const input = document.getElementById('import-csv');

    const label = document.getElementById('selected-csv-label');

    if (!input || !label) return;

    if (!input.files.length) { label.textContent = 'NingÃºn archivo CSV seleccionado'; return; }

    label.textContent = Array.from(input.files).map(f => f.name).join(', ');

}

function importCSVWithUI() {

    const input = document.getElementById('import-csv');

    if (!input || !input.files.length) { alert('Seleccione un archivo CSV para procesar.'); return; }

    const file = input.files[0];

    const reader = new FileReader();

    reader.onload = function(e) {

        try {

            const text = e.target.result;

            const rows = parseCSV(text);

            if (!rows.length) { alert('El archivo CSV no contiene datos vÃ¡lidos.'); return; }

            const carreraDefault = CONFIG.seccion || '';

            const newRecs = rows.map(r => {

                const puntajeRaw = (r['Puntaje'] || '0/0');

                const pp = puntajeRaw.split('/');

                const fh = (r['Marca temporal'] || '').split(' ');

                return {

                    cedula: (r['Cedula'] || '').replace(/\./g, ''),

                    nombre: (r['Nombre Apellido'] || '').trim(),

                    apellido: '',

                    carrera: r['CARRERA'] || carreraDefault,

                    puntaje: parseFloat(pp[0]) || 0,

                    puntajeTotal: parseInt(pp[1]) || 30,

                    intento: parseInt(r['Intento']) || 1,

                    fecha: fh[0] || r['Fecha'] || '',

                    hora: fh[1] || r['Hora'] || '',

                    estado: 'Entregado',

                    respuesta: r['Respuesta'] || ''

                };

            });

            const corrected = newRecs.map(corregirRecord);

            const records = loadRecords();

            records.push(...corrected);

            saveRecords(records);

            renderAll();

            input.value = '';

            updateSelectedCSVLabel();

            alert(`Se importaron ${corrected.length} registros desde CSV correctamente.`);

        } catch (err) {

            console.error('CSV import error:', err);

            alert('Error importando CSV. Verifique el formato (separador punto y coma).');

        }

    };

    reader.readAsText(file, 'UTF-8');

}

function exportarGestion() {

    const records = loadRecords();

    const data = JSON.stringify(records, null, 2);

    const blob = new Blob([data], { type: 'application/json' });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');

    link.href = url;

    link.download = `gestion_docente_${new Date().toISOString().slice(0,10)}.json`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

}

function limpiarResultados() {

    if (confirm('Â¿Eliminar todos los resultados?')) {

        localStorage.removeItem(STORAGE_KEY);

        renderAll();

    }

}








// ============================================



// ATTENDANCE FUNCTIONS



// ============================================







const ATTENDANCE_KEY = 'attendanceRecords';

const DEFAULT_ATTENDANCE_CAREERS = ['Ingenieria Comercial', 'Contabilidad'];

function getAttendanceApiUrl() {
    return (CONFIG.asistencia_api_url || '').trim();
}

function getApiKey() {
    return ((CONFIG.apiSecret || CONFIG.api_secret || '') ).trim();
}

function getAttendancePublicUrl() {
    // El QR y el enlace publico apuntan a la PAGINA WEB (asistencia.html)
    // El Google Form se abre solo desde el boton "Abrir Formulario"
    const configured = (CONFIG.asistencia_public_url || '').trim();
    if (configured) return configured;

    try {
        return new URL('asistencia.html', window.location.href).toString();
    } catch (error) {
        return 'asistencia.html';
    }
}

function getAttendanceCsvUrl() {
    return (CONFIG.asistencia_csv_url || '').trim();
}

function parseCSVToAttendance(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];

    const parseRow = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result.map(v => v.replace(/^"|"$/g, ''));
    };

    const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/\s/g, ''));
    const findHeader = (...candidates) => {
        for (const c of candidates) {
            const idx = headers.indexOf(c.toLowerCase().replace(/\s/g, ''));
            if (idx !== -1) return idx;
        }
        return -1;
    };

    const idxNombre = findHeader('nombre', 'name', 'studentname', 'alumno', 'nombreyapellido');
    const idxCedula = findHeader('cedula', 'id', 'studentid', 'ci', 'documento', 'matricula', 'ceduladeidentidad', 'ceduladeidentidad');
    const idxCarrera = findHeader('carrera', 'career', 'curso', 'carrerauniversitaria');
    const idxObs = findHeader('observacion', 'notes', 'observation', 'comentario', 'obs');
    const idxEstado = findHeader('estado', 'state', 'status', 'asistencia', 'condicion');
    const idxFecha = findHeader('marcatemporal', 'timestamp', 'fecha', 'date', 'hora', 'fechahora');

    const records = [];
    for (let i = 1; i < lines.length; i++) {
        const values = parseRow(lines[i]);
        const nombre = values[idxNombre] || '';
        const cedula = (values[idxCedula] || '').toString().replace(/\./g, '').trim();
        const carrera = values[idxCarrera] || '';
        const observacion = values[idxObs] || '';
        const estado = (values[idxEstado] || 'Presente').trim();
        const marcaTemporal = values[idxFecha] || '';

        if (nombre || cedula) {
            records.push({ nombre, cedula, carrera, observacion, estado, marcaTemporal });
        }
    }
    return records;
}

async function getAttendanceCareers() {
    let allCareers = [];

    try {
        const response = await fetch('cursos.json');
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                allCareers.push(...data.map(c => c.nombre));
            }
        }
    } catch (e) {
        console.warn('Could not load cursos.json', e);
    }

    const raw = CONFIG.asistencia_carreras || CONFIG.seccion || '';
    const configCareers = raw.split(/[\n|,;]+/).map(item => item.trim()).filter(Boolean);
    allCareers.push(...configCareers);

    if (allCareers.length === 0) {
        allCareers = DEFAULT_ATTENDANCE_CAREERS;
    }

    // Filtrar aquellas que tengan un asterisco (*)
    const activeCareers = allCareers.filter(c => c.includes('*'));

    let finalNames = [];
    if (activeCareers.length > 0) {
        // Si hay alguna con asterisco, SOLO mostramos esas (quitando el asterisco)
        finalNames = activeCareers.map(c => c.replace(/\*/g, '').trim());
    } else {
        // Si no hay asteriscos, mostramos todas
        finalNames = allCareers.map(c => c.replace(/\*/g, '').trim());
    }

    return [...new Set(finalNames)];
}

function normalizeAttendanceRecord(record) {
    const normalized = {
        marcaTemporal: record.marcaTemporal || record.timestamp || '',
        nombre: record.nombre || record.studentName || '',
        cedula: (record.cedula || record.studentId || '').toString().replace(/\./g, '').trim(),
        carrera: record.carrera || record.career || '',
        observacion: record.observacion || record.notes || '',
        estado: record.estado || 'Presente'
    };

    return corregirRecord(normalized);
}

function parseAttendanceResponse(payload) {
    const source = Array.isArray(payload) ? payload : (Array.isArray(payload?.records) ? payload.records : (Array.isArray(payload?.registros) ? payload.registros : []));
    return source.map(normalizeAttendanceRecord).filter(r => r.nombre || r.cedula);
}

async function fetchAttendanceRemoteRecords() {
    // Intentar leer desde CSV publico primero
    const csvUrl = getAttendanceCsvUrl();
    if (csvUrl) {
        try {
            const response = await fetch(csvUrl);
            if (response.ok) {
                const text = await response.text();
                const records = parseCSVToAttendance(text);
                if (records && records.length) return records;
            }
        } catch (e) {
            console.warn('No se pudo leer CSV publico:', e);
        }
    }

    const apiUrl = getAttendanceApiUrl();
    const apiKey = getApiKey();
    if (apiUrl) {
        const url = apiKey ? (apiUrl + (apiUrl.includes('?') ? '&' : '?') + 'apiKey=' + encodeURIComponent(apiKey)) : apiUrl;
        const response = await fetch(url, { method: 'GET' });
        if (!response.ok) {
            throw new Error('No se pudo leer la asistencia desde Drive.');
        }
        const payload = await response.json();
        return parseAttendanceResponse(payload);
    }

    return null;
}

async function syncAttendanceFromRemote() {
    const records = await fetchAttendanceRemoteRecords();
    if (!records) return loadAttendanceRecords();
    saveAttendanceRecords(records);
    return records;
}

function updateAttendanceSourceStatus(message, isError = false) {
    const target = document.getElementById('attendance-source-status');
    if (!target) return;

    target.textContent = message;
    target.className = isError
        ? 'text-xs text-rose-600 font-medium'
        : 'text-xs text-slate-500 font-medium';
}

function updateAttendancePublicLink() {
    const link = document.getElementById('attendance-public-link');
    if (!link) return;
    link.href = getAttendancePublicUrl();
}







function loadAttendanceRecords() {



    const data = localStorage.getItem(ATTENDANCE_KEY);



    return data ? JSON.parse(data) : [];



}







function saveAttendanceRecords(records) {



    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));



}

async function submitAttendanceRecord(payload) {
    const apiUrl = getAttendanceApiUrl();
    const apiKey = getApiKey();
    const normalized = normalizeAttendanceRecord(payload);

    if (apiUrl) {
        const body = {
            studentName: normalized.nombre,
            studentId: normalized.cedula,
            career: normalized.carrera,
            notes: normalized.observacion,
            estado: normalized.estado,
            timestamp: normalized.marcaTemporal,
            sourcePage: getAttendancePublicUrl()
        };
        if (apiKey) body.apiKey = apiKey;

        const response = await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error('No se pudo guardar la asistencia en Drive.');
        }

        return normalized;
    }

    const records = loadAttendanceRecords();
    records.unshift(normalized);
    saveAttendanceRecords(records);
    return normalized;
}

async function refreshAttendanceData() {
    try {
        // Intentar leer desde API (Apps Script Web App)
        const apiUrl = getAttendanceApiUrl();
        if (apiUrl) {
            const records = await syncAttendanceFromRemote();
            updateAttendanceSourceStatus('Fuente: Drive sincronizado');
            renderAttendance();
            renderPublicAttendancePreview(records);
            return records;
        }

        // Intentar leer desde CSV publico del Google Form
        const csvUrl = getAttendanceCsvUrl();
        if (csvUrl) {
            try {
                const response = await fetch(csvUrl);
                if (response.ok) {
                    const text = await response.text();
                    const records = parseCSVToAttendance(text);
                    updateAttendanceSourceStatus('Fuente: Formulario Google (CSV)');
                    renderAttendance();
                    renderPublicAttendancePreview(records);
                    return records;
                }
            } catch (csvError) {
                console.warn('No se pudo leer CSV:', csvError);
            }
        }

        // Fallback: localStorage
        const records = loadAttendanceRecords();
        updateAttendanceSourceStatus('Fuente: almacenamiento local');
        renderAttendance();
        renderPublicAttendancePreview(records);
        return records;
    } catch (error) {
        updateAttendanceSourceStatus(error.message || 'Error al sincronizar asistencia', true);
        renderAttendance();
        renderPublicAttendancePreview(loadAttendanceRecords());
        throw error;
    }
}

function escapeHtml(text) {
    if (text == null) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderAttendance(records) {
    const tbody = document.getElementById('attendance-body');
    const badge = document.getElementById('attendance-count-badge');
    const sidebarBadge = document.getElementById('sidebar-attendance-badge');
    if (!tbody) return;

    const safeRecords = Array.isArray(records) ? records : loadAttendanceRecords();
    const cedulasUnicas = new Set(safeRecords.map(r => (r.cedula || r.Cedula || r.studentId || '').toString().replace(/\./g, '').trim()).filter(Boolean)).size;
    const countText = cedulasUnicas + ' asistentes';
    if (badge) badge.textContent = countText;
    if (sidebarBadge) sidebarBadge.textContent = cedulasUnicas;

    if (!safeRecords.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="py-10 text-center text-slate-400"><i class="fas fa-clipboard text-2xl text-slate-300 mb-2 block"></i>Use el módulo de carga para importar los registros de asistencia.</td></tr>';
        return;
    }

    tbody.innerHTML = safeRecords.slice(0, 100).map(r => {
        const marcaTemporal = r.marcaTemporal || r['Marca Temporal'] || r['Timestamp'] || r.timestamp || r.Fecha || '';
        const nombre = r.nombre || r['Nombre'] || r.studentName || r.Nombre || '';
        const cedula = r.cedula || r['Cédula'] || r['Cedula'] || r.studentId || r.Cedula || '';
        const carrera = r.carrera || r['Carrera'] || r.career || r.Carrera || '';
        return '<tr class="hover:bg-slate-50/80 transition-all border-b border-slate-100">' +
            '<td class="py-3 px-5 text-slate-500">' + escapeHtml(marcaTemporal) + '</td>' +
            '<td class="py-3 px-5 font-medium text-slate-900">' + escapeHtml(normalizarNombre(nombre)) + '</td>' +
            '<td class="py-3 px-5 text-slate-600">' + escapeHtml(cedula) + '</td>' +
            '<td class="py-3 px-5 text-slate-500">' + escapeHtml(carrera) + '</td>' +
        '</tr>';
    }).join('');
}

function updateSelectedAttendanceLabel() {



    const input = document.getElementById('attendance-file');



    const label = document.getElementById('selected-attendance-label');



    if (!input || !label) return;



    label.textContent = input.files.length ? input.files[0].name : 'NingÃºn archivo seleccionado';



}







function procesarAttendanceFile(file) {



    return new Promise((resolve, reject) => {



        const reader = new FileReader();



        reader.onload = function(ev) {



            try {



                const text = ev.target.result;



                const lines = text.split('\n').filter(l => l.trim());



                if (lines.length < 2) {



                    resolve([]);



                    return;



                }



                const records = [];



                for (let i = 1; i < lines.length; i++) {



                    const parts = lines[i].split('\t');



                    if (parts.length < 3) continue;



                    const marcaTemporal = parts[0].trim();



                    const nombre = parts[1] ? parts[1].trim() : '';



                    const cedula = parts[2] ? parts[2].trim().replace(/\./g, '') : '';



                    const carrera = parts[3] ? parts[3].trim() : '';



                    if (!nombre && !cedula) continue;



                    records.push({ marcaTemporal, nombre, cedula, carrera });



                }



                resolve(records);



            } catch (err) {



                reject(err);



            }



        };



        reader.onerror = reject;



        reader.readAsText(file, 'UTF-8');



    });



}







// ============================================



// UNIFIED PROCESS ALL FILES



// ============================================







async function procesarTodo() {



    const results = { json: 0, csv: 0, config: false, attendance: 0 };



    const errors = [];







    // 1. Process JSON files



    const jsonInput = document.getElementById('import-file');



    if (jsonInput && jsonInput.files.length) {



        try {



            const files = Array.from(jsonInput.files);



            const arrays = await Promise.all(files.map(f => f.text().then(JSON.parse)));

            const newRecs = arrays.flat().map(corregirRecord);

            const records = loadRecords();

            records.push(...newRecs);

            saveRecords(records);

            results.json = newRecs.length;

        } catch (err) {

            errors.push('Error en JSON: ' + err.message);

        }

    }

    // 2. Process CSV file

    const csvInput = document.getElementById('import-csv');

    if (csvInput && csvInput.files.length) {

        try {

            const file = csvInput.files[0];

            const text = await file.text();

            const rows = parseCSV(text);

            if (rows.length) {

                const carreraDefault = CONFIG.seccion || '';

                const newRecs = rows.map(r => {

                    const puntajeRaw = (r['Puntaje'] || '0/0');

                    const pp = puntajeRaw.split('/');

                    const fh = (r['Marca temporal'] || '').split(' ');

                    return {

                        cedula: (r['Cedula'] || '').replace(/\./g, ''),

                        nombre: (r['Nombre Apellido'] || '').trim(),

                        apellido: '',

                        carrera: r['CARRERA'] || carreraDefault,

                        puntaje: parseFloat(pp[0]) || 0,

                        puntajeTotal: parseInt(pp[1]) || 30,

                        intento: parseInt(r['Intento']) || 1,

                        fecha: fh[0] || r['Fecha'] || '',

                        hora: fh[1] || r['Hora'] || '',

                        estado: 'Entregado',

                        respuesta: r['Respuesta'] || ''

                    };

                });

                const corrected = newRecs.map(corregirRecord);

                const records = loadRecords();

                records.push(...corrected);

                saveRecords(records);

                results.csv = corrected.length;

            }

        } catch (err) {

            errors.push('Error en CSV: ' + err.message);

        }

    }

    // 3. Process config file



    const configInput = document.getElementById('config-file');



    if (configInput && configInput.files.length) {



        try {



            const file = configInput.files[0];



            const text = await file.text();



            const parsedConfig = parsearConfig(text);



            if (Object.keys(parsedConfig).length) {



                CONFIG = { ...CONFIG, ...parsedConfig };



                reemplazarPlaceholders();



                results.config = true;



            }



        } catch (err) {



            errors.push('Error en Config: ' + err.message);



        }



    }







    // 4. Process attendance file



    const attInput = document.getElementById('attendance-file');



    if (attInput && attInput.files.length) {



        try {



            const attRecs = (await procesarAttendanceFile(attInput.files[0])).map(corregirRecord);

            if (attRecs.length) {

                saveAttendanceRecords(attRecs);
                results.attendance = attRecs.length;



                document.getElementById('sidebar-attendance-badge').textContent = attRecs.length;



            }



        } catch (err) {



            errors.push('Error en Asistencia: ' + err.message);



        }



    }







    // Clear all file inputs



    [jsonInput, csvInput, configInput, attInput].forEach(inp => {



        if (inp) { inp.value = ''; }



    });



    updateSelectedFilesLabel();



    updateSelectedCSVLabel();



    updateSelectedConfigLabel();



    updateSelectedAttendanceLabel();







    // Refresh UI



    renderAll();



    renderAttendance();







    // Build result message



    let msg = [];



    if (results.json) msg.push(`${results.json} registros JSON`);



    if (results.csv) msg.push(`${results.csv} registros CSV`);



    if (results.config) msg.push('configuraciÃ³n cargada');



    if (results.attendance) msg.push(`${results.attendance} registros de asistencia`);



    const success = msg.length ? 'âœ“ ' + msg.join(', ') + '.' : '';



    const errorMsg = errors.length ? '\nÃ¢Å¡Â  ' + errors.join('\n') : '';



    alert(success + errorMsg || 'No se seleccionaron archivos para procesar.');



}









function renderPublicAttendancePreview(records = loadAttendanceRecords()) {
    const tbody = document.getElementById('public-attendance-body');
    const counter = document.getElementById('public-attendance-count');
    if (!tbody) return;

    const safeRecords = Array.isArray(records) ? records : [];
    if (counter) counter.textContent = String(safeRecords.length);

    if (!safeRecords.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-slate-400">Aun no hay registros para mostrar.</td></tr>';
        return;
    }

    tbody.innerHTML = safeRecords.slice(0, 12).map(r => {
        // Normalizar campos (CSV de Google Form usa nombres diferentes)
        const marcaTemporal = r.marcaTemporal || r['Marca Temporal'] || r['Timestamp'] || r.timestamp || r.Fecha || '';
        const nombre = r.nombre || r['Nombre'] || r.studentName || r.Nombre || '';
        const cedula = r.cedula || r['Cédula'] || r['Cedula'] || r.studentId || r.Cedula || '';
        const carrera = r.carrera || r['Carrera'] || r.career || r.Carrera || '';
        
        return `
        <tr class="border-b border-slate-100">
            <td class="px-4 py-3 text-slate-500">${escapeHtml(marcaTemporal)}</td>
            <td class="px-4 py-3 font-medium text-slate-900">${escapeHtml(normalizarNombre(nombre))}</td>
            <td class="px-4 py-3 text-slate-600">${escapeHtml(cedula)}</td>
            <td class="px-4 py-3 text-slate-500">${escapeHtml(carrera)}</td>
        </tr>
    `}).join('');
}

function corregirTexto(text) {

    if (typeof text !== 'string') return text;
    // Fix Ãƒ + char U+0080-U+00BF -> original U+00C0-U+00FF
    return text.replace(/\u00c3([\u0080-\u00bf])/g, (_, c) =>
        String.fromCharCode(0xC0 | (c.charCodeAt(0) & 0x3F))
    ).replace(/\u00c2([\u0080-\u00bf])/g, (_, c) =>
        String.fromCharCode(0x80 | (c.charCodeAt(0) & 0x3F))
    );

}

function corregirRecord(rec) {
    const out = {};
    for (const [k, v] of Object.entries(rec)) {
        out[k] = typeof v === 'string' ? corregirTexto(v) : v;
    }
    return out;
}

function normalizarNombre(text) {

    return (text || '').toUpperCase().trim();

}




// ============================================



// SUMMARY BY CAREER



// ============================================







function computeCareerSummary() {



    const records = loadRecords();



    const summary = {};



    records.forEach(r => {



        const carrera = r.carrera || 'Sin Carrera';



        if (!summary[carrera]) {



            summary[carrera] = { count: 0, totalScore: 0, passed: 0, failed: 0, students: new Set() };



        }



        const s = summary[carrera];



        s.count++;



        s.totalScore += parseFloat(r.puntaje) || 0;



        const pct = ((parseFloat(r.puntaje) || 0) / (parseFloat(r.puntajeTotal) || 30)) * 100;



        if (pct >= (parseFloat(CONFIG.puntaje_aprobacion) || 60)) {



            s.passed++;



        } else {



            s.failed++;



        }



        if (r.cedula) s.students.add(r.cedula);



    });



    return summary;



}







function abrirEnlace(inputId) {



    const input = document.getElementById(inputId);



    if (input && input.value.trim()) {



        window.open(input.value.trim(), '_blank');



    }



}







/** Manual refresh button */



function actualizarPanel() {



    renderAll();



}







/** Close the right detail panel */



function cerrarPanel() {



    const panel = document.getElementById('exam-detail-panel');



    const expedienteBtn = document.getElementById('btn-descargar-expediente');



    if (panel) panel.classList.add('hidden');



    if (expedienteBtn) expedienteBtn.classList.add('hidden');



    selectedCedula = null;



}







/** Initialize after configuration */

function initTeacherPanel() {
    if (!document.getElementById('teacher-panel')) return;

    renderAll();

    updateAttendancePublicLink();
    refreshAttendanceData().catch(() => {});

    // Event delegation for generar-acta buttons

    document.addEventListener('click', function(e) {



        const btn = e.target.closest('.btn-generar-acta');



        if (btn) {



            const cedula = btn.getAttribute('data-cedula');



            if (cedula) generarActa(cedula);



        }



    });



    // Close panel button



    const closeBtn = document.getElementById('btn-cerrar-panel');



    if (closeBtn) closeBtn.addEventListener('click', cerrarPanel);



    // Expediente download button



    const expBtn = document.getElementById('btn-descargar-expediente');



    if (expBtn) {



        expBtn.addEventListener('click', function() {



            if (selectedCedula) generarActa(selectedCedula);



        });



    }



    // Search on enter or single match scrolls to row



    const searchInput = document.getElementById('search-input');



    if (searchInput) {



        searchInput.addEventListener('keydown', function(e) {



            if (e.key === 'Enter') {



                const records = loadRecords();



                const term = this.value.trim().toLowerCase();



                const match = records.find(r =>



                    (r.cedula && r.cedula.toString().toLowerCase() === term) ||



                    (r.nombre && r.nombre.toLowerCase().includes(term))



                );



                if (match) {



                    renderAll();



                    showExamDetail(match);



                }



            }



        });



    }



}







function selectCareer(button) {
    const container = document.getElementById('career-buttons-container');
    if (!container) return;
    
    // Quitar selección de todos los botones
    container.querySelectorAll('.career-btn').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // Seleccionar el botón clickeado
    button.classList.add('selected');
    
    // Guardar valor en el input hidden
    const hiddenInput = document.getElementById('attendance-career');
    if (hiddenInput) {
        hiddenInput.value = button.getAttribute('data-career');
    }
}

function initAttendanceRegistrationPage() {
    const form = document.getElementById('attendance-registration-form');
    if (!form) return;

    const careerInput = document.getElementById('attendance-career');
    const qrTarget = document.getElementById('attendance-qr');
    const pageLink = document.getElementById('attendance-page-link');
    const status = document.getElementById('attendance-form-status');

    if (pageLink) {
        const publicUrl = getAttendancePublicUrl();
        pageLink.href = publicUrl;
        pageLink.textContent = publicUrl;
    }

    const btnOficial = document.getElementById('btn-formulario-oficial');
    if (btnOficial) {
        const formUrl = (CONFIG.link_google_forms || '').trim();
        if (formUrl) {
            btnOficial.href = formUrl;
        }
    }

    if (qrTarget && typeof QRCode !== 'undefined') {
        qrTarget.innerHTML = '';
        new QRCode(qrTarget, {
            text: getAttendancePublicUrl(),
            width: 210,
            height: 210
        });
    }

    refreshAttendanceData().catch(() => {});

    const idInput = document.getElementById('attendance-id');
    const nameInput = document.getElementById('attendance-name');

    if (idInput && nameInput) {
        idInput.addEventListener('blur', function() {
            const ced = this.value.trim().replace(/\./g, '');
            if (!ced) return;

            let found = loadRecords().find(r => r.cedula === ced);
            if (!found) {
                found = loadAttendanceRecords().find(r => r.cedula === ced);
            }

            if (found && found.nombre) {
                if (!nameInput.value.trim()) {
                    nameInput.value = found.nombre;
                }
                // Seleccionar carrera automáticamente si coincide
                if (found.carrera) {
                    const container = document.getElementById('career-buttons-container');
                    if (container) {
                        container.querySelectorAll('.career-btn').forEach(btn => {
                            if (btn.getAttribute('data-career') === found.carrera) {
                                selectCareer(btn);
                            }
                        });
                    }
                }
            }
        });
    }

    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const payload = {
            nombre: document.getElementById('attendance-name')?.value.trim() || '',
            cedula: document.getElementById('attendance-id')?.value.trim() || '',
            carrera: document.getElementById('attendance-career')?.value || '',
            estado: document.getElementById('attendance-state')?.value || 'Presente',
            observacion: document.getElementById('attendance-notes')?.value.trim() || '',
            marcaTemporal: new Date().toLocaleString('es-PY')
        };

        if (!payload.nombre || !payload.cedula || !payload.carrera) {
            if (status) {
                status.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> Complete nombre, cédula y seleccione una carrera.';
                status.className = 'rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700';
            }
            return;
        }

        try {
            await submitAttendanceRecord(payload);
            form.reset();
            // Resetear botones de carrera
            const container = document.getElementById('career-buttons-container');
            if (container) {
                container.querySelectorAll('.career-btn').forEach(btn => btn.classList.remove('selected'));
            }
            if (status) {
                status.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Asistencia registrada correctamente.';
                status.className = 'rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-semibold';
            }
            await refreshAttendanceData();
        } catch (error) {
            if (status) {
                status.innerHTML = '<i class="fas fa-exclamation-triangle mr-1"></i> ' + (error.message || 'No se pudo registrar la asistencia.');
                status.className = 'rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700';
            }
        }
    });
}

// link.google.forms -> link_google_forms



// link.asistencia -> link_asistencia



// link.respuestas -> link_respuestas













/* ============================================================
   AUTENTICACIÓN DOCENTE (Modo Docente)
   ============================================================ */

const TEACHER_SESSION_KEY = 'teacher_session_active';
const TEACHER_TIMESTAMP_KEY = 'teacher_session_timestamp';

function isTeacherSessionActive() {
    const active = sessionStorage.getItem(TEACHER_SESSION_KEY);
    if (!active) return false;
    // La sesión dura mientras la pestaña esté abierta (sessionStorage)
    // pero también verificamos que no sea de otra pestaña cerrada y reabierta
    return true;
}

function getTeacherPassword() {
    // La contraseña se lee de la configuración cargada
    // Si CONFIG no tiene teacherPassword, se usa un valor por defecto
    // NOTA: En producción, la contraseña real debe venir de CONFIG
    return (typeof CONFIG !== 'undefined' && CONFIG.teacherPassword) ? CONFIG.teacherPassword : 'Centuria2024!';
}

function loginTeacher(password) {
    const expected = getTeacherPassword();
    if (password === expected) {
        sessionStorage.setItem(TEACHER_SESSION_KEY, '1');
        sessionStorage.setItem(TEACHER_TIMESTAMP_KEY, Date.now().toString());
        return { ok: true };
    }
    return { ok: false, error: 'Contraseña incorrecta' };
}

function logoutTeacher() {
    sessionStorage.removeItem(TEACHER_SESSION_KEY);
    sessionStorage.removeItem(TEACHER_TIMESTAMP_KEY);
}

function requireTeacherAuth(redirectUrl) {
    if (!isTeacherSessionActive()) {
        if (redirectUrl) {
            window.location.href = redirectUrl;
        }
        return false;
    }
    return true;
}

function renderTeacherLoginOverlay(containerId, onSuccess) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (isTeacherSessionActive()) {
        if (typeof onSuccess === 'function') onSuccess();
        return;
    }

    container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:60vh;padding:20px;">
            <div style="background:var(--card-bg,#fff);border:1px solid var(--border,#e2e8f0);border-radius:16px;padding:32px;max-width:400px;width:100%;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
                <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:white;font-size:22px;">
                    <i class="fas fa-lock"></i>
                </div>
                <h2 style="font-size:20px;font-weight:800;margin-bottom:8px;color:var(--text,#1a202c);">Acceso restringido</h2>
                <p style="font-size:14px;color:var(--text-secondary,#4a5568);margin-bottom:20px;">Esta sección contiene datos personales de los alumnos. Ingrese la contraseña de docente para continuar.</p>
                <div style="display:flex;gap:8px;">
                    <input type="password" id="teacher-login-input" placeholder="Contraseña docente" style="flex:1;padding:10px 14px;border:2px solid var(--border,#e2e8f0);border-radius:8px;font-size:14px;outline:none;"
                        onkeydown="if(event.key==='Enter')document.getElementById('teacher-login-btn').click()">
                    <button id="teacher-login-btn" style="padding:10px 18px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;white-space:nowrap;">
                        <i class="fas fa-sign-in-alt"></i> Entrar
                    </button>
                </div>
                <div id="teacher-login-msg" style="margin-top:12px;font-size:13px;min-height:20px;color:#dc3545;font-weight:600;"></div>
                <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border,#e2e8f0);">
                    <a href="index.html" style="color:var(--primary,#667eea);text-decoration:none;font-size:13px;font-weight:600;">
                        <i class="fas fa-home"></i> Volver al inicio
                    </a>
                </div>
            </div>
        </div>
    `;

    const btn = document.getElementById('teacher-login-btn');
    const input = document.getElementById('teacher-login-input');
    const msg = document.getElementById('teacher-login-msg');

    btn.addEventListener('click', function() {
        const val = input.value.trim();
        if (!val) {
            msg.textContent = 'Ingrese la contraseña.';
            return;
        }
        const result = loginTeacher(val);
        if (result.ok) {
            if (typeof onSuccess === 'function') onSuccess();
        } else {
            msg.textContent = result.error;
            input.value = '';
            input.focus();
        }
    });
}

function addTeacherLogoutButton(targetSelector) {
    const target = document.querySelector(targetSelector);
    if (!target) return;
    const btn = document.createElement('button');
    btn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Cerrar sesión docente';
    btn.style.cssText = 'background:rgba(255,255,255,0.2);color:white;border:none;padding:4px 10px;border-radius:20px;font-size:11px;cursor:pointer;backdrop-filter:blur(10px);margin-left:auto;';
    btn.addEventListener('click', function() {
        logoutTeacher();
        window.location.href = 'index.html';
    });
    target.appendChild(btn);
}






