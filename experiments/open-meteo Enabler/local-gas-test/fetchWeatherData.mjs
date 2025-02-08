const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

let weatherArray = [];

async function fetchWeatherData() {
  const latitude = 48.8566;
  const longitude = 2.3522;

  const apiUrl = `http://127.0.0.1:5000/data?latitude=${latitude}&longitude=${longitude}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Store the data in the array
    weatherArray = data.map((entry) => ({
      date: new Date(entry.date).toUTCString(), // Convert to 'Sat, 04 Jan 2025 02:00:00 GMT'
      temperature: entry.temperature_2m,
      pressure: entry.pressure_msl,
    }));

    console.log("Weather Data Array Loaded.");
  } catch (error) {
    console.error("Error fetching weather data:", error.message);
  }
}

// Function to get weather by date (in 'GMT' format)
function getWeatherByDate(targetDate) {
  try {
    const target = new Date(targetDate).toUTCString(); // Normalize target date
    const result = weatherArray.find((entry) => entry.date === target);

    if (!result) {
      throw new Error(`No weather data found for date: ${targetDate}`);
    }

    // Return the result if found
    console.log(`Weather for ${targetDate}:`);
    console.log(`Temperature: ${result.temperature}°C`);
    console.log(`Pressure: ${result.pressure} hPa`);

    return result;
  } catch (error) {
    console.error(error.message);
    return null;
  }
}

// Run the weather fetch and test date lookup
(async () => {
  await fetchWeatherData();

  // Test with an existing and non-existing date
  getWeatherByDate("Sat, 04 Jan 2025 02:00:00 GMT"); // Existing date
  getWeatherByDate("Mon, 31 Dec 2025 12:00:00 GMT"); // Non-existing date
})();
