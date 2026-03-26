d3.csv('/js/data/311Sample.csv') // Might be replaced with a new preprocessed CSV for specific attr
.then(data => {
    console.log("number of items: " + data.length);

    data.forEach(d => {
      d.LATITUDE = +d.LATITUDE; 
      d.LONGITUDE = +d.LONGITUDE;  
      // d.SR_TYPE = d.SR_TYPE; // Get the service type - will need to preprocess 311Sample first after deciding which attr to go with
    });

    // Initialize map and then show it
    leafletMap = new LeafletMap({ parentElement: '#my-map'}, data);

    // Service Type Filter
    document.getElementById('sr-type-filter').addEventListener('change', function() {
    leafletMap.filterBySRType(this.value);
    });

    // Color Filter
    document.getElementById('color-by-filter').addEventListener('change', function() {
        leafletMap.changeColorBy(this.value);
    });
  })
  .catch(error => console.error(error));

