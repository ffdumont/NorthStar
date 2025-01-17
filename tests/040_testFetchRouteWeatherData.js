function testFetchRouteWeatherData() {
  route = new Route();
  route.getWaypointsFromSheet();
  route.getLegsFromSheet();
  pushLegResults(route, "distance");
  pushLegResults(route, "trueTrack");
  pushLegResults(route, "magneticTrack");
  pushLegResults(route, "minimalSecurityAltitude");

  Logger.log("Route Data: " + JSON.stringify(route));

  route.saveToCache(); // Cache route object after full creation
  processWeatherData();
}
