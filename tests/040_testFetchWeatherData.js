const {
  getWeatherVariable,
  fetchWeatherData,
} = require("../src/040_Services/fetchWeatherData.js");

const latitude = 48.9917;
const longitude = 1.9097;
const date = "2025-01-01T01:00:00Z";
const variable = "temperature_2m";

(async () => {
  try {
    const data = await fetchWeatherData(latitude, longitude);
    const result = getWeatherVariable(data, date, variable);
    console.log(`Fetched ${variable}:`, result);
  } catch (error) {
    console.error("Error:", error.message);
  }
})();
