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
}
  
// Pull Data from Google Sheet and Create Legs
function getLegsFromSheet(waypoints) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Legs');
  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();

  let legs = [];
  data.forEach(row => {
    const [legNumber, fromName, toName, targetAltitude] = row;
    const fromWaypoint = waypoints[fromName.trim().toUpperCase()];
    const toWaypoint = waypoints[toName.trim().toUpperCase()];

    if (fromWaypoint && toWaypoint) {
      let leg = new Leg(legNumber, fromWaypoint, toWaypoint, targetAltitude);
      legs[leg.legNumber]=leg;
    } else {
      Logger.log(`Waypoint not found for Leg ${legNumber}: ${fromName} to ${toName}`);
    }
  });

  return legs;
}