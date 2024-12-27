class Route {
  constructor() {
    this.waypoints = {};
    this.legs = {};
  }

  getWaypointsFromSheet() {
    const sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Waypoints");
    if (!sheet) {
      Logger.log("Sheet 'Waypoints' not found.");
      return;
    }
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();

    const waypoints = {};

    data.forEach((row) => {
      const [name, lat, lon] = row;
      if (name && !isNaN(lat) && !isNaN(lon)) {
        const waypoint = new Waypoint(name.trim().toUpperCase(), lat, lon);
        waypoints[waypoint.name] = waypoint;
        Logger.log(waypoint.toString());
      } else {
        Logger.log(`Invalid data for waypoint: ${row}`);
      }
    });

    this.waypoints = waypoints;
  }

  getLegsFromSheet() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Legs");
    if (!sheet) {
      Logger.log("Sheet 'Legs' not found.");
      return;
    }
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();

    const legs = {};

    data.forEach((row) => {
      const [legNumber, fromName, toName, targetAltitude] = row;
      const fromWaypoint = this.waypoints[fromName.trim().toUpperCase()];
      const toWaypoint = this.waypoints[toName.trim().toUpperCase()];

      if (fromWaypoint && toWaypoint) {
        const leg = new Leg(
          legNumber,
          fromWaypoint,
          toWaypoint,
          targetAltitude
        );
        legs[leg.legNumber] = leg;
        Logger.log(`Leg ${legNumber}: from ${fromName} (${fromWaypoint}) to ${toName} (${toWaypoint}) with target altitude ${targetAltitude}`);
      } else {
        Logger.log(
          `Waypoint not found for Leg ${legNumber}: ${fromName} to ${toName}`
        );
      }
    });

    this.legs = legs;
    Logger.log("Legs have been successfully loaded.");
  }
}