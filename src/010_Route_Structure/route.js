class Route {
  constructor(departureAirfield, destinationAirfield, legs, name) {
    this.name = name; // Route name from the record
    this.departureAirfield = departureAirfield; // Airfield object
    this.destinationAirfield = destinationAirfield; // Airfield object
    this.legs = legs; // Array of Leg objects
    this.routeTime = null; // Total time for the route
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

  // Compute total route time
  calculateRouteTime() {
    // ✅ Convert legs object to an array before summing
    const legsArray = Object.values(this.legs);

    // 1. Sum of maxLegTime for all legs
    const legsTime = legsArray.reduce(
      (sum, leg) => sum + leg.getLegMaxTime(),
      0
    );

    // 2. Sum of TaxiInTime and DepartureProcedureTime for departure airfield
    const departureTime =
      (this.departureAirfield.TaxiInTime || 0) +
      (this.departureAirfield.DepartureProcedureTime || 0);

    // 3. Sum of ArrivalProcedureTime and TaxiOutTime for arrival airfield
    const arrivalTime =
      (this.destinationAirfield.TaxiOutTime || 0) +
      (this.destinationAirfield.ArrivalProcedureTime || 0);

    // 4. Total route time
    this.routeTime = legsTime + departureTime + arrivalTime;

    return this.routeTime;
  }
}
