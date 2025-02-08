function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function radiansToDegrees(radians) {
  return (radians * 180) / Math.PI;
}

function kmToNmi(km) {
  return km * 0.539957;
}

function mToFt(m) {
  return m * 3.28084;
}

/**
 * Get the value from a named range in the active sheet.
 * @param {string} name - The name of the named range to retrieve.
 * @returns {*} The value in the named range, or null if the range does not exist.
 */
function getNamedRangeValue(name) {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Settings");
  const namedRanges = sheet.getNamedRanges();
  const namedRange = namedRanges.find((range) => range.getName() === name);

  if (!namedRange) {
    Logger.log(`Named range "${name}" not found.`);
    return null;
  }

  return namedRange.getRange().getValue();
}

/**
 * Convert a Date object to ISO 8601 format in UTC (Zulu time).
 * @param {Date} date - The date object to convert.
 * @returns {string} The formatted date string in ISO 8601 format with a "Z" suffix for UTC.
 */
function convertDateToISO8601(date) {
  // Ensure the input is a valid Date object
  if (!(date instanceof Date) || isNaN(date)) {
    throw new Error("Invalid date provided");
  }

  // Format the date to ISO 8601 with Z suffix for UTC time
  return date.toISOString().slice(0, 19) + "Z";
}

function convertDateToYYYYMMDD_HHMM(input) {
  let date;

  // If input is a Date object, use it directly; otherwise, parse the string
  if (input instanceof Date) {
    date = input;
  } else if (typeof input === "string") {
    const parts = input.match(
      /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/
    );
    if (!parts) {
      throw new Error(
        "Invalid date format. Expected format: DD/MM/YYYY HH:mm:ss"
      );
    }
    const day = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1; // Months are zero-based in JS
    const year = parseInt(parts[3], 10);
    const hours = parseInt(parts[4], 10);
    const minutes = parseInt(parts[5], 10);
    date = new Date(year, month, day, hours, minutes);
  } else {
    throw new Error(
      "Invalid input type. Expected a Date object or a string in DD/MM/YYYY HH:mm:ss format."
    );
  }

  // Format components with leading zeros where necessary
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}${month}${day}_${hours}${minutes}`;
}

// ✅ **Example usage in GAS**
function testConvertDateToCustomFormat() {
  const formattedDate1 = convertDateToCustomFormat("26/01/2025 09:08:00");
  Logger.log(formattedDate1); // Output: "20250126_0908"

  const formattedDate2 = convertDateToCustomFormat(new Date(2025, 0, 26, 9, 8)); // Month is 0-based
  Logger.log(formattedDate2); // Output: "20250126_0908"
}

// Example usage in Google Apps Script
function testConvertDateToCustomFormat() {
  const formattedDate = convertDateToCustomFormat("26/01/2025 09:08:00");
  Logger.log(formattedDate); // Output: "20250126_0908"
}

/**
 * Round a Date object to the closest top of the hour.
 * @param {Date} date - The date to round.
 * @returns {Date} A new Date object rounded to the closest hour.
 */
function roundToClosestHour(date) {
  // Ensure the input is a valid Date object
  if (!(date instanceof Date) || isNaN(date)) {
    throw new Error("Invalid date provided");
  }

  // Get the minutes and seconds
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // If 30 minutes or more, round up to the next hour
  if (minutes >= 30 || (minutes === 29 && seconds >= 30)) {
    date.setMinutes(0, 0, 0); // Reset minutes, seconds, and milliseconds
    date.setHours(date.getHours() + 1); // Increment the hour
  } else {
    // Otherwise, round down to the current hour
    date.setMinutes(0, 0, 0); // Reset minutes, seconds, and milliseconds
  }

  return date;
}

function generateFlightPlanFilename(flightPlan) {
  const airfieldIdentifiers = [];

  flightPlan.routes.forEach((route) => {
    const departureSuffix =
      route.departureAirfield.airfieldDesignator.slice(-2);
    if (!airfieldIdentifiers.includes(departureSuffix)) {
      airfieldIdentifiers.push(departureSuffix);
    }

    const destinationSuffix =
      route.destinationAirfield.airfieldDesignator.slice(-2);
    if (!airfieldIdentifiers.includes(destinationSuffix)) {
      airfieldIdentifiers.push(destinationSuffix);
    }
  });

  const mergedRouteName = airfieldIdentifiers.join("");

  return `${mergedRouteName}.json`; // Example: FlightPlan_XUONOLPDXU_20240131_1030.json
}

function getSheetFolder() {
  const file = DriveApp.getFileById(
    SpreadsheetApp.getActiveSpreadsheet().getId()
  ); // Get active sheet file
  const folders = file.getParents(); // Get parent folder(s)

  if (folders.hasNext()) {
    return folders.next(); // ✅ Return the first parent folder
  } else {
    Logger.log("Error: Google Sheet is not stored in a Drive folder.");
    return null;
  }
}
