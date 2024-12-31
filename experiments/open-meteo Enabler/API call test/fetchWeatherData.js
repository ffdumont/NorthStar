const fetch = require("node-fetch");

function fetchWeatherData(latitude, longitude) {
  const url = `https://fetch-weather-service-crxvm2tubq-od.a.run.app/data?latitude=${latitude}&longitude=${longitude}&variables=temperature_2m&variables=pressure_msl`;
  return fetch(url)
    .then((response) => response.json())
    .then((data) => data);
}

// Export both functions
module.exports = {
  fetchWeatherData,
  getWeatherForDate,
};

function getWeatherForDate(data, date) {
  const result = data.find((entry) => {
    const entryDate = new Date(entry.date).toISOString().slice(0, 19) + "Z"; // Normalize to remove milliseconds
    return entryDate === date;
  });

  if (result) {
    console.log(`Date: ${result.date}`);
    console.log(`Temperature: ${result.temperature_2m}`);
    console.log(`Pressure: ${result.pressure_msl}`);
    return {
      temperature: result.temperature_2m,
      pressure: result.pressure_msl,
    };
  } else {
    console.log("No data found for the given date.");
    return null;
  }
}
