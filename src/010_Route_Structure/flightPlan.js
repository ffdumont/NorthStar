class FlightPlan {
  constructor(routes, name, airfields) {
    // ✅ Add `name` parameter
    this.name = name; // ✅ Store the generated flight plan name
    this.routes = routes; // ✅ Store routes array
    this.airfields = airfields; // ✅ Collect airfields from routes
    this.finalReserveTime = 30; // ✅ Add default final reserve fuel
    this.captainReserveTime = 30; // ✅ Add default captain reserve fuel
    this.flightPlanTime = null; // ✅ Store total flight plan time
  }

  saveToCache() {
    const cache = CacheService.getScriptCache();
    const flightPlanJSON = JSON.stringify(this);

    // Calculate the approximate size in bytes
    const sizeInBytes = flightPlanJSON.length * 2; // UTF-16 encoding (2 bytes per character)

    Logger.log(`🔹 Attempting to cache flight plan...`);
    Logger.log(`📏 Flight plan JSON size: ${sizeInBytes} bytes`);

    if (sizeInBytes > 100000) {
      Logger.log(
        "⚠️ Flight plan is too large to cache (100KB limit exceeded). Consider alternative storage."
      );
      return;
    }

    cache.put("flightPlan", flightPlanJSON, 21600); // Cache for 6 hours
    Logger.log("✅ Flight plan successfully saved to cache.");
  }

  static loadFromCache() {
    const cache = CacheService.getScriptCache();
    const data = cache.get("flightPlan");

    if (data) {
      Logger.log("Flight plan retrieved from cache.");
      const parsedData = JSON.parse(data);

      // Recreate FlightPlan object
      const flightPlan = Object.assign(new FlightPlan([]), parsedData);

      // Recreate Route objects
      flightPlan.routes = parsedData.routes.map((routeData) => {
        const route = Object.assign(new Route(), routeData);

        // Recreate legs as instances of Leg
        route.legs = {};
        for (const legNumber in routeData.legs) {
          route.legs[legNumber] = Object.assign(
            new Leg(),
            routeData.legs[legNumber]
          );
        }

        // Recreate waypoints as instances of Waypoint
        route.waypoints = {};
        for (const waypointName in routeData.waypoints) {
          route.waypoints[waypointName] = Object.assign(
            new Waypoint(),
            routeData.waypoints[waypointName]
          );
        }

        return route;
      });

      return flightPlan;
    } else {
      Logger.log("No flight plan found in cache.");
      return null;
    }
  }
  // Compute total flight plan time
  calculateFlightPlanTime() {
    // 1. Sum of routeTime for all routes
    const totalRouteTime = this.routes.reduce(
      (sum, route) => sum + (route.routeTime || 0),
      0
    );

    // 2. Add finalReserveTime and CaptainReserveTime
    this.flightPlanTime =
      totalRouteTime + this.finalReserveTime + this.captainReserveTime;

    return this.flightPlanTime;
  }
}

function constructFlightPlan(routes) {
  const constructedRoutes = routes.map((route) => {
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

    // Create Airfield objects
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
      const targetAltitude = mToFt(route.waypoints[i].waypointAltitude) || 0;

      // ✅ Create leg with name included in the constructor
      const legName = `${fromWaypoint.name} - ${toWaypoint.name}`;
      const leg = new Leg(
        legName, // ✅ Name assigned directly in the constructor
        legNumber,
        fromWaypoint,
        toWaypoint,
        targetAltitude,
        100
      ); // TrueAirSpeed defaulted to 100
      leg.calculateDistance(); // Calculate distance
      leg.calculateMidPoint(); // Calculate midpoint
      leg.calculateElevation();
      leg.calculateTrueTrack(); // Calculate true track
      leg.calculateMagneticDeclination(); // Calculate magnetic declination
      leg.calculateMagneticTrack(); // Calculate magnetic track
      // Add the leg to the legs object with legNumber as the key
      legs[legNumber] = leg;

      // Increment the leg number
      legNumber++;
    }

    // Construct the Route object
    return new Route(departureAirfield, destinationAirfield, legs, route.name);
  });

  // ✅ Collect airfields once, outside of FlightPlan
  function collectAirfields(routes) {
    const airfieldMap = new Map();
    routes.forEach((route) => {
      airfieldMap.set(
        route.departureAirfield.airfieldDesignator,
        route.departureAirfield
      );
      airfieldMap.set(
        route.destinationAirfield.airfieldDesignator,
        route.destinationAirfield
      );
    });
    return Array.from(airfieldMap.values());
  }

  const airfields = collectAirfields(constructedRoutes); // ✅ Collect airfields once
  const airfieldSequence = constructedRoutes
    .map((route) => route?.departureAirfield?.airfieldDesignator)
    .filter(Boolean)
    .concat(
      constructedRoutes.slice(-1)[0]?.destinationAirfield?.airfieldDesignator ||
        "UNKNOWN"
    )
    .join("-");

  console.log("Generated FlightPlan Name:", airfieldSequence);

  // ✅ Pass airfields explicitly to FlightPlan constructor
  return new FlightPlan(constructedRoutes, airfieldSequence, airfields);
}
