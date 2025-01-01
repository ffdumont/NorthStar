function testPressure() {
  const leg = new Leg(
    1,
    { lat: 48.99861, lon: 1.941667, name: "LFXU" },
    { lat: 48.961992, lon: 1.9188, name: "XUSW" },
    10000
  );

  const pressure = leg.pressure();
  console.log("Elevation:", elevation);
}
