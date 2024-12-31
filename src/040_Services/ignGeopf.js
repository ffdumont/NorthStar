function fetchIgnGeopfData(lat, lon) {
  const baseUrl =
    "https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json";
  const params = `?lon=${encodeURIComponent(lon)}&lat=${encodeURIComponent(
    lat
  )}&resource=ign_rge_alti_wld&delimiter=%7C&indent=false&measures=false&zonly=false`;
  const url = baseUrl + params;

  try {
    const response = UrlFetchApp.fetch(url);
    const json = JSON.parse(response.getContentText());

    if (json && json.elevations && json.elevations.length > 0) {
      return parseFloat(json.elevations[0].z); // Return the elevation "z" as a float
    } else {
      throw new Error("No elevation data found");
    }
  } catch (error) {
    throw new Error("Error fetching elevation data: " + error.message);
  }
}
