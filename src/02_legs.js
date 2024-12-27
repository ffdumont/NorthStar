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

  toRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  toDegrees(radians) {
    return (radians * 180) / Math.PI;
  }

  toNmi(km) {
    return km * 0.539957;
  }

  greatCircleDistance() {
    const distance =
      Math.acos(
        Math.sin(this.toRadians(this.from.lat)) *
          Math.sin(this.toRadians(this.to.lat)) +
          Math.cos(this.toRadians(this.from.lat)) *
            Math.cos(this.toRadians(this.to.lat)) *
            Math.cos(
              this.toRadians(this.to.lon) - this.toRadians(this.from.lon)
            )
      ) * 6371;

    return this.toNmi(distance);
  }

  bearing() {
    const bearing = this.toDegrees(
      Math.atan2(
        Math.sin(this.toRadians(this.to.lon - this.from.lon)) *
          Math.cos(this.toRadians(this.to.lat)),
        Math.cos(this.toRadians(this.from.lat)) *
          Math.sin(this.toRadians(this.to.lat)) -
          Math.sin(this.toRadians(this.from.lat)) *
            Math.cos(this.toRadians(this.to.lat)) *
            Math.cos(this.toRadians(this.to.lon - this.from.lon))
      )
    );

    return bearing < 0 ? bearing + 360 : bearing;
  }
}
