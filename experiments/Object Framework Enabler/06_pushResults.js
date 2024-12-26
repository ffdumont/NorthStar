function calculateDistances(route) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Legs");
  if (!sheet) {
    Logger.log("Sheet 'Legs' not found.");
    return;
  }

  const lastRow = sheet.getLastRow();
  const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();
  const distances = [];

  data.forEach((row) => {
    const [legNumber] = row;
    const leg = route.legs[legNumber];

    if (leg) {
      distances.push([leg.greatCircleDistance()]);
    } else {
      distances.push(["N/A"]);
    }
  });

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  let distanceCol = headers.indexOf("Distance") + 1;

  if (distanceCol === 0) {
    sheet.getRange(1, sheet.getLastColumn() + 1).setValue("Distance");
    distanceCol = sheet.getLastColumn() + 1;
  }

  sheet.getRange(2, distanceCol, distances.length, 1).setValues(distances);
}
