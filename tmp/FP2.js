function constructFlightPlan(routes) {
  const constructedRoutes = routes.map((route) => {
    // Extract first and last airfield waypoints for the route
    const firstAirfield = route.waypoints[0]; // First waypoint (always airfield)
    const lastAirfield = route.waypoints[route.waypoints.length - 1]; // Last waypoint (always airfield)

    if (
      !firstAirfield ||
      !lastAirfield ||
      firstAirfield.waypointType !== "airfield" ||
      lastAirfield.waypointType !== "airfield"
    ) {
      throw new Error(
        `Route ${route.name} does not start and end with airfield waypoints.`
      );
    }

    // Create Airfield objects for departure and destination
    const departureAirfield = new Airfield(
      firstAirfield.airfieldName,
      firstAirfield.airfieldDesignator,
      firstAirfield.latitude,
      firstAirfield.longitude
    );

    const destinationAirfield = new Airfield(
      lastAirfield.airfieldName,
      lastAirfield.airfieldDesignator,
      lastAirfield.latitude,
      lastAirfield.longitude
    );

    // Cache to store unique Waypoint objects
    const waypointCache = new Map();

    // Helper function to get or create a Waypoint
    function getOrCreateWaypoint(waypointData) {
      if (!waypointCache.has(waypointData.waypointName)) {
        const waypoint = new Waypoint(
          waypointData.waypointName,
          waypointData.latitude,
          waypointData.longitude
        );
        waypointCache.set(waypointData.waypointName, waypoint);
      }
      return waypointCache.get(waypointData.waypointName);
    }

    // Construct Leg objects for the route
    // Exclude the first waypoint (departure airfield) and the last waypoint (destination airfield)
    const legs = {};
    let legNumber = 1; // Start leg numbering at 1

    for (let i = 1; i < route.waypoints.length - 1; i++) {
      // Ensure we skip the leg that ends at the destination airfield
      if (i + 1 === route.waypoints.length - 1) {
        break; // Exit the loop before creating a leg to the destination airfield
      }

      const fromWaypoint = getOrCreateWaypoint(route.waypoints[i]);
      const toWaypoint = getOrCreateWaypoint(route.waypoints[i + 1]);

      // Target altitude is set by the altitude of the "from" waypoint
      const targetAltitude = route.waypoints[i].waypointAltitude || 0;

      // Create the leg object
      const leg = new Leg(
        legNumber,
        fromWaypoint,
        toWaypoint,
        targetAltitude,
        0
      ); // TrueAirSpeed defaulted to 0
      leg.name = `${fromWaypoint.name} - ${toWaypoint.name}`; // Assign leg name

      // Add the leg to the legs object with legNumber as the key
      legs[legNumber] = leg;

      // Increment the leg number
      legNumber++;
    }

    // Construct the Route object
    return new Route(departureAirfield, destinationAirfield, legs, route.name);
  });

  // Construct the FlightPlan object
  return new FlightPlan(constructedRoutes);
}
