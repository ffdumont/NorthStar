class Leg {
  constructor(legNumber, from, to, targetAltitude) {
    this.legNumber = legNumber;
    this.from = from;
    this.to = to;
    this.targetAltitude = targetAltitude;
    this._weather_pressure_msl = null;
    this._weather_temperature_2m = null;

    pressureTable.forEach(({ pressure }) => {
      const suffix = `${pressure}hPa`;
      this[`_weather_wind_direction_${suffix}`] = null;
      this[`_weather_wind_speed_${suffix}`] = null;
    });
  }
}
