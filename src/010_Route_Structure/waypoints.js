let waypoints = {}; // Global scope

// Waypoint Class Definition
class Waypoint {
  constructor(name, latitude, longitude) {
    this.name = name;
    this.latitude = latitude;
    this.longitude = longitude;
  }
  toString() {
    return `${this.name}: (${this.latitude}, ${this.longitude})`;
  }
}
