const XLSX = require("xlsx");
const fs = require("fs");

async function fetchWeatherData() {
  const latitude = 48.8566;
  const longitude = 2.3522;
  const apiUrl = `http://127.0.0.1:5000/data?latitude=${latitude}&longitude=${longitude}`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Weather Data");

    XLSX.writeFile(workbook, "weather_data.xlsx");
    console.log("Data written to weather_data.xlsx");
  } catch (error) {
    console.error("Error fetching weather data:", error.message);
  }
}

fetchWeatherData();
