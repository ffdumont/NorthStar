class Leg {
  constructor(legNumber, from, to, targetAltitude) {
    this.legNumber = legNumber;
    this.from = from;
    this.to = to;
    this.targetAltitude = targetAltitude;
    this._pressure_msl = null; // Internal, private by convention
  }
}
