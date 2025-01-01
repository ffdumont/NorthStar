Leg.prototype.pressure = async function () {
  const midpoint = this.calculateMidpoint();
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Set time to 12:00 PM
  const dateString = today.toISOString().slice(0, 19) + "Z"; // Format date as ISO string

  try {
    const data = await fetchWeatherData(midpoint.lat, midpoint.lon);
    const pressure = getWeatherVariable(data, dateString, "pressure_msl");
    return pressure;
  } catch (error) {
    console.error("Error fetching pressure:", error.message);
    throw error;
  }
};
