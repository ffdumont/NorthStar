function dumpFlightPlanData(flightPlan) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Containers for extracted objects
  let flightPlans = []; // Store FlightPlan details
  let routes = new Map(); // Store unique Routes
  let legs = new Map(); // Store unique Legs using the generated `leg.name`
  let waypoints = new Map(); // Store unique Waypoints
  let airfields = new Map(); // Store unique Airfields

  // ✅ Store FlightPlan details, including time fields
  flightPlans.push({
    name: flightPlan.name,
    routes: flightPlan.routes.map((route) => route.name).join(", "),
    flightPlanTime: flightPlan.flightPlanTime || 0,
    finalReserveTime: flightPlan.finalReserveTime || 0,
    captainReserveTime: flightPlan.captainReserveTime || 0,
  });

  // Traverse all objects dynamically
  flightPlan.routes.forEach((route) => {
    routes.set(route.name, {
      name: route.name,
      departure: route.departureAirfield.airfieldDesignator,
      destination: route.destinationAirfield.airfieldDesignator,
      legs: Object.values(route.legs)
        .map((leg) => leg.name)
        .join(", "),
      routeTime: route.routeTime || 0, // ✅ Include route time
    });

    if (typeof route.legs === "object" && route.legs !== null) {
      Object.values(route.legs).forEach((leg) => {
        if (!leg || !leg.name) {
          console.error(`Error: Invalid leg in route ${route.name}`, leg);
          return; // Skip invalid legs
        }

        let legData = { routeName: route.name }; // Start with route name
        Object.keys(leg).forEach((attr) => {
          legData[attr] = leg[attr]; // Copy all properties dynamically
        });

        // ✅ Include time-related properties at leg level
        legData.legTimeWithoutWind = leg.legTimeWithoutWind || 0;
        legData.legTimeWithWind = leg.legTimeWithWind || 0;
        legData.LegMaxTime = leg.getLegMaxTime ? leg.getLegMaxTime() : 0; // If method exists

        legs.set(leg.name, legData); // Store the full leg object

        // Store unique waypoints
        if (leg.from && leg.from.name) {
          waypoints.set(leg.from.name, leg.from);
        } else {
          console.error(
            `Error: Invalid startWaypoint for leg ${leg.name} in ${route.name}`,
            leg.from
          );
        }

        if (leg.to && leg.to.name) {
          waypoints.set(leg.to.name, leg.to);
        } else {
          console.error(
            `Error: Invalid endWaypoint for leg ${leg.name} in ${route.name}`,
            leg.to
          );
        }
      });
    } else {
      console.error(
        `Error: route.legs is not a valid object for route ${route.name}`,
        route.legs
      );
    }
  });

  // ✅ Include all airfields
  flightPlan.airfields.forEach((airfield) => {
    let airfieldData = {};

    // Copy all properties dynamically
    Object.keys(airfield).forEach((attr) => {
      airfieldData[attr] = airfield[attr];
    });

    // ✅ Include relevant time-related properties
    airfieldData.taxiOutTime = airfield.taxiOutTime || 0;
    airfieldData.departureProcedureTime = airfield.departureProcedureTime || 0;
    airfieldData.taxiInTime = airfield.taxiInTime || 0;
    airfieldData.arrivalProcedureTime = airfield.arrivalProcedureTime || 0;

    airfields.set(airfield.airfieldDesignator, airfieldData);
  });

  // Convert Maps to Arrays for dumping
  let routeArray = Array.from(routes.values());
  let legArray = Array.from(legs.values());
  let waypointArray = Array.from(waypoints.values());
  let airfieldArray = Array.from(airfields.values());

  // Dump all extracted objects into separate sheets
  dumpInstancesToSheets(flightPlans, "FlightPlans"); // ✅ Now includes FlightPlan time fields
  dumpInstancesToSheets(routeArray, "Routes"); // ✅ Includes routeTime & procedureTime
  dumpInstancesToSheets(legArray, "Legs"); // ✅ Includes leg time fields
  dumpInstancesToSheets(waypointArray, "Waypoints");
  dumpInstancesToSheets(airfieldArray, "Airfields");
}

function dumpInstancesToSheets(objects, sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  } else {
    sheet.clear(); // Clear existing data
  }

  if (objects.length === 0) return; // No data to write

  // Extract headers dynamically from all objects
  let headers = new Set();
  objects.forEach((obj) => Object.keys(obj).forEach((key) => headers.add(key)));
  headers = Array.from(headers);

  // Write headers
  sheet.appendRow(headers);

  // Write data dynamically
  let data = objects.map((obj) =>
    headers.map((header) => {
      const value = obj[header];

      if (Array.isArray(value)) {
        // If value is an array, store only key references (avoid dumping full objects)
        return value
          .map((item) =>
            typeof item === "object" ? item.name || JSON.stringify(item) : item
          )
          .join(", ");
      } else if (typeof value === "object" && value !== null) {
        // If it's an object, store only its name or JSON string
        return value.name || JSON.stringify(value);
      }
      return value;
    })
  );

  // Write the extracted data
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);
}
