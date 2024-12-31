function fetchNoaaGeomagData(lat, lon, keyword) {
  const apiKey = "zNEw7"; // Replace with your actual API key
  const url = `https://www.ngdc.noaa.gov/geomag-web/calculators/calculateDeclination?lat1=${lat}&lon1=${lon}&key=${apiKey}&resultFormat=xml`;

  const response = UrlFetchApp.fetch(url);
  const xmlString = response.getContentText();

  const xmlDoc = XmlService.parse(xmlString);
  const root = xmlDoc.getRootElement();
  const result = root.getChild("result");
  const value = parseFloat(result.getChild(keyword).getText());

  return value;
}
