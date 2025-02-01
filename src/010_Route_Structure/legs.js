class Leg {
  constructor(name, legNumber, from, to, targetAltitude, trueAirSpeed) {
    this.name = name;
    this.legNumber = legNumber;
    this.from = from;
    this.to = to;
    this.targetAltitude = targetAltitude;
    this.distance = null;
    this.trueTrack = null;
    this.magneticDeclination = null;
    this.magneticTrack = null;
    this.magneticHeading = null;
    this._weather_pressure_msl = null;
    this._weather_temperature_2m = null;
    this._weather_wind_direction = null;
    this._weather_wind_speed = null;
    this.trueAirSpeed = trueAirSpeed;
    this.groundSpeed = null;
    this.legTimeWithoutWind = null;
    this.legTimeWithWind = null;
    this.midPoint = null;
    this.elevation = null;
  }
}
