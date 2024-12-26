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
    return degrees * (Math.PI / 180);
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
}
