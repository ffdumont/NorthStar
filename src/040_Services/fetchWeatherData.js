const fetch = require("node-fetch");

async function fetchWeatherData(latitude, longitude) {
  const url = `https://fetch-weather-service-crxvm2tubq-od.a.run.app/data?latitude=${latitude}&longitude=${longitude}&variables=temperature_2m&variables=pressure_msl`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

function getWeatherVariable(data, date, variable) {
  const result = data.find((entry) => {
    const entryDate = new Date(entry.date).toISOString().slice(0, 19) + "Z"; // Normalize to remove milliseconds
    return entryDate === date;
  });

  if (result) {
    if (result.hasOwnProperty(variable)) {
      return result[variable];
    } else {
      throw new Error(`Variable "${variable}" not found in data`);
    }
  } else {
    throw new Error(`No data found for date "${date}"`);
  }
}

// Export both functions
module.exports = {
  fetchWeatherData,
  getWeatherVariable,
};
