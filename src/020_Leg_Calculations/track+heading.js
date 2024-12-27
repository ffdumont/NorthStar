Leg.prototype.toString = function () {
  return `Leg ${this.legNumber}: ${this.from.name} to ${this.to.name}, Target Alt: ${this.targetAltitude} ft`;
};

Leg.prototype.toRadians = function (degrees) {
  return (degrees * Math.PI) / 180;
};

Leg.prototype.toDegrees = function (radians) {
  return (radians * 180) / Math.PI;
};

Leg.prototype.toNmi = function (km) {
  return km * 0.539957;
};

Leg.prototype.greatCircleDistance = function () {
  const distance =
    Math.acos(
      Math.sin(this.toRadians(this.from.lat)) *
        Math.sin(this.toRadians(this.to.lat)) +
        Math.cos(this.toRadians(this.from.lat)) *
          Math.cos(this.toRadians(this.to.lat)) *
          Math.cos(this.toRadians(this.to.lon) - this.toRadians(this.from.lon))
    ) * 6371;

  return this.toNmi(distance);
};

Leg.prototype.bearing = function () {
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
};
