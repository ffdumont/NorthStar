function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("NorthStar")
    .addItem("Process Route Data", "processRouteData")
    .addItem("Fetch Weather Data", "processWeatherData")
    .addItem("Calculate Wind Correction", "processWindCorrection")
    .addItem("Generate Outputs", "generateOutputs")
    .addItem("Save Flight Plan to Drive", "saveFlightPlanToDrive")
    .addItem("Load Flight Plan from Drive", "loadFlightPlanFromDrive")
    .addToUi();
}

function processRouteData() {
  try {
    // Step 1: Load the file
    const file = loadFileFromDrive(getNamedRangeValue("gpxGenerationDateTime"));
    Logger.log(`Processing file: ${file.getName()}`);

    // Step 2: Verify the file
    const document = verifyGPXFile(file);

    // Step 3: Load route elements
    let routes = loadRoutes(document);

    // Step 4: Process airfield waypoints
    routes = processAirfieldWaypoints(routes);

    // Step 5: Process transition waypoints
    routes = processTransitionWaypoints(routes);

    // Step 6: Split routes by airfields
    const splitRoutes = [];
    routes.forEach((route) => {
      const subRoutes = splitRoutesByAirfields(route);
      splitRoutes.push(...subRoutes);
    });

    // Step 7: Construct the flight plan
    const flightPlan = constructFlightPlan(splitRoutes);

    // Log the final flight plan
    Logger.log("Final Flight Plan:");
    Logger.log(JSON.stringify(flightPlan, null, 2));
    flightPlan.saveToCache();
  } catch (error) {
    Logger.log(`Error: ${error.message}`);
  }
  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Route data processed and distances updated!",
    "Success",
    3
  );
}

function processWeatherData() {
  try {
    Logger.log("Attempting to load flight plan from cache...");
    const flightPlan = FlightPlan.loadFromCache();

    if (flightPlan) {
      Logger.log(
        "Flight plan successfully loaded from cache. Starting weather fetch..."
      );

      // Iterate over all routes in the flight plan
      flightPlan.routes.forEach((route) => {
        Logger.log(`Processing weather data for route: ${route.name}`);
        route.fetchRouteWeatherData();
      });
      // Log the updated flight plan
      Logger.log("Final Flight Plan:");
      Logger.log(JSON.stringify(flightPlan, null, 2));

      Logger.log(
        "Weather data fetched for all routes, saving flight plan to cache..."
      );

      flightPlan.saveToCache();

      SpreadsheetApp.getActiveSpreadsheet().toast(
        "Weather data fetched and applied for all routes!",
        "Success",
        3
      );
    } else {
      Logger.log(
        "Failed to load flight plan from cache. No flight plan found."
      );
      SpreadsheetApp.getActiveSpreadsheet().toast(
        "No flight plan found in cache. Process flight plan data first.",
        "Error",
        3
      );
    }
  } catch (error) {
    Logger.log("Unexpected error in processWeatherData: " + error.message);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      "Unexpected error occurred.",
      "Error",
      3
    );
  }
}

function processWindCorrection() {
  const flightPlan = FlightPlan.loadFromCache();

  flightPlan.routes.forEach((route) => {
    Object.values(route.legs).forEach((leg) => {
      // Calculate and assign ground speed
      leg.calculateGroundSpeed();

      // Calculate and assign magnetic heading
      leg.calculateMagneticHeading();

      // Calculate wind correction angle
      leg.windCorrectionAngle();

      // Calculate leg times
      leg.calculateLegTimeWithoutWind();
      leg.calculateLegTimeWithWind();
    });

    // ✅ Calculate route time after processing all legs
    route.calculateRouteTime();
  });

  // ✅ Now, calculate flight plan time using updated route times
  flightPlan.calculateFlightPlanTime();

  Logger.log("Final Flight Plan:");
  Logger.log(JSON.stringify(flightPlan, null, 2));

  flightPlan.saveToCache();
}

function generateOutputs() {
  const flightPlan = FlightPlan.loadFromCache();
  dumpFlightPlanData(flightPlan);
  generateFlightPlanTextFile(flightPlan);
  generateGarminFlightPlan(flightPlan);
  flightPlan.saveToCache();
}

function saveFlightPlanToDrive() {
  const flightPlan = FlightPlan.loadFromCache();
  const folder = getSheetFolder();
  const filename = generateFlightPlanFilename(flightPlan);
  const jsonString = JSON.stringify(flightPlan, null, 2); // Pretty-printed JSON

  // Create or overwrite file
  const file = folder.createFile(filename, jsonString, MimeType.PLAIN_TEXT);
  Logger.log("Flight Plan saved: " + file.getUrl());

  // ✅ Store filename in "Settings" sheet
  const settingsSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Settings");
  if (settingsSheet) {
    const range = settingsSheet.getRange("jsonFileName"); // Named range
    range.setValue(filename);
    Logger.log("Stored JSON filename in Settings: " + filename);
  } else {
    Logger.log("Error: 'Settings' sheet not found.");
  }
}

function loadFlightPlanFromDrive() {
  const settingsSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Settings");

  if (!settingsSheet) {
    Logger.log("Error: 'Settings' sheet not found.");
    return null;
  }

  // ✅ Retrieve filename from Settings sheet
  const filename = settingsSheet.getRange("jsonFileName").getValue().trim();

  if (!filename) {
    Logger.log("Error: No JSON filename stored in Settings.");
    return null;
  }

  const folder = getSheetFolder();
  const files = folder.getFilesByName(filename);

  if (!files.hasNext()) {
    Logger.log(
      "Error: File '" + filename + "' not found in Flight Plans folder."
    );
    return null;
  }

  const file = files.next();
  const jsonString = file.getBlob().getDataAsString();
  Logger.log("Loaded Flight Plan from Drive: " + filename);
  const flightPlan = loadFlightPlanFromJSON(jsonString);

  if (flightPlan) {
    flightPlan.saveToCache(); // ✅ Save to cache
  }

  return flightPlan;
}
function loadFlightPlanFromJSON(jsonString) {
  try {
    const rawData = JSON.parse(jsonString); // ✅ Parse JSON string into an object

    // ✅ Generic function to reconstruct objects dynamically
    function reconstructObject(obj, ClassType) {
      if (!obj || typeof obj !== "object") return obj; // Return primitive values as-is
      const instance = new ClassType(); // Create an empty instance of the class
      Object.assign(instance, obj); // Copy properties dynamically
      return instance;
    }

    // ✅ Reconstruct Waypoints
    const waypoints = new Map();
    rawData.routes.forEach((route) => {
      Object.values(route.legs).forEach((leg) => {
        waypoints.set(leg.from.name, reconstructObject(leg.from, Waypoint));
        waypoints.set(leg.to.name, reconstructObject(leg.to, Waypoint));
      });
    });

    // ✅ Reconstruct Routes & Legs
    const reconstructedRoutes = rawData.routes.map((route) => {
      const departure = reconstructObject(route.departureAirfield, Airfield);
      const destination = reconstructObject(
        route.destinationAirfield,
        Airfield
      );

      const legs = {};
      Object.entries(route.legs).forEach(([legNumber, legData]) => {
        legs[legNumber] = new Leg(
          legData.name,
          legData.legNumber,
          waypoints.get(legData.from.name),
          waypoints.get(legData.to.name),
          legData.targetAltitude,
          legData.trueAirSpeed
        );

        // ✅ Automatically restore all other properties (generic)
        Object.assign(legs[legNumber], legData);
      });

      return new Route(departure, destination, legs, route.name);
    });

    // ✅ Reconstruct FlightPlan
    const reconstructedFlightPlan = new FlightPlan(
      reconstructedRoutes,
      rawData.name
    );
    Object.assign(reconstructedFlightPlan, rawData); // Restore extra properties dynamically
    Logger.log("Flight Plan loaded successfully.");
    Logger.log(JSON.stringify(reconstructedFlightPlan, null, 2));

    return reconstructedFlightPlan;
  } catch (error) {
    Logger.log("Error loading Flight Plan from JSON: " + error);
    return null;
  }
}
