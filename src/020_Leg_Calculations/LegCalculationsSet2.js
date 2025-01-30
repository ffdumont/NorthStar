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
    midpoint.latitude,
    midpoint.longitude,
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
