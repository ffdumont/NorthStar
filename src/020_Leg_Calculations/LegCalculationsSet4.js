// Define a prototype method for computing LegMaxTime
Leg.prototype.getLegMaxTime = function () {
  return Math.max(this.legTimeWithWind || 0, this.legTimeWithoutWind || 0);
};
