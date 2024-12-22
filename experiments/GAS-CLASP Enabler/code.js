// Writes data to the active sheet
function writeData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.getRange("A1").setValue("Hello, Google Sheet!");
}

// Reads data from the sheet
function readData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const value = sheet.getRange("A1").getValue();
  Logger.log("Cell A1 contains: " + value);
}

// Clears the sheet
function clearSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.clear();
}

// Comment to check that I can switch gs and js extensions without breaking the integration