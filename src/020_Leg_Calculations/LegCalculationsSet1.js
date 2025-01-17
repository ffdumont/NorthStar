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
      Math.sin(degreesToRadians(this.from.lat)) *
        Math.sin(degreesToRadians(this.to.lat)) +
        Math.cos(degreesToRadians(this.from.lat)) *
          Math.cos(degreesToRadians(this.to.lat)) *
          Math.cos(
            degreesToRadians(this.to.lon) - degreesToRadians(this.from.lon)
          )
    ) * 6371;

  console.log(`Distance in km: ${distance}`);
  return kmToNmi(distance);
};

Leg.prototype.trueTrack = function () {
  console.log(
    `Calculating true track from ${this.from.name} to ${this.to.name}.`
  );
  const trueTrack = radiansToDegrees(
    Math.atan2(
      Math.sin(degreesToRadians(this.to.lon - this.from.lon)) *
        Math.cos(degreesToRadians(this.to.lat)),
      Math.cos(degreesToRadians(this.from.lat)) *
        Math.sin(degreesToRadians(this.to.lat)) -
        Math.sin(degreesToRadians(this.from.lat)) *
          Math.cos(degreesToRadians(this.to.lat)) *
          Math.cos(degreesToRadians(this.to.lon - this.from.lon))
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
  const magneticTrack = (trueTrack - magneticDeclination + 360) % 360;
  console.log(`Magnetic track: ${magneticTrack}`);
  this.magneticTrack = magneticTrack;
  return magneticTrack;
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
