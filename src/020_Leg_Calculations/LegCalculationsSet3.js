// Method to calculate the ground speed
Leg.prototype.calculateGroundSpeed = function () {
  const trackRad = degreesToRadians(this.magneticTrack);
  const windDirRad = degreesToRadians(this._weather_wind_direction);

  const windComponentAlongTrack =
    this._weather_wind_speed * Math.cos(windDirRad - trackRad);
  const groundSpeed = this.trueAirSpeed - windComponentAlongTrack;
  this.groundSpeed = groundSpeed;
  return groundSpeed;
};

// Method to calculate the magnetic heading
Leg.prototype.calculateMagneticHeading = function () {
  const trackRad = degreesToRadians(this.magneticTrack);
  const windDirRad = degreesToRadians(this._weather_wind_direction);

  const windComponentAcrossTrack =
    this._weather_wind_speed * Math.sin(windDirRad - trackRad);
  const windCorrAngleRad = Math.asin(
    windComponentAcrossTrack / this.trueAirSpeed
  );
  const magneticHeadingRad = trackRad + windCorrAngleRad;
  this.magneticHeading = radiansToDegrees(magneticHeadingRad);

  return this.magneticHeading;
};

// Method to calculate the wind correction angle
Leg.prototype.windCorrectionAngle = function () {
  return this.magneticTrack - this.magneticHeading;
};

// Method to calculate leg time without wind (using true airspeed)
Leg.prototype.calculateLegTimeWithoutWind = function () {
  if (!this.trueAirSpeed || this.trueAirSpeed <= 0) {
    throw new Error("True Air Speed must be a positive value.");
  }
  this.legTimeWithoutWind = (this.distance / this.trueAirSpeed) * 60; // Convert hours to minutes
  return this.legTimeWithoutWind;
};

// Method to calculate leg time with wind (using ground speed)
Leg.prototype.calculateLegTimeWithWind = function () {
  if (!this.groundSpeed || this.groundSpeed <= 0) {
    throw new Error(
      "Ground Speed must be calculated first and be a positive value."
    );
  }
  return (this.legTimeWithWind = (this.distance / this.groundSpeed) * 60);
};
