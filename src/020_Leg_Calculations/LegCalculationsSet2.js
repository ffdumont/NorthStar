Leg.prototype.temperature_2m = function () {
  return this._weather_temperature_2m;
};
Leg.prototype.pressure_msl = function () {
  return this._weather_pressure_msl;
};

Leg.prototype.fetchLegWeatherData = function (weatherVariables) {
  const midpoint = this.calculateMidpoint();
  const data = fetchWeatherData(midpoint.lat, midpoint.lon);
  //  const today = new Date();
  //  today.setHours(12, 0, 0, 0); // Set time to 12:00 PM
  //  const dateString = today.toISOString().slice(0, 19) + "Z"; // Format date as ISO string
  const dateString = convertDateToISO8601(
    roundToClosestHour(getNamedRangeValue("offBlockDateTime"))
  );

  weatherVariables.forEach((variable) => {
    const cacheKey = `_weather_${variable}`;

    if (this[cacheKey] != null) {
      Logger.log(
        `${variable} already cached for Leg ${this.legNumber}: ${this[cacheKey]}`
      );
      return; // Skip if valid data is already cached
    }

    try {
      Logger.log(`Fetching ${variable} for Leg ${this.legNumber}...`);
      this[cacheKey] = getWeatherVariable(data, dateString, variable);
      Logger.log(
        `${variable} fetched and cached for Leg ${this.legNumber}: ${this[cacheKey]}`
      );
    } catch (error) {
      Logger.log(
        `Error fetching ${variable} for Leg ${this.legNumber}: ${error.message}`
      );
    }
  });
};
