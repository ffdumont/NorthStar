function pushLegResults(route, columnName) {
  const methodMapping = {
    distance: "greatCircleDistance",
    trueTrack: "trueTrack",
    magneticTrack: "magneticTrack",
    minimalSecurityAltitude: "minimalSecurityAltitude",
    temperature_2m: "temperature_2m",
    pressure_msl: "pressure_msl",
  };

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Legs");
  if (!sheet) {
    Logger.log("Sheet 'Legs' not found.");
    return;
  }

  const methodName = methodMapping[columnName];
  if (!methodName) {
    Logger.log(`No method found for column: ${columnName}`);
    return;
  }

  const lastRow = sheet.getLastRow();
  const data = sheet.getRange(2, 1, lastRow - 1, 4).getValues();

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  let colIndex = headers.indexOf(columnName) + 1;

  if (colIndex === 0) {
    sheet.getRange(1, sheet.getLastColumn() + 1).setValue(columnName);
    colIndex = sheet.getLastColumn();
  }

  const columnResults = [];

  data.forEach((row) => {
    const [legNumber] = row;
    const leg = route.legs[legNumber];

    if (leg && typeof leg[methodName] === "function") {
      columnResults.push([leg[methodName]()]);
    } else {
      columnResults.push(["N/A"]);
    }
  });

  sheet.getRange(2, colIndex, columnResults.length, 1).setValues(columnResults);
  Logger.log(`${columnName} calculations updated in Legs sheet.`);
}
