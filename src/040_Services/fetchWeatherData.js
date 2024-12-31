async function fetchWeatherData(latitude, longitude) {
  try {
    const response = await fetch(
      `/data?latitude=${latitude}&longitude=${longitude}`
    );
    const data = await response.json();

    // Display data in the console or manipulate it further
    console.log(data);

    const container = document.getElementById("weatherData");
    container.innerHTML = ""; // Clear previous results

    data.forEach((entry) => {
      container.innerHTML += `
                <p>
                    Date: ${entry.date}, 
                    Temp: ${entry.temperature_2m}°C, 
                    Pressure: ${entry.pressure_msl} hPa
                </p>`;
    });
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

// Example call with hardcoded coordinates (Paris)
fetchWeatherData(48.8566, 2.3522);
