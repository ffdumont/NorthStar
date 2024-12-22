let waypoints = {}; // Global scope

// Waypoint Class Definition
class Waypoint {
  constructor(name, lat, lon) {
    this.name = name;
    this.lat = lat;
    this.lon = lon;
  }

  toString() {
    return `${this.name}: (${this.lat}, ${this.lon})`;
  }
}

// Pull Data from Google Sheet and Create Waypoints
function getWaypointsFromSheet() {
  const sheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Waypoints");
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues(); // Excludes header

  let waypoints = [];

  data.forEach((row) => {
    const [name, lat, lon] = row;
    if (name && !isNaN(lat) && !isNaN(lon)) {
      let waypoint = new Waypoint(name.trim().toUpperCase(), lat, lon);
      waypoints[waypoint.name] = waypoint;
      Logger.log(waypoint.toString());
    } else {
      Logger.log(`Invalid data for waypoint: ${row}`);
    }
  });

  return waypoints;
}
