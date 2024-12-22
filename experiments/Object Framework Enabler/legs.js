// Leg Class Definition
class Leg {
  constructor(legNumber, from, to, targetAltitude) {
    this.legNumber = legNumber;
    this.from = from;
    this.to = to;
    this.targetAltitude = targetAltitude;
  }

  toString() {
    return `Leg ${this.legNumber}: ${this.from.name} to ${this.to.name}, Target Alt: ${this.targetAltitude} ft`;
  }

  greatCircleDistance() {
    const R = 6371; // Earth's radius in kilometers

    const deltaLat = this.endLat - this.startLat;
    const deltaLon = this.endLon - this.startLon;

    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(this.startLat) *
        Math.cos(this.endLat) *
        Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance;
  }
}

// Pull Data from Google Sheet and Create Legs
function getLegsFromSheet(waypoints) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Legs");
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();

  let legs = [];
  data.forEach((row) => {
    const [legNumber, fromName, toName, targetAltitude] = row;
    const fromWaypoint = waypoints[fromName.trim().toUpperCase()];
    const toWaypoint = waypoints[toName.trim().toUpperCase()];

    if (fromWaypoint && toWaypoint) {
      let leg = new Leg(legNumber, fromWaypoint, toWaypoint, targetAltitude);
      legs[leg.legNumber] = leg;
    } else {
      Logger.log(
        `Waypoint not found for Leg ${legNumber}: ${fromName} to ${toName}`
      );
    }
  });

  return legs;
}

class Leg {
  constructor(startLat, startLon, endLat, endLon) {
    this.startLat = this.toRadians(startLat);
    this.startLon = this.toRadians(startLon);
    this.endLat = this.toRadians(endLat);
    this.endLon = this.toRadians(endLon);
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  greatCircleDistance() {
    const R = 6371; // Earth's radius in kilometers

    const deltaLat = this.endLat - this.startLat;
    const deltaLon = this.endLon - this.startLon;

    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(this.startLat) *
        Math.cos(this.endLat) *
        Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance;
  }
}

// Example usage
const leg = new Leg(48.8566, 2.3522, 40.7128, -74.006); // Paris to New York
console.log(
  `Great-circle distance: ${leg.greatCircleDistance().toFixed(2)} km`
);
