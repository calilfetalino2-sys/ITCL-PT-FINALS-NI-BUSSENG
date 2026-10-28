const SPREADSHEET_ID = "1WJdOff3I8wDvisCDB9fJhTujk8Bxs1VjKJ9ozxzQ5aM";
const CONTACT_SHEET_NAME = "Contact Submissions";

function setupContactDatabase() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(CONTACT_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONTACT_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Subject",
      "Message",
      "Submitted At",
      "Status"
    ];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.autoResizeColumns(1, headers.length);
  }

  return "Contact database setup complete.";
}

function doGet() {
  return ContentService
    .createTextOutput("Contact form endpoint is ready.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(event) {
  const values = event && event.parameter ? event.parameter : {};
  const requestId = cleanContactValue(values.requestId, 100);
  const name = cleanContactValue(values.name, 120);
  const email = cleanContactValue(values.email, 254);
  const phone = cleanContactValue(values.phone, 40);
  const subject = cleanContactValue(values.subject || values.topic, 120);
  const message = cleanContactValue(values.message, 5000);

  if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return contactResponse(false, requestId);
  }

  let lock;
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONTACT_SHEET_NAME);
    if (!sheet) {
      throw new Error('The "Contact Submissions" tab is missing. Run setupContactDatabase first.');
    }

    lock = LockService.getScriptLock();
    lock.waitLock(10000);
    sheet.appendRow([
      safeSheetText(name),
      safeSheetText(email),
      safeSheetText(phone),
      safeSheetText(subject),
      safeSheetText(message),
      new Date(),
      "New"
    ]);

    return contactResponse(true, requestId);
  } catch (error) {
    console.error(error);
    return contactResponse(false, requestId);
  } finally {
    if (lock && lock.hasLock()) {
      lock.releaseLock();
    }
  }
}

function cleanContactValue(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function safeSheetText(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function contactResponse(success, requestId) {
  const response = JSON.stringify({
    type: "contact-form-result",
    success: success,
    requestId: requestId
  });
  const html = '<!doctype html><html><body><script>window.top.postMessage(' +
    response +
    ', "*");</script></body></html>';

  return HtmlService
    .createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
