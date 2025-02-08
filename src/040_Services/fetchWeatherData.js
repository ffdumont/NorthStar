function getWeatherVariable(data, variable) {
  /**
   * Extracts the value of a specific weather variable from the weather data.
   *
   * @param {Object} data - The weather data object returned by fetchWeatherData.
   * @param {string} variable - The name of the weather variable to extract.
   * @returns {number|null} - The value of the variable if found, otherwise null.
   */
  if (!data || typeof data !== "object") {
    Logger.log("Invalid data object provided.");
    return null;
  }

  if (data.hasOwnProperty(variable)) {
    return data[variable];
  } else {
    Logger.log(`Variable '${variable}' not found in the weather data.`);
    return null;
  }
}

function fetchWeatherData(latitude, longitude, dateTimeISO, variables) {
  /**
   * Fetch weather data for specific coordinates and ISO date-time.
   *
   * @param {number} latitude - Latitude of the location.
   * @param {number} longitude - Longitude of the location.
   * @param {string} dateTimeISO - ISO date-time (e.g., "2025-01-15T03:00").
   * @param {Array} variables - Array of variable names to retrieve.
   * @returns {Object} - A dictionary containing the closest value for each variable.
   */

  const baseUrl = "https://api.open-meteo.com/v1/forecast";

  // Manually construct query parameters
  const queryParams = [
    `latitude=${encodeURIComponent(latitude)}`,
    `longitude=${encodeURIComponent(longitude)}`,
    `hourly=${encodeURIComponent(variables.join(","))}`,
    `models=meteofrance_seamless`,
    "wind_speed_unit=kn",
  ].join("&");

  const url = `${baseUrl}?${queryParams}`;

  try {
    // Send the request using UrlFetchApp
    const response = UrlFetchApp.fetch(url);

    if (response.getResponseCode() !== 200) {
      throw new Error(
        `Error fetching weather data: ${response.getContentText()}`
      );
    }

    const data = JSON.parse(response.getContentText());

    const hourlyData = data.hourly || {};
    const times = hourlyData.time || [];
    const targetTime = new Date(dateTimeISO).getTime();

    const result = {}; // Initialize result object for each variable
    variables.forEach((variable) => {
      result[variable] = null;
    });

    let closestIndex = -1;
    let smallestDiff = Infinity;

    // Find the closest timestamp
    times.forEach((timestamp, index) => {
      const currentDiff = Math.abs(new Date(timestamp).getTime() - targetTime);

      if (currentDiff < smallestDiff) {
        smallestDiff = currentDiff;
        closestIndex = index;
      }
    });

    // Extract the values for the closest timestamp
    if (closestIndex !== -1) {
      variables.forEach((variable) => {
        if (hourlyData[variable]) {
          result[variable] = hourlyData[variable][closestIndex];
        }
      });
    }

    return result;
  } catch (error) {
    Logger.log("Failed to fetch weather data:", error);
    return null;
  }
}

function testFetchWeatherData() {
  // Example usage

  const latitude = 48.9917;
  const longitude = 1.9097;
  const dateTimeISO = "2025-01-15T03:00";
  const variables = [
    "temperature_2m",
    "surface_pressure",
    "wind_speed_850hPa",
    "wind_direction_850hPa",
  ];

  const weatherData = fetchWeatherData(
    latitude,
    longitude,
    dateTimeISO,
    variables
  );

  console.log(weatherData);
}
