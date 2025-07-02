// 1B7FSrk5Zi6L1rSxxTDgDEUsPzlukDsi4KGuTMorsTQHhGBzBkMun4iDF id para buscar la librería OAuth2

// --- VARIABLES DE CONFIGURACIÓN ---
const SERVICE_ACCOUNT_KEY_JSON = JSON.parse(PropertiesService.getScriptProperties().getProperty('serviceAccountKey'));
const TELEGRAM_BOT_TOKEN = PropertiesService.getScriptProperties().getProperty('telegramBotToken');
const TELEGRAM_CHAT_ID = 'TU_ID'; // id del canal de telegram
const TIMEZONE = Session.getScriptTimeZone();


// ================================================================================================
// --- FUNCIÓN PRINCIPAL PARA EJECUTAR ---
// ================================================================================================

function ejecutarReporteDinamico() {
  // --- Configuración específica del reporte ---
  const siteUrl = 'PROPIEDAD DEL SITIO'; // propiedad del sitio tal como aparece en Seearch Console
  const sitio = 'Nombre del sitio'; // Nombre para el mensaje
  const tipo = 'web';   // Tipo de tráfico, "discover" traerá el tráfico de Discover
  const emoji = '📈';      // Emoji para el mensaje

  try {
    // 1. Generar las fechas dinámicas (ayer y 28 días antes)
    const { startDate, endDate, weekDay } = getFechasDinamicas();
    Logger.log(`Generando reporte para el rango: ${startDate} a ${endDate}`);

    // 2. Obtener los datos desde la API de Search Console
    const apiData = getSearchConsoleData(siteUrl, startDate, endDate, tipo);

    // 3. Validar y ordenar los datos (Paso CRÍTICO)
    if (!apiData || !apiData.rows || apiData.rows.length < 28) {
      throw new Error(`No se recibieron suficientes datos de la API. Se necesitan al menos 28 días de datos, se recibieron ${apiData.rows ? apiData.rows.length : 0}.`);
    }
    
    // Ordenar por fecha para asegurar que el último elemento es "ayer"
    apiData.rows.sort((a, b) => new Date(a.keys[0]) - new Date(b.keys[0]));
    
    const rows = apiData.rows;
    const lastDayIndex = rows.length - 1; 

    // 4. Realizar el cálculo del porcentaje
    const clicksAyer = rows[lastDayIndex].clicks;
    const clicksPrevios = [
      rows[lastDayIndex - 7].clicks,
      rows[lastDayIndex - 14].clicks,
      rows[lastDayIndex - 21].clicks,
      rows[lastDayIndex - 28].clicks
    ];
    
    const promedioPrevio = clicksPrevios.reduce((a, b) => a + b, 0) / clicksPrevios.length;
    
    // Evitar división por cero
    const percent = (promedioPrevio === 0) ? 0 : (clicksAyer / promedioPrevio) - 1;
    
    Logger.log(`Clicks Ayer: ${clicksAyer}`);
    Logger.log(`Promedio 4 semanas previas (${weekDay}): ${promedioPrevio.toFixed(2)}`);
    Logger.log(`Variación: ${(percent * 100).toFixed(2)}%`);

    // 5. Generar el mensaje dinámico
    const mensaje = generarMensajeDinamico(percent, sitio, tipo, emoji, weekDay);
    
    // 6. Preparar datos y generar el gráfico
    const labels = rows.map(row => Utilities.formatDate(new Date(row.keys[0]), TIMEZONE, "MM-dd"));
    const clicksData = rows.map(row => row.clicks);
    const impressionsData = rows.map(row => row.impressions);

    const blobImagen = generarGrafico(labels, clicksData, impressionsData);
    
    // 7. Enviar la notificación a Telegram
    enviarATelegram(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, mensaje, blobImagen);

    Logger.log("Reporte dinámico enviado con éxito.");

  } catch (e) {
    Logger.log(`Error fatal en ejecutarReporteDinamico: ${e.message}\n${e.stack}`);
    // Opcional: Enviar una alerta de error a un chat de admins
    // enviarATelegram(TELEGRAM_BOT_TOKEN, 'ADMIN_CHAT_ID', `Error en script de reportes: ${e.message}`, null);
  }
}

// ================================================================================================
// --- FUNCIONES AUXILIARES ---
// ================================================================================================

/**
 * Obtiene los datos de Search Console para un sitio y rango de fechas.
 */
function getSearchConsoleData(siteUrl, startDate, endDate, tipo) {
  const service = getServiceAccountService();
  if (!service.hasAccess()) {
    throw new Error('No se pudo autenticar con la cuenta de servicio.');
  }

  const payload = {
    'startDate': startDate,
    'endDate': endDate,
    'dimensions': ['date'],
    'searchType': tipo,
    'dataState': 'all' // trae los últimos datos disponibles, aún si no están consolidados
  };

  const response = UrlFetchApp.fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    headers: { 'Authorization': 'Bearer ' + service.getAccessToken() },
    muteHttpExceptions: true
  });

  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  if (responseCode === 200) {
    return JSON.parse(responseBody);
  } else {
    throw new Error(`Error en la llamada a la API (${responseCode}): ${responseBody}`);
  }
}

/**
 * Genera el mensaje de texto dinámico basado en el porcentaje de cambio.
 * Obviamente se pueden cambiar los emojis, o el texto.
 */
function generarMensajeDinamico(percent, sitio, tipo, emoji, weekDay) {
  let comportamiento;
  // más de 0.5% -> subió (redondea a 1%)
  if (percent >= 0.005) {
    comportamiento = `subieron un *${(percent * 100).toFixed(0)}%* 🟢`;
  // entre 0.5 y -0.5 -> se mantuvo
  } else if (percent > -0.005) {
    comportamiento = `se mantuvieron (*${(percent * 100).toFixed(0)}%*) ⏹️`;
  // Si está entre -0.5% y -50% -> bajó
  } else if (percent > -0.5) {
    comportamiento = `bajaron un *${Math.abs(percent * 100).toFixed(0)}%* 🔴`;
  } else {
    // Si bajó más del 50% -> alerta
    comportamiento = `bajaron un *${Math.abs(percent * 100).toFixed(0)}%* ⚠️`;
  }
  return `*[${tipo.toUpperCase()}]* ${emoji} Los clicks de *${sitio}* ${comportamiento} respecto al promedio de los últimos cuatro *${weekDay}*.`;
}

/**
 * Calcula las fechas de inicio y fin y el nombre del día de la semana.
 */
function getFechasDinamicas() {

  // Obtener el "hoy a la medianoche local"
  const today = getTodayMidnight(TIMEZONE);

  // Ayer
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Hace 28 días desde ayer
  const startDate = new Date(yesterday);
  startDate.setDate(yesterday.getDate() - 28);

  // Día de la semana de "ayer"
  const weekdays = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];
  const weekDay = weekdays[yesterday.getDay()];

  return {
    startDate: Utilities.formatDate(startDate, TIMEZONE, 'yyyy-MM-dd'),
    endDate: Utilities.formatDate(yesterday, TIMEZONE, 'yyyy-MM-dd'),
    weekDay: weekDay
  };
}

// 🔧 Auxiliar: obtiene hoy a la medianoche en la zona horaria dada
function getTodayMidnight(timezone) {
  const now = new Date();
  const year = Utilities.formatDate(now, timezone, 'yyyy');
  const month = Utilities.formatDate(now, timezone, 'MM');
  const day = Utilities.formatDate(now, timezone, 'dd');
  return new Date(`${year}-${month}-${day}T00:00:00${getGMTOffset(timezone)}`);
}

// 🔧 Auxiliar: obtiene el offset GMT como "-03:00" desde la zona horaria
function getGMTOffset(timezone) {
  const dummyDate = new Date();
  const formatted = Utilities.formatDate(dummyDate, timezone, 'Z'); // Ej: "-0300"
  return formatted.replace(/(\d{2})(\d{2})/, '$1:$2'); // Ej: "-03:00"
}

// --- FUNCIONES DE AUTENTICACIÓN, GRÁFICO Y TELEGRAM (sin cambios respecto a la versión anterior) ---

function getServiceAccountService() {
  return OAuth2.createService('SearchConsoleServiceAccount')
    .setTokenUrl(SERVICE_ACCOUNT_KEY_JSON.token_uri)
    .setPrivateKey(SERVICE_ACCOUNT_KEY_JSON.private_key)
    .setIssuer(SERVICE_ACCOUNT_KEY_JSON.client_email)
    .setPropertyStore(PropertiesService.getScriptProperties())
    .setScope('https://www.googleapis.com/auth/webmasters.readonly')
    .setGrantType('urn:ietf:params:oauth:grant-type:jwt-bearer');
}

function generarGrafico(labels, clicksData, impressionsData) {
  const dataTable = Charts.newDataTable()
    .addColumn(Charts.ColumnType.STRING, "Fecha")
    .addColumn(Charts.ColumnType.NUMBER, "Clicks")
    .addColumn(Charts.ColumnType.NUMBER, "Impresiones");

  for (let i = 0; i < labels.length; i++) {
    dataTable.addRow([labels[i], clicksData[i] || 0, impressionsData[i] || 0]); // Usar || 0 por si hay datos nulos
  }

  const chart = Charts.newLineChart()
    .setTitle("Clicks vs. Impresiones (Últimos 28 Días)")
    .setDataTable(dataTable)
    .setXAxisTitle("Fecha")
    .setLegendPosition(Charts.Position.TOP)
    .setDimensions(600, 300)
    .setOption('series', {
      0: { targetAxisIndex: 0, color: '#3366CC' },
      1: { targetAxisIndex: 1, color: '#DC3912' }
    })
    .setOption('vAxes', {
      0: { title: 'Clicks' },
      1: { title: 'Impresiones' }
    })
    .build();

  const blob = chart.getAs('image/png').copyBlob();
  blob.setName("grafico_dinamico.png");
  return blob;
}

function enviarATelegram(botToken, chatId, mensaje, blobImagen) {
  const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;

  if (!blobImagen) { // Enviar solo texto si no hay imagen (ej. en caso de error)
    const textUrl = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(mensaje)}&parse_mode=Markdown`;
    UrlFetchApp.fetch(textUrl);
    return;
  }
  
  const payload = {
    'chat_id': chatId,
    'caption': mensaje,
    'parse_mode': 'Markdown',
    'photo': blobImagen
  };

  const options = {
    'method': 'post',
    'payload': payload,
    'muteHttpExceptions': true
  };

  const response = UrlFetchApp.fetch(url, options);
  Logger.log(response.getContentText());
}
