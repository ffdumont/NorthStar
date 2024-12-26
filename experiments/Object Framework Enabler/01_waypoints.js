let waypoints = {}; // Global scope

// Waypoint Class Definition
class Waypoint {
  constructor(name, lat, lon) {
    this.name = name;
    this.lat = lat;
    this.lon = lon;
  }

  toString() {
    return `${this.name}: (${this.lat}, ${this.lon})`;
  }
}
