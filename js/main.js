d3.csv('/js/data/311Sample.csv') // Might be replaced with a new preprocessed CSV for specific attr
.then(data => {
    console.log("number of items: " + data.length);

    data.forEach(d => {
      d.latitude = +d.latitude; 
      d.longitude = +d.longitude;  
      // d.SR_TYPE = d.SR_TYPE; // Get the service type - will need to preprocess 311Sample first after deciding which attr to go with
    });

    // Initialize map and then show it
    leafletMap = new LeafletMap({ parentElement: '#my-map'}, data);

    document.getElementById('sr-type-filter').addEventListener('change', function() {
    myMap.filterBySRType(this.value);
    });


  })
  .catch(error => console.error(error));

