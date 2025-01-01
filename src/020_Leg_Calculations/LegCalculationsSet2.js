Leg.prototype.fetchWeatherVariable = async function (variable) {
  const midpoint = this.calculateMidpoint();
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Set time to 12:00 PM
  const dateString = today.toISOString().slice(0, 19) + "Z"; // Format date as ISO string

  // Cache key based on variable name (to store different variables separately)
  const cacheKey = `_weather_${variable}`;

  if (this[cacheKey] !== undefined) {
    return this[cacheKey];
  }

  try {
    console.log(`Fetching ${variable} data...`);
    const data = await fetchWeatherData(midpoint.lat, midpoint.lon);
    this[cacheKey] = getWeatherVariable(data, dateString, variable);
    console.log(`${variable} fetched and cached:`, this[cacheKey]);
    return this[cacheKey];
  } catch (error) {
    console.error(`Error fetching ${variable}:`, error.message);
    throw error;
  }
};

// Reset specific variable cache
Leg.prototype.resetWeatherVariable = function (variable) {
  const cacheKey = `_weather_${variable}`;
  console.log(`${variable} cache invalidated.`);
  this[cacheKey] = undefined;
};

// Reset all weather variables
Leg.prototype.resetAllWeatherVariables = function () {
  for (const key in this) {
    if (key.startsWith("_weather_")) {
      console.log(`Invalidating cache for ${key}`);
      this[key] = undefined;
    }
  }
};
