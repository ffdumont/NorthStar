Leg.prototype.toString = function () {
  const logMessage = `Converting Leg ${this.legNumber} to string.`;
  console.log(logMessage);
  return `Leg ${this.legNumber}: ${this.from.name} to ${this.to.name}, Target Alt: ${this.targetAltitude} ft`;
};

Leg.prototype.toRadians = function (degrees) {
  console.log(`Converting ${degrees} degrees to radians.`);
  return (degrees * Math.PI) / 180;
};

Leg.prototype.toDegrees = function (radians) {
  console.log(`Converting ${radians} radians to degrees.`);
  return (radians * 180) / Math.PI;
};

Leg.prototype.toNmi = function (km) {
  console.log(`Converting ${km} km to nautical miles.`);
  return km * 0.539957;
};

Leg.prototype.greatCircleDistance = function () {
  console.log(
    `Calculating great circle distance from ${this.from.name} to ${this.to.name}.`
  );
  const distance =
    Math.acos(
      Math.sin(this.toRadians(this.from.lat)) *
        Math.sin(this.toRadians(this.to.lat)) +
        Math.cos(this.toRadians(this.from.lat)) *
          Math.cos(this.toRadians(this.to.lat)) *
          Math.cos(this.toRadians(this.to.lon) - this.toRadians(this.from.lon))
    ) * 6371;

  console.log(`Distance in km: ${distance}`);
  return this.toNmi(distance);
};

Leg.prototype.trueTrack = function () {
  console.log(
    `Calculating true track from ${this.from.name} to ${this.to.name}.`
  );
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

  const adjustedTrack = trueTrack < 0 ? trueTrack + 360 : trueTrack;
  console.log(`True track: ${adjustedTrack}`);
  return adjustedTrack;
};

Leg.prototype.magneticTrack = function () {
  console.log(`Calculating magnetic track.`);
  const magneticDeclination = this.magneticDeclination();
  const trueTrack = this.trueTrack();
  const magneticTrack = trueTrack - magneticDeclination;
  console.log(`Magnetic track: ${(magneticTrack + 360) % 360}`);
  return (magneticTrack + 360) % 360;
};

Leg.prototype.calculateMidpoint = function () {
  console.log(
    `Calculating midpoint between ${this.from.name} and ${this.to.name}.`
  );
  const midLat = (this.from.lat + this.to.lat) / 2;
  const midLon = (this.from.lon + this.to.lon) / 2;
  console.log(`Midpoint: lat ${midLat}, lon ${midLon}`);
  return { lat: midLat, lon: midLon };
};

Leg.prototype.magneticDeclination = function () {
  console.log(`Fetching magnetic declination at midpoint.`);
  const midpoint = this.calculateMidpoint();
  return fetchNoaaGeomagData(midpoint.lat, midpoint.lon, "declination");
};

Leg.prototype.elevation = function () {
  console.log(`Fetching elevation at midpoint.`);
  const midpoint = this.calculateMidpoint();
  return fetchIgnGeopfData(midpoint.lat, midpoint.lon);
};

Leg.prototype.minimalSecurityAltitude = function () {
  console.log(`Calculating minimal security altitude.`);
  const elevation = this.elevation();
  const msa = elevation + 1000;
  console.log(`Minimal security altitude: ${msa}`);
  return msa;
};
