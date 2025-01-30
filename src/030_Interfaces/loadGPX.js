function loadFileFromDrive(date) {
  const date_hour = convertDateToYYYYMMDD_HHMM(date);
  const fileNamePattern = `${date_hour}_LogNav_`; // e.g., "20250125_10_LogNav_"
  const files = DriveApp.getFiles();

  while (files.hasNext()) {
    const file = files.next();
    if (file.getName().startsWith(fileNamePattern)) {
      return file; // Return the first match
    }
  }

  throw new Error(`File not found: ${fileNamePattern}`);
}
function verifyGPXFile(file) {
  const content = file.getBlob().getDataAsString();
  const document = XmlService.parse(content);
  const root = document.getRootElement();

  // Retrieve namespace and creator
  const namespace = root.getNamespace().getURI();
  const creatorAttribute = root.getAttribute("creator");
  const creator = creatorAttribute ? creatorAttribute.getValue() : "Unknown";

  // Log the namespace and creator
  Logger.log(`Namespace: ${namespace}`);
  Logger.log(`Creator: ${creator}`);

  // Validate namespace
  if (
    root.getName() !== "gpx" ||
    namespace !== "http://www.topografix.com/GPX/1/1"
  ) {
    throw new Error("File is not a valid GPX file.");
  }

  // Validate creator
  if (creator !== "SkyDreamSoft") {
    throw new Error("GPX file was not created by SkydreamSoft.");
  }

  return document;
}

function loadRoutes(document) {
  const root = document.getRootElement();
  Logger.log(`Root element: ${root.getName()}`);

  // Retrieve all <rte> elements
  const routes = root.getChildren("rte", root.getNamespace());
  Logger.log(`Number of <rte> elements found: ${routes.length}`);

  const result = [];

  routes.forEach((route, index) => {
    const routeName = route.getChildText("name", root.getNamespace());
    Logger.log(`Route ${index + 1} name: ${routeName || "Unnamed Route"}`);

    const waypoints = route.getChildren("rtept", root.getNamespace());
    Logger.log(
      `Number of waypoints in route ${index + 1}: ${waypoints.length}`
    );

    const routeData = {
      name: routeName || `Route ${index + 1}`,
      waypoints: [],
    };

    waypoints.forEach((wpt, waypointIndex) => {
      // Convert latitude, longitude, and magneticDeclination to float during load
      const waypointData = {
        latitude: wpt.getAttribute("lat")
          ? parseFloat(wpt.getAttribute("lat").getValue())
          : null,
        longitude: wpt.getAttribute("lon")
          ? parseFloat(wpt.getAttribute("lon").getValue())
          : null,
        waypointAltitude: wpt.getChildText("ele", root.getNamespace())
          ? parseFloat(wpt.getChildText("ele", root.getNamespace()))
          : null,
        magneticDeclination: wpt.getChildText("magvar", root.getNamespace())
          ? parseFloat(wpt.getChildText("magvar", root.getNamespace()))
          : null,
        waypointName: wpt.getChildText("name", root.getNamespace()),
      };

      Logger.log(
        `Waypoint ${waypointIndex + 1}: ${JSON.stringify(waypointData)}`
      );
      routeData.waypoints.push(waypointData);
    });

    result.push(routeData);
  });

  Logger.log("Final routes data:", JSON.stringify(result, null, 2));
  return result;
}

function processAirfieldWaypoints(routes) {
  // Regex to match airfield names (e.g., "LFPD - BERNAY SAINT MARTIN")
  const airfieldRegex = /^LF[A-Z]{2} - .+/;

  routes.forEach((route) => {
    const waypoints = route.waypoints;

    waypoints.forEach((waypoint) => {
      const waypointName = waypoint.waypointName;

      // Check if the waypoint is an airfield
      if (airfieldRegex.test(waypointName)) {
        const parts = waypointName.split(" - "); // Split into designator and name
        waypoint.waypointType = "airfield";
        waypoint.airfieldDesignator = parts[0]; // e.g., "LFPD"
        waypoint.airfieldName = parts[1]; // e.g., "BERNAY SAINT MARTIN"

        // Remove waypointAltitude (ele) for airfield waypoints
        delete waypoint.waypointAltitude;
      }
    });
  });

  return routes; // Return updated routes
}

function processTransitionWaypoints(routes) {
  // Regex to match transition waypoint names (e.g., "PDNN", "PDSE")
  const transitionRegex = /^[A-Z]{2}(NN|NE|EE|SE|SS|SW|WW|NW)$/;

  routes.forEach((route) => {
    const waypoints = route.waypoints;

    waypoints.forEach((waypoint, index) => {
      if (waypoint.waypointType === "airfield") {
        const airfieldDesignator = waypoint.airfieldDesignator;
        const lastTwoChars = airfieldDesignator.slice(-2); // e.g., "PD"

        // Check previous waypoint
        if (index > 0) {
          const prevWaypoint = waypoints[index - 1];
          if (transitionRegex.test(prevWaypoint.waypointName)) {
            const prefix = prevWaypoint.waypointName.slice(0, 2);
            if (prefix === lastTwoChars) {
              prevWaypoint.waypointType = "transitionWaypoint";
            } else {
              Logger.log(
                `Error: No valid transition waypoint before ${airfieldDesignator} airfield.`
              );
            }
          } else {
            Logger.log(
              `Error: No transition waypoint before ${airfieldDesignator} airfield.`
            );
          }
        }

        // Check next waypoint
        if (index < waypoints.length - 1) {
          const nextWaypoint = waypoints[index + 1];
          if (transitionRegex.test(nextWaypoint.waypointName)) {
            const prefix = nextWaypoint.waypointName.slice(0, 2);
            if (prefix === lastTwoChars) {
              nextWaypoint.waypointType = "transitionWaypoint";
            } else {
              Logger.log(
                `Error: No valid transition waypoint after ${airfieldDesignator} airfield.`
              );
            }
          } else {
            Logger.log(
              `Error: No transition waypoint after ${airfieldDesignator} airfield.`
            );
          }
        }
      }
    });
  });

  return routes; // Return the updated routes
}

function splitRoutesByAirfields(route) {
  const splitRoutes = [];
  let currentRoute = null;

  // Iterate over the waypoints in the route
  route.waypoints.forEach((waypoint, index) => {
    if (waypoint.waypointType === "airfield") {
      // Skip the first and last airfield waypoints for splitting
      if (index === 0 || index === route.waypoints.length - 1) {
        if (currentRoute) {
          // Add the airfield as the last waypoint of the current route
          currentRoute.waypoints.push(waypoint);

          // Finalize and save the current route
          if (currentRoute.waypoints.length > 2) {
            currentRoute.name = `${currentRoute.waypoints[0].airfieldDesignator}-${waypoint.airfieldDesignator}`;
            splitRoutes.push(currentRoute);
          }
          currentRoute = null;
        } else {
          // Start the first route with the first airfield
          currentRoute = {
            name: null,
            waypoints: [waypoint],
          };
        }
        return;
      }

      // For intermediate airfield waypoints, split the route
      if (currentRoute) {
        // Add the airfield as the last waypoint of the current route
        currentRoute.waypoints.push(waypoint);

        // Finalize and save the current route
        if (currentRoute.waypoints.length > 2) {
          currentRoute.name = `${currentRoute.waypoints[0].airfieldDesignator}-${waypoint.airfieldDesignator}`;
          splitRoutes.push(currentRoute);
        }
      }

      // Start a new route with the current airfield as the first waypoint
      currentRoute = {
        name: null,
        waypoints: [waypoint],
      };
    } else if (currentRoute) {
      // Add non-airfield waypoints to the current route
      currentRoute.waypoints.push(waypoint);
    }
  });

  // Finalize the last route if it exists
  if (currentRoute && currentRoute.waypoints.length > 2) {
    const lastWaypoint =
      currentRoute.waypoints[currentRoute.waypoints.length - 1];
    currentRoute.name = `${currentRoute.waypoints[0].airfieldDesignator}-${lastWaypoint.airfieldDesignator}`;
    splitRoutes.push(currentRoute);
  }

  return splitRoutes;
}
