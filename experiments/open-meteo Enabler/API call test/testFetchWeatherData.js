const { fetchWeatherData, getWeatherForDate } = require("./fetchWeatherData");

async function testFetchWeatherData() {
  const latitude = 48.9917;
  const longitude = 1.9097;
  const testDate = "2024-12-31T01:00:00Z"; // Match exact date-time

  console.log("Running fetchWeatherData test...");

  try {
    const data = await fetchWeatherData(latitude, longitude);
    console.log("Fetched Data:", data);

    if (Array.isArray(data) && data.length > 0) {
      console.log("Data format is valid.");

      const weatherData = getWeatherForDate(data, testDate);

      if (weatherData) {
        console.log("Test Passed! Weather data for the date:");
        console.log(weatherData);
      } else {
        console.log("Test Failed: No weather data for the specified date.");
      }
    } else {
      console.log("Test Failed: No data returned or invalid format.");
    }
  } catch (error) {
    console.error("Test Failed with error:", error);
  }
}

// Run the test
testFetchWeatherData();
