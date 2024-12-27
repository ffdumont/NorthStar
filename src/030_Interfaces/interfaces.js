function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("NorthStar")
    .addItem("Process Route Data", "processRouteData")
    .addToUi();
}

function processRouteData() {
  const route = new Route();
  route.getWaypointsFromSheet();
  route.getLegsFromSheet();
  pushLegResults(route, "Distance");
  pushLegResults(route, "TrueTrack");
  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Route data processed and distances updated!",
    "Success",
    3
  );
}
