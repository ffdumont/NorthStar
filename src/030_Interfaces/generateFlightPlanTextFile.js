function generateFlightPlanTextFile(flightPlan) {
  let content = "";

  // Generate the concatenated route name (e.g., XUONOLPDXU)
  const airfieldIdentifiers = [];
  flightPlan.routes.forEach((route) => {
    const departureSuffix =
      route.departureAirfield.airfieldDesignator.slice(-2);
    if (!airfieldIdentifiers.includes(departureSuffix)) {
      airfieldIdentifiers.push(departureSuffix);
    }

    const destinationSuffix =
      route.destinationAirfield.airfieldDesignator.slice(-2);
    if (!airfieldIdentifiers.includes(destinationSuffix)) {
      airfieldIdentifiers.push(destinationSuffix);
    }
  });
  const mergedRouteName = airfieldIdentifiers.join("");

  // 1. Airfields Section
  content += "AIRFIELDS:\n";
  const airfields = new Map();

  flightPlan.routes.forEach((route) => {
    const departure = route.departureAirfield;
    const destination = route.destinationAirfield;

    airfields.set(departure.airfieldDesignator, departure);
    airfields.set(destination.airfieldDesignator, destination);
  });

  airfields.forEach((airfield) => {
    content += `- Name: ${airfield.airfieldName}\n`;
    content += `  Designator: ${airfield.airfieldDesignator}\n`;
    content += `  Latitude: ${airfield.latitude}\n`;
    content += `  Longitude: ${airfield.longitude}\n\n`;
  });

  // 2. Waypoints Section
  content += "WAYPOINTS:\n";
  const waypointCache = new Map();

  flightPlan.routes.forEach((route) => {
    Object.values(route.legs).forEach((leg) => {
      const from = leg.from;
      const to = leg.to;

      if (!waypointCache.has(from.name)) waypointCache.set(from.name, from);
      if (!waypointCache.has(to.name)) waypointCache.set(to.name, to);
    });
  });

  waypointCache.forEach((waypoint) => {
    content += `- Name: ${waypoint.name}\n`;
    content += `  Latitude: ${waypoint.latitude}\n`;
    content += `  Longitude: ${waypoint.longitude}\n\n`;
  });

  // 3. Flight Plan Section
  content += "FLIGHT PLAN:\n";
  flightPlan.routes.forEach((route) => {
    content += `- Route: ${route.name}\n`;
    content += `  Departure Airfield: ${route.departureAirfield.airfieldName}\n`;
    content += `  Destination Airfield: ${route.destinationAirfield.airfieldName}\n`;
    content += `  Legs:\n`;

    Object.values(route.legs).forEach((leg) => {
      content += `    - Leg ${leg.legNumber}: From: ${leg.from.name}, To: ${leg.to.name}, Altitude: ${leg.targetAltitude}\n`;
    });

    content += "\n";
  });

  // Get the Sheet folder and store the file inside it
  const folder = getSheetFolder();
  if (!folder) {
    Logger.log("⚠️ Error: Unable to find the Google Sheet folder.");
    return null;
  }

  // Write the content to a file inside the correct folder
  const fileName = `${mergedRouteName}.txt`;
  const file = folder.createFile(fileName, content, MimeType.PLAIN_TEXT);
  Logger.log(`✅ Flight plan text file created: ${file.getUrl()}`);

  return file.getUrl();
}
