function testRouteCreation() {
  route = new Route();
  route.waypoints = {
    POINTA: new Waypoint("POINTA", 40.7128, -74.006),
    POINTB: new Waypoint("POINTB", 34.0522, -118.2437),
  };

  route.legs[1] = new Leg(
    1,
    route.waypoints.POINTA,
    route.waypoints.POINTB,
    35000
  );

  Logger.log("Testing Route:");
  Logger.log(route.legs[1].toString());
  Logger.log("Distance (NMI): " + route.legs[1].greatCircleDistance());
}
