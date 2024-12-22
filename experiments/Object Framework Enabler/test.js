// Test Function to Run Script
function testWaypointCreation() {
  const waypoints = getWaypointsFromSheet();
  Logger.log(`Created ${Object.keys(waypoints).length} waypoints.`);
}

// Test Function to Run Script
function testLegCreation() {
  const waypoints = getWaypointsFromSheet();
  Logger.log(`Created ${Object.keys(waypoints).length} waypoints.`);
  const legs = getLegsFromSheet(waypoints);
  Logger.log(`Created ${Object.keys(legs).length} legs.`);
  Logger.log(
    `Great-circle distance: ${legs[1].greatCircleDistance().toFixed(2)} Nmi`
  );
}
