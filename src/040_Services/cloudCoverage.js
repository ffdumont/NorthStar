function createNewResultsSheet(model) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  // Generate sheet name with date/time and model value
  const now = new Date();
  const isoDate = now
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\.\d+Z$/, ""); // Format ISO 8601 and replace invalid characters for sheet name
  const sheetName = `${isoDate}_${model}`;

  // Create a new sheet
  let newSheet;
  try {
    newSheet = spreadsheet.insertSheet(sheetName);
    Logger.log(`Sheet "${sheetName}" created successfully.`);
  } catch (error) {
    Logger.log(`Error creating sheet "${sheetName}": ${error.message}`);
    throw new Error(
      "Failed to create new sheet. Ensure the sheet name is unique and under 100 characters."
    );
  }

  return newSheet;
}

// Main function to add a custom menu in Google Sheets
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Cloud Coverage")
    .addItem("Fetch Data", "fetchAndWriteData")
    .addToUi();
  Logger.log("Custom menu added.");
}
function fetchAndWriteData() {
  // Base URL for API requests
  const API_URL = "https://api.open-meteo.com/v1/forecast";

  const settingsSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Settings");
  const LAT_START = getNamedRangeValue2("Settings", "latitudeMin");
  const LAT_END = getNamedRangeValue2("Settings", "latitudeMax");
  const LON_START = getNamedRangeValue2("Settings", "longitudeMin");
  const LON_END = getNamedRangeValue2("Settings", "longitudeMax");
  const STEP = getNamedRangeValue2("Settings", "step");
  const MODEL = getNamedRangeValue2("Settings", "model");
  // Expected values: 'auto' or 'meteofrance_seamless'

  // Validate settings
  if (!LAT_START || !LAT_END || !LON_START || !LON_END || !STEP) {
    throw new Error(
      "Settings values are missing or invalid. Check the 'Settings' tab."
    );
  }
  if (MODEL !== "auto" && MODEL !== "meteofrance_seamless") {
    throw new Error(
      "Invalid model value. Choose 'auto' or 'meteofrance_seamless' in the 'Settings' tab."
    );
  }

  const PRESSURE_LEVELS = [
    "cloud_cover_900hPa",
    "cloud_cover_925hPa",
    "cloud_cover_950hPa",
    "cloud_cover_1000hPa",
  ];

  // Altitudes in meters for corresponding pressure levels
  const PRESSURE_ALTITUDES = {
    1000: 110,
    950: 800,
    925: 1000,
    900: 1500,
  };

  const resultsSheet = createNewResultsSheet(MODEL);

  // Proceed with clearing and writing data
  resultsSheet.clear(); // Clear content (though it's a new sheet, this ensures no unexpected data)
  Logger.log("New sheet cleared.");

  // Initialize data structures
  const results = {};
  const counts = {};
  let dateHeaders = [];
  const dateIndices = {}; // Map date headers to indices in the hourly.time array

  // Prepare data structures for each pressure level
  PRESSURE_LEVELS.forEach((level) => {
    results[level] = [];
    counts[level] = [];
  });

  Logger.log("Initialization complete.");

  // Fetch sunrise and sunset times
  Logger.log("Fetching sunrise and sunset times...");
  const sunParams = `latitude=${LAT_START}&longitude=${LON_START}&daily=sunrise,sunset&timezone=auto`;
  const sunResponse = UrlFetchApp.fetch(`${API_URL}?${sunParams}`);
  const sunData = JSON.parse(sunResponse.getContentText());
  const sunriseMap = {};
  sunData.daily.time.forEach((date, i) => {
    sunriseMap[date] = {
      sunrise: sunData.daily.sunrise[i],
      sunset: sunData.daily.sunset[i],
    };
  });
  Logger.log("Sunrise and sunset times fetched and mapped.");

  // Iterate over the grid for cloud cover data
  Logger.log("Starting data fetching for latitude/longitude grid...");
  let gridPointsProcessed = 0;
  for (let lat = LAT_START; lat <= LAT_END; lat += STEP) {
    for (let lon = LON_START; lon <= LON_END; lon += STEP) {
      Logger.log(
        `Fetching data for lat: ${lat.toFixed(1)}, lon: ${lon.toFixed(1)}...`
      );
      const cloudParams =
        `latitude=${lat}&longitude=${lon}&hourly=${PRESSURE_LEVELS.join(
          ","
        )}&timezone=auto` +
        (MODEL === "meteofrance_seamless"
          ? "&models=meteofrance_seamless"
          : "");

      const response = UrlFetchApp.fetch(`${API_URL}?${cloudParams}`);
      const data = JSON.parse(response.getContentText());
      gridPointsProcessed++;
      Logger.log(
        `Data fetched for lat: ${lat.toFixed(1)}, lon: ${lon.toFixed(1)}`
      );

      // Filter time headers between sunrise and sunset
      if (!dateHeaders.length && data.hourly && data.hourly.time) {
        let lastDate = "";
        data.hourly.time.forEach((time, index) => {
          const date = time.split("T")[0];
          const sunrise = sunriseMap[date]?.sunrise;
          const sunset = sunriseMap[date]?.sunset;

          // Add a blank column if transitioning to a new day
          if (date !== lastDate && lastDate) {
            dateHeaders.push(""); // Insert blank column
          }

          if (sunrise && sunset && time >= sunrise && time <= sunset) {
            dateHeaders.push(time);
            dateIndices[time] = index; // Map time to its index in hourly.time
          }
          lastDate = date;
        });
        Logger.log(
          "Date headers filtered and blank columns inserted between days."
        );
      }

      // Aggregate data
      if (data.hourly) {
        PRESSURE_LEVELS.forEach((level) => {
          if (data.hourly[level]) {
            dateHeaders.forEach((time, colIndex) => {
              if (time === "") return; // Skip blank columns
              const hourlyIndex = dateIndices[time];
              const value = data.hourly[level][hourlyIndex];
              if (value === null) {
                results[level][colIndex] = null; // Keep null as is
              } else if (value !== undefined) {
                const normalizedValue = value / 100;
                results[level][colIndex] =
                  (results[level][colIndex] || 0) + normalizedValue;
                counts[level][colIndex] = (counts[level][colIndex] || 0) + 1;
              }
            });
          }
        });
        Logger.log(
          `Aggregated data for grid point: lat=${lat.toFixed(
            1
          )}, lon=${lon.toFixed(1)}`
        );
      }
    }
  }
  Logger.log(`Finished data fetching for ${gridPointsProcessed} grid points.`);

  // Compute averages for each pressure level and time slot
  Logger.log("Calculating averages...");
  PRESSURE_LEVELS.forEach((level) => {
    results[level] = dateHeaders.map((time, colIndex) => {
      if (time === "") {
        return ""; // Leave blank column as is
      }
      const sum = results[level][colIndex];
      if (sum === null) {
        return null; // Keep null as is
      }
      const count = counts[level][colIndex] || 1; // Avoid division by zero
      const average = sum / count;
      Logger.log(
        `Average for ${level}, time slot ${time}: ${average?.toFixed(2)}`
      );
      return parseFloat(average?.toFixed(2));
    });
  });
  Logger.log("Averages calculated.");

  // Write headers
  Logger.log("Writing headers to resultsSheet...");
  resultsSheet.getRange(1, 1).setValue("Pressure Level");
  if (dateHeaders.length) {
    // Write headers vertically and adjust column width
    resultsSheet
      .getRange(1, 2, 1, dateHeaders.length)
      .setValues([dateHeaders]) // Write headers
      .setTextRotation(90) // Rotate headers vertically
      .setHorizontalAlignment("center"); // Align text to center
    resultsSheet.setColumnWidths(2, dateHeaders.length, 30); // Make columns narrower
    Logger.log(
      "Headers written to sheet with vertical orientation and adjusted column widths."
    );
  }

  // Write results to the sheet
  Logger.log("Writing results to resultsSheet...");
  let row = 2;
  PRESSURE_LEVELS.forEach((level) => {
    const pressure = level.match(/\d+/)[0]; // Extract pressure (e.g., "900")
    const altitudeMeters = PRESSURE_ALTITUDES[pressure] || 0; // Get altitude in meters
    const altitudeFeet = Math.round((altitudeMeters * 3.28084) / 100) * 100; // Convert to feet and round to nearest hundred
    const rowLabel = `Cloud % - ${pressure}hPa (${altitudeFeet} ft)`; // Format label

    const rowData = [rowLabel, ...results[level]];
    resultsSheet.getRange(row, 1, 1, rowData.length).setValues([rowData]);
    row++;
  });
  Logger.log("Results written to resultsSheet.");

  // Apply conditional formatting
  Logger.log("Applying conditional formatting...");
  applyConditionalFormatting(
    resultsSheet,
    2,
    dateHeaders.length + 1,
    PRESSURE_LEVELS.length
  );
  Logger.log("Conditional formatting applied.");
}

function getNamedRangeValue2(sheetName, name) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    Logger.log(`Sheet "${sheetName}" not found.`);
    return null;
  }

  const namedRanges = sheet.getNamedRanges();
  const namedRange = namedRanges.find((range) => range.getName() === name);

  if (!namedRange) {
    Logger.log(`Named range "${name}" not found.`);
    return null;
  }

  return namedRange.getRange().getValue();
}
