function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const row = [
      new Date(),
      data.student,
      data.cedula,
      data.attempt,
      data.score,
      data.total,
      data.percent,
      JSON.stringify(data.details)
    ];
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({status: 'ok', message: 'Resultado guardado'})).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({status: 'ok', message: 'Exam API'})).setMimeType(ContentService.MimeType.JSON);
}
