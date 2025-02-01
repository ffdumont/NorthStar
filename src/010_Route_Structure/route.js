class Route {
  constructor(departureAirfield, destinationAirfield, legs, name) {
    this.name = name; // Route name from the record
    this.departureAirfield = departureAirfield; // Airfield object
    this.destinationAirfield = destinationAirfield; // Airfield object
    this.legs = legs; // Array of Leg objects
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

  fetchRouteWeatherData() {
    const legs = this.legs;
    const weatherVariables = ["temperature_2m", "pressure_msl"];

    // Function to get the closest pressure level based on height
    const getPressureLevel = (height) => {
      let closest = pressureTable[0];
      for (const entry of pressureTable) {
        if (
          Math.abs(entry.height - height) < Math.abs(closest.height - height)
        ) {
          closest = entry;
        }
      }
      return closest.pressure;
    };

    for (const legNumber in legs) {
      const leg = legs[legNumber];
      try {
        Logger.log(`Fetching weather data for Leg ${legNumber}...`);
        // Calculate height difference
        const height = leg.targetAltitude - (leg.Elevation || 0);

        // Determine pressure level
        const pressureLevel = getPressureLevel(height);

        // Add wind variables based on pressure level
        const windSpeedVar = `wind_speed_${pressureLevel}hPa`;
        const windDirectionVar = `wind_direction_${pressureLevel}hPa`;

        weatherVariables.push(windSpeedVar, windDirectionVar);

        leg.fetchLegWeatherData(weatherVariables);
      } catch (error) {
        Logger.log(
          `Failed to fetch weather data for Leg ${legNumber}: ${error.message}`
        );
      }
    }
    Logger.log("Weather data fetch completed for all legs.");
  }
}
