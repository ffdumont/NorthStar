const pressureTable = [
  { pressure: 1000, height: 110 },
  { pressure: 950, height: 500 },
  { pressure: 925, height: 800 },
  { pressure: 900, height: 1000 },
  { pressure: 850, height: 1500 },
  { pressure: 800, height: 1900 },
  { pressure: 750, height: 2500 },
  { pressure: 700, height: 3000 },
  { pressure: 650, height: 3600 },
  { pressure: 600, height: 4200 },
  { pressure: 550, height: 4900 },
  { pressure: 500, height: 5600 },
  { pressure: 450, height: 6300 },
  { pressure: 400, height: 7200 },
  { pressure: 350, height: 8100 },
  { pressure: 300, height: 9200 },
  { pressure: 275, height: 9700 },
  { pressure: 250, height: 10400 },
  { pressure: 225, height: 11000 },
  { pressure: 200, height: 11800 },
  { pressure: 175, height: 12600 },
  { pressure: 150, height: 13500 },
  { pressure: 125, height: 14600 },
  { pressure: 100, height: 15800 },
  { pressure: 70, height: 17700 },
  { pressure: 50, height: 19300 },
  { pressure: 30, height: 22000 },
  { pressure: 20, height: 23000 },
  { pressure: 10, height: 26000 },
];

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
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();

    const legs = {};

    for (const row of data) {
      const [legNumber, fromName, toName, targetAltitude, trueAirSpeed] = row;
      const fromWaypoint = this.waypoints[fromName.trim().toUpperCase()];
      const toWaypoint = this.waypoints[toName.trim().toUpperCase()];

      if (fromWaypoint && toWaypoint) {
        const leg = new Leg(
          legNumber,
          fromWaypoint,
          toWaypoint,
          targetAltitude,
          trueAirSpeed
        );
        leg.magneticTrack();
        legs[leg.legNumber] = leg;
      } else {
        Logger.log(
          `Waypoint not found for Leg ${legNumber}: ${fromName} to ${toName}`
        );
      }
    }
    this.legs = legs;
    Logger.log("Legs have been successfully loaded.");
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
        const height = leg.targetAltitude - (leg.elevation() || 0);

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
    const pressureLevelRegex = /_(\d+)hPa$/; // Regex to detect variables depending on pressure level

    weatherVariables.forEach((variable) => {
      const pressureMatch = variable.match(pressureLevelRegex);

      if (pressureMatch) {
        // Remove the pressure level suffix from the variable name
        const baseVariableName = variable.replace(pressureLevelRegex, "");
        pushLegResults(this, baseVariableName); // Use the modified name
      } else {
        pushLegResults(this, variable); // Use the original name for non-pressure-dependent variables
      }
    });
  }

  saveToCache() {
    const cache = CacheService.getScriptCache();
    cache.put("route", JSON.stringify(this), 21600); // Cache for 6 hours
    Logger.log("Route saved to cache.");
  }

  static loadFromCache() {
    const cache = CacheService.getScriptCache();
    const data = cache.get("route");

    if (data) {
      Logger.log("Route retrieved from cache.");
      const parsedData = JSON.parse(data);

      // Recreate the Route object
      const route = Object.assign(new Route(), parsedData);

      // Recreate legs as instances of Leg
      for (const legNumber in parsedData.legs) {
        route.legs[legNumber] = Object.assign(
          new Leg(),
          parsedData.legs[legNumber]
        );
      }

      // Recreate waypoints as instances of Waypoint
      for (const waypointName in parsedData.waypoints) {
        route.waypoints[waypointName] = Object.assign(
          new Waypoint(),
          parsedData.waypoints[waypointName]
        );
      }

      return route;
    } else {
      Logger.log("No route found in cache.");
      return null;
    }
  }
}
