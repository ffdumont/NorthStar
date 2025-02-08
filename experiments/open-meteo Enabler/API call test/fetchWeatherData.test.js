const fetch = require("node-fetch");
const chai = require("chai");
const expect = chai.expect;
const fetchWeatherData = require("./fetchWeatherData");

describe("fetchWeatherData", function () {
  it("should fetch weather data for given latitude and longitude from the real service", async function () {
    const latitude = 48.9917;
    const longitude = 1.9097;

    // Call the real service
    const data = await fetchWeatherData(latitude, longitude);

    // Ensure the data is fetched correctly
    expect(data).to.be.an("array");
    expect(data[0]).to.have.property("temperature_2m");
    expect(data[0]).to.have.property("pressure_msl");
  });
});
