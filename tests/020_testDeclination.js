function testNoaaGeomagData() {
  const leg = new Leg(
    1,
    { lat: 48.99861, lon: 1.941667, name: "Point A" },
    { lat: 49.0, lon: 2.0, name: "Point B" },
    10000
  );

  const declination = leg.declination();
  console.log("Declination:", declination);
}
