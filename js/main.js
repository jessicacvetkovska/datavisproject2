d3.csv('/js/data/311Sample.csv') // Might be replaced with a new preprocessed CSV for specific attr
.then(data => {
    console.log("number of items: " + data.length);
    const parseDate = d3.timeParse("%Y %b %d %I:%M:%S %p");

    data.forEach(d => {
      d.LATITUDE = +d.LATITUDE; 
      d.LONGITUDE = +d.LONGITUDE;  
      d.DATE_CREATED = parseDate(d.DATE_CREATED);
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

    d3.select('#btn-light').on('click', () => {
    leafletMap.setBackground(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    );
    });

    d3.select('#btn-dark').on('click', () => {
    leafletMap.setBackground(
      'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}',
      '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>'
    );
  });



 const binnedData = d3.rollups(
  data.filter(d => d.DATE_CREATED !== null),
  v => v.length,           // count records per bin
  d => d3.timeDay.floor(d.DATE_CREATED)  // bin by day
)
.map(([date, count]) => ({ date, count }))  // reshape to {date, count}
.sort((a, b) => a.date - b.date);           // sort chronologically

lineChart = new LineChart({ parentElement: '#line-chart' }, binnedData);
console.log(binnedData)
lineChart.updateVis();

})
  .catch(error => console.error(error));

