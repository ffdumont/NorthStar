class Airfield {
  constructor(airfieldName, airfieldDesignator, latitude, longitude) {
    this.airfieldName = airfieldName;
    this.airfieldDesignator = airfieldDesignator;
    this.latitude = latitude;
    this.longitude = longitude;
    this.taxiInTime = 5; // Taxi to apron
    this.taxiOutTime = 10; // Taxi to runway
    this.departureProcedureTime = 10; // Default departure procedure time of 10 minutes
    this.arrivalProcedureTime = 10; // Default arrival procedure time of 10 minutes
  }
}
