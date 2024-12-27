function testPushLegResults() {
  route = new Route();
  route.getWaypointsFromSheet();
  route.getLegsFromSheet();
  Logger.log("Route Data: " + JSON.stringify(route));
  Logger.log("trueTrack: " + route.legs[1].trueTrack());
  pushLegResults(route, "Distance");
  pushLegResults(route, "TrueTrack");
}
