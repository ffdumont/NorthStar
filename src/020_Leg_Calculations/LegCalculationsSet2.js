const weatherProperties = [
  "temperature_2m",
  "pressure_msl",
  "wind_direction",
  "wind_speed",
];

weatherProperties.forEach((property) => {
  const privateProperty = `_weather_${property}`;
  Leg.prototype[property] = function () {
    return this[privateProperty];
  };
});

Leg.prototype.fetchLegWeatherData = function (weatherVariables) {
  const midpoint = this.calculateMidpoint();
  const dateString = convertDateToISO8601(
    roundToClosestHour(getNamedRangeValue("offBlockDateTime"))
  );
  const data = fetchWeatherData(
    midpoint.lat,
    midpoint.lon,
    dateString,
    weatherVariables
  );

  const pressureLevelRegex = /_(\d+)hPa$/; // Regex to detect variables depending on pressure level

  weatherVariables.forEach((variable) => {
    const pressureMatch = variable.match(pressureLevelRegex);
    const cacheKey = pressureMatch
      ? `_weather_${variable.replace(pressureLevelRegex, "")}`
      : `_weather_${variable}`;

    if (this[cacheKey] != null) {
      Logger.log(
        `${variable} already cached for Leg ${this.legNumber}: ${this[cacheKey]}`
      );
      return; // Skip if valid data is already cached
    }

    try {
      Logger.log(`Fetching ${variable} for Leg ${this.legNumber}...`);
      const weatherValue = getWeatherVariable(data, variable);

      if (pressureMatch) {
        // Assign value to the variable name without the suffix
        const baseVariableName = variable.replace(pressureLevelRegex, "");
        this[`_weather_${baseVariableName}`] = weatherValue;
        Logger.log(
          `${baseVariableName} (pressure-dependent) fetched and cached for Leg ${this.legNumber}: ${weatherValue}`
        );
      } else {
        // Assign value normally for non-pressure-dependent variables
        this[cacheKey] = weatherValue;
        Logger.log(
          `${variable} fetched and cached for Leg ${this.legNumber}: ${weatherValue}`
        );
      }
    } catch (error) {
      Logger.log(
        `Error fetching ${variable} for Leg ${this.legNumber}: ${error.message}`
      );
    }
  });
};
