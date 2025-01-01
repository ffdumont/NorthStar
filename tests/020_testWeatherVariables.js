async function testWeatherVariables() {
  const leg = new Leg(
    1,
    { lat: 48.99861, lon: 1.941667, name: "LFXU" },
    { lat: 48.961992, lon: 1.9188, name: "XUSW" },
    10000
  );

  const variablesToTest = ["pressure_msl", "temperature_2m"]; // Add other variables as needed

  try {
    for (const variable of variablesToTest) {
      const value = await leg.fetchWeatherVariable(variable); // Dynamically fetch each variable
      console.log(`${variable}: ${value}`);
    }
  } catch (error) {
    console.error("Error fetching weather variable:", error.message);
  }
}
