class Airfield {
  constructor(airfieldName, airfieldDesignator, latitude, longitude) {
    this.airfieldName = airfieldName;
    this.airfieldDesignator = airfieldDesignator;
    this.latitude = latitude;
    this.longitude = longitude;
    this.taxiInTime = 10; // Default taxi time of 10 minutes
    this.taxiOutTime = 5; // Default taxi time of 5 minutes
    this.departureProcedureTime = 10; // Default departure procedure time of 10 minutes
    this.arrivalProcedureTime = 10; // Default arrival procedure time of 10 minutes
  }
}
