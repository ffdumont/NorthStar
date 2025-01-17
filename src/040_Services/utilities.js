function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function radiansToDegrees(radians) {
  return (radians * 180) / Math.PI;
}

function kmToNmi(km) {
  return km * 0.539957;
}

/**
 * Get the value from a named range in the active sheet.
 * @param {string} name - The name of the named range to retrieve.
 * @returns {*} The value in the named range, or null if the range does not exist.
 */
function getNamedRangeValue(name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Route");
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
