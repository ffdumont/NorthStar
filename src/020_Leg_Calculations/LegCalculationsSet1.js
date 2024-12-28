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

Leg.prototype.trueTrack = function () {
  const trueTrack = this.toDegrees(
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

  return trueTrack < 0 ? trueTrack + 360 : trueTrack;
};

Leg.prototype.magneticTrack = function () {
  const magneticDeclination = this.magneticDeclination();
  const trueTrack = this.trueTrack();
  const magneticTrack = trueTrack - magneticDeclination;
  return (magneticTrack + 360) % 360;
};

Leg.prototype.calculateMidpoint = function () {
  const midLat = (this.from.lat + this.to.lat) / 2;
  const midLon = (this.from.lon + this.to.lon) / 2;
  return { lat: midLat, lon: midLon };
};

Leg.prototype.magneticDeclination = function () {
  const midpoint = this.calculateMidpoint();
  return fetchNoaaGeomagData(midpoint.lat, midpoint.lon, "declination");
};

Leg.prototype.elevation = function () {
  const midpoint = this.calculateMidpoint();
  return fetchIgnGeopfData(midpoint.lat, midpoint.lon);
};

Leg.prototype.minimalSecurityAltitude = function () {
  return this.elevation() + 1000;
};
