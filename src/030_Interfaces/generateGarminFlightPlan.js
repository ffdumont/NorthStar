function generateGarminFlightPlan(flightPlan) {
  const xmlNamespace = "http://www8.garmin.com/xmlschemas/FlightPlan/v1";

  function escapeXML(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function addRoutePointIfNotDuplicate(routePoint, mergedRoutePoints) {
    if (
      !mergedRoutePoints.some(
        (existingPoint) =>
          existingPoint.waypointIdentifier === routePoint.waypointIdentifier &&
          existingPoint.waypointType === routePoint.waypointType
      )
    ) {
      mergedRoutePoints.push(routePoint);
    }
  }

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

  const waypointSet = new Map();
  flightPlan.routes.forEach((route) => {
    Object.values(route.legs).forEach((leg) => {
      if (!waypointSet.has(leg.from.name))
        waypointSet.set(leg.from.name, leg.from);
      if (!waypointSet.has(leg.to.name)) waypointSet.set(leg.to.name, leg.to);
    });
  });

  // ✅ FIX: Initialize mergedRoutePoints BEFORE using it
  const mergedRoutePoints = [];

  flightPlan.routes.forEach((route) => {
    addRoutePointIfNotDuplicate(
      {
        waypointIdentifier: route.departureAirfield.airfieldDesignator,
        waypointType: "AIRPORT",
      },
      mergedRoutePoints
    );

    Object.values(route.legs).forEach((leg) => {
      addRoutePointIfNotDuplicate(
        { waypointIdentifier: leg.from.name, waypointType: "USER WAYPOINT" },
        mergedRoutePoints
      );
      addRoutePointIfNotDuplicate(
        { waypointIdentifier: leg.to.name, waypointType: "USER WAYPOINT" },
        mergedRoutePoints
      );
    });

    addRoutePointIfNotDuplicate(
      {
        waypointIdentifier: route.destinationAirfield.airfieldDesignator,
        waypointType: "AIRPORT",
      },
      mergedRoutePoints
    );
  });

  // Explicitly add the final destination airfield, ignoring deduplication
  const finalAirfield =
    flightPlan.routes[flightPlan.routes.length - 1].destinationAirfield;
  mergedRoutePoints.push({
    waypointIdentifier: finalAirfield.airfieldDesignator,
    waypointType: "AIRPORT",
  });

  // Build the XML
  let xml = `<flight-plan xmlns="${xmlNamespace}">\n`;
  xml += `\t<file-description>${mergedRouteName}</file-description>\n`;
  xml += `\t<author>\n`;
  xml += `\t\t<author-name>SkyDreamSoft</author-name>\n`;
  xml += `\t\t<email id="info" domain="skydreamsoft.fr"/>\n`;
  xml += `\t\t<link>https://skydreamsoft.fr</link>\n`;
  xml += `\t</author>\n`;
  xml += `\t<link/>\n`;
  xml += `\t<created>${new Date().toISOString()}</created>\n`;

  xml += `\t<waypoint-table>\n`;
  waypointSet.forEach((waypoint) => {
    xml += `\t\t<waypoint>\n`;
    xml += `\t\t\t<identifier>${escapeXML(waypoint.name)}</identifier>\n`;
    xml += `\t\t\t<type>USER WAYPOINT</type>\n`;
    xml += `\t\t\t<country-code/>\n`;
    xml += `\t\t\t<lat>${waypoint.latitude}</lat>\n`;
    xml += `\t\t\t<lon>${waypoint.longitude}</lon>\n`;
    xml += `\t\t\t<comment/>\n`;
    xml += `\t\t</waypoint>\n`;
  });
  xml += `\t</waypoint-table>\n`;

  xml += `\t<route>\n`;
  xml += `\t\t<route-name>${mergedRouteName}</route-name>\n`;
  xml += `\t\t<flight-plan-index>1</flight-plan-index>\n`;

  mergedRoutePoints.forEach((routePoint) => {
    xml += `\t\t<route-point>\n`;
    xml += `\t\t\t<waypoint-identifier>${escapeXML(
      routePoint.waypointIdentifier
    )}</waypoint-identifier>\n`;
    xml += `\t\t\t<waypoint-type>${routePoint.waypointType}</waypoint-type>\n`;
    xml += `\t\t\t<waypoint-country-code/>\n`;
    xml += `\t\t</route-point>\n`;
  });

  xml += `\t</route>\n`;
  xml += `</flight-plan>\n`;

  const folder = getSheetFolder();
  if (!folder) {
    Logger.log("⚠️ Error: Unable to find the Google Sheet folder.");
    return null;
  }

  const fileName = `${mergedRouteName}.xml`;
  const file = folder.createFile(fileName, xml, MimeType.PLAIN_TEXT);
  Logger.log(`✅ Garmin Flight Plan XML created: ${file.getUrl()}`);

  return file.getUrl();
}
