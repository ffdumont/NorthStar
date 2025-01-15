const weatherProperties = ["temperature_2m", "pressure_msl"];

weatherProperties.forEach((property) => {
  const privateProperty = `_weather_${property}`;
  Leg.prototype[property] = function () {
    return this[privateProperty];
  };
});

pressureTable.forEach(({ pressure }) => {
  const suffix = `${pressure}hPa`;

  Leg.prototype[`wind_direction_${suffix}`] = function () {
    return this[`_weather_wind_direction_${suffix}`];
  };

  Leg.prototype[`wind_speed_${suffix}`] = function () {
    return this[`_weather_wind_speed_${suffix}`];
  };
});

Leg.prototype.fetchLegWeatherData = function (weatherVariables) {
  const midpoint = this.calculateMidpoint();
  const dateString = convertDateToISO8601(
    roundToClosestHour(getNamedRangeValue("offBlockDateTime"))
  );
  const data = fetchWeatherData2(
    midpoint.lat,
    midpoint.lon,
    dateString,
    weatherVariables
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
      this[cacheKey] = getWeatherVariable2(data, variable);
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
