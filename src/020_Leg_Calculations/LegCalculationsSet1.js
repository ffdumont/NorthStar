Leg.prototype.toString = function () {
  const logMessage = `Converting Leg ${this.legNumber} to string.`;
  console.log(logMessage);
  return `Leg ${this.legNumber}: ${this.from.name} to ${this.to.name}, Target Alt: ${this.targetAltitude} ft`;
};

Leg.prototype.greatCircleDistance = function () {
  console.log(
    `Calculating great circle distance from ${this.from.name} to ${this.to.name}.`
  );
  const distance =
    Math.acos(
      Math.sin(degreesToRadians(this.from.latitude)) *
        Math.sin(degreesToRadians(this.to.latitude)) +
        Math.cos(degreesToRadians(this.from.latitude)) *
          Math.cos(degreesToRadians(this.to.latitude)) *
          Math.cos(
            degreesToRadians(this.to.longitude) -
              degreesToRadians(this.from.longitude)
          )
    ) * 6371;

  console.log(`Distance in km: ${distance}`);
  return kmToNmi(distance);
};

Leg.prototype.calculateTrueTrack = function () {
  console.log(
    `Calculating true track from ${this.from.name} to ${this.to.name}.`
  );
  const trueTrack = radiansToDegrees(
    Math.atan2(
      Math.sin(degreesToRadians(this.to.longitude - this.from.longitude)) *
        Math.cos(degreesToRadians(this.to.latitude)),
      Math.cos(degreesToRadians(this.from.latitude)) *
        Math.sin(degreesToRadians(this.to.latitude)) -
        Math.sin(degreesToRadians(this.from.latitude)) *
          Math.cos(degreesToRadians(this.to.latitude)) *
          Math.cos(degreesToRadians(this.to.longitude - this.from.longitude))
    )
  );

  const adjustedTrack = trueTrack < 0 ? trueTrack + 360 : trueTrack;
  console.log(`True track: ${adjustedTrack}`);
  this.trueTrack = adjustedTrack;
  return adjustedTrack;
};

Leg.prototype.calculateMagneticTrack = function () {
  console.log(`Calculating magnetic track.`);
  const magneticDeclination = this.calculateMagneticDeclination();
  const trueTrack = this.trueTrack;
  const magneticTrack = (trueTrack - magneticDeclination + 360) % 360;
  console.log(`Magnetic track: ${magneticTrack}`);
  this.magneticTrack = magneticTrack;
  return magneticTrack;
};

Leg.prototype.calculateMidpoint = function () {
  console.log(
    `Calculating midpoint between ${this.from.name} and ${this.to.name}.`
  );
  const midLat = (this.from.latitude + this.to.latitude) / 2;
  const midLon = (this.from.longitude + this.to.longitude) / 2;
  console.log(`Midpoint: lat ${midLat}, lon ${midLon}`);
  return { latitude: midLat, longitude: midLon };
};

Leg.prototype.calculateMagneticDeclination = function () {
  console.log(`Fetching magnetic declination at midpoint.`);
  const midpoint = this.calculateMidpoint();
  return fetchNoaaGeomagData(
    midpoint.latitude,
    midpoint.longitude,
    "declination"
  );
};

Leg.prototype.elevation = function () {
  console.log(`Fetching elevation at midpoint.`);
  const midpoint = this.calculateMidpoint();
  return fetchIgnGeopfData(midpoint.latitude, midpoint.longitude);
};

Leg.prototype.minimalSecurityAltitude = function () {
  console.log(`Calculating minimal security altitude.`);
  const elevation = this.elevation();
  const msa = elevation + 1000;
  console.log(`Minimal security altitude: ${msa}`);
  return msa;
};
