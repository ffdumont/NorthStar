class FlightPlan {
  constructor(routes, name) {
    // ✅ Add `name` parameter
    this.name = name; // ✅ Store the generated flight plan name
    this.routes = routes; // ✅ Store routes array
  }

  saveToCache() {
    const cache = CacheService.getScriptCache();
    cache.put("flightPlan", JSON.stringify(this), 21600); // Cache for 6 hours
    Logger.log("Flight plan saved to cache.");
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
}

class Airfield {
  constructor(airfieldName, airfieldDesignator, latitude, longitude) {
    this.airfieldName = airfieldName;
    this.airfieldDesignator = airfieldDesignator;
    this.latitude = latitude;
    this.longitude = longitude;
  }
}

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
      leg.calculateTrueTrack(); // Calculate true track
      leg.calculateMagneticTrack(); // Calculate magnetic track
      // Add the leg to the legs object with legNumber as the key
      legs[legNumber] = leg;

      // Increment the leg number
      legNumber++;
    }

    // Construct the Route object
    return new Route(departureAirfield, destinationAirfield, legs, route.name);
  });

  const airfieldSequence = constructedRoutes
    .map((route) => route?.departureAirfield?.airfieldDesignator) // ✅ Correct property
    .filter(Boolean) // Remove undefined values
    .concat(
      constructedRoutes.slice(-1)[0]?.destinationAirfield?.airfieldDesignator ||
        "UNKNOWN"
    ) // ✅ Correct property, safe fallback
    .join("-"); // Join with hyphens

  console.log("Generated FlightPlan Name:", airfieldSequence);

  // Construct the FlightPlan object with the generated name
  return new FlightPlan(constructedRoutes, airfieldSequence);
}
