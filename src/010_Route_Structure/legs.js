class Leg {
  constructor(legNumber, from, to, targetAltitude, trueAirSpeed) {
    this.legNumber = legNumber;
    this.from = from;
    this.to = to;
    this.targetAltitude = targetAltitude;
    this._weather_pressure_msl = null;
    this._weather_temperature_2m = null;
    this._weather_wind_direction = null;
    this._weather_wind_speed = null;
    this.trueAirSpeed = trueAirSpeed;
  }
}
