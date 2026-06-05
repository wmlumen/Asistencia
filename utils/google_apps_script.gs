const SPREADSHEET_ID = '1gdGxpa3-z61A7O06smRSv_055KIzH4SBaRYNb-RVYJk';
const SHEET_NAME = 'Asistencia';

function doGet() {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return json_({ records: [] });
  }

  const headers = values[0];
  const records = values.slice(1).reverse().map((row) => {
    return headers.reduce((acc, header, index) => {
      acc[header] = row[index];
      return acc;
    }, {});
  });

  return json_({ records });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents || '{}');
  const sheet = getSheet_();

  sheet.appendRow([
    data.studentName || '',
    data.studentId || '',
    data.career || '',
    data.notes || '',
    data.sourcePage || '',
    data.timestamp || new Date().toISOString()
  ]);

  return json_({ ok: true });
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'studentName',
      'studentId',
      'career',
      'notes',
      'sourcePage',
      'timestamp'
    ]);
  }

  return sheet;
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
