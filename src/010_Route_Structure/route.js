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

  async getLegsFromSheet() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Legs");
    if (!sheet) {
      Logger.log("Sheet 'Legs' not found.");
      return;
    }
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();

    const legs = {};

    for (const row of data) {
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

        // Asynchronously fetch weather variables during leg initialization
        try {
          Logger.log(`Fetching weather for Leg ${legNumber}...`);
          await Promise.all([
            leg.fetchWeatherVariable("pressure_msl"),
            leg.fetchWeatherVariable("temperature_2m"),
          ]);
          Logger.log(
            `Leg ${legNumber} initialized with pressure_msl: ${leg._weather_pressure_msl}, temperature_2m: ${leg._weather_temperature_2m}`
          );
        } catch (error) {
          Logger.log(
            `Failed to fetch weather data for Leg ${legNumber}: ${error.message}`
          );
        }
      } else {
        Logger.log(
          `Waypoint not found for Leg ${legNumber}: ${fromName} to ${toName}`
        );
      }
    }

    this.legs = legs;
    Logger.log("Legs have been successfully loaded with weather data.");
  }
}
