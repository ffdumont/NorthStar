async function testPushLegResults() {
  route = new Route();
  route.getWaypointsFromSheet();
  await route.getLegsFromSheet(); // Await the asynchronous function

  Logger.log("Route Data: " + JSON.stringify(route));

  pushLegResults(route, "distance");
  pushLegResults(route, "trueTrack");
  pushLegResults(route, "magneticTrack");
  pushLegResults(route, "minimalSecurityAltitude");

  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Route data processed and distances updated!",
    "Success",
    3
  );
}
