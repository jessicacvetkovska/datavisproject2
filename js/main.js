d3.csv('/js/data/311Sample.csv') // Might be replaced with a new preprocessed CSV for specific attr
.then(data => {
    console.log("number of items: " + data.length);
    


    function parseDate(str) {
      if (!str || str.trim() === '') return null;
      const parts = str.trim().split(/\s+/);
      const months = {Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11};
      return new Date(+parts[0], months[parts[1]], +parts[2]); // local midnight
    }

    data.forEach(d => {
      d.LATITUDE = +d.LATITUDE; 
      d.LONGITUDE = +d.LONGITUDE;  
      d.DATE_CREATED = parseDate(d.DATE_CREATED);
      const updateDate = parseDate(d.DATE_LAST_UPDATE);
      
      // Store the parsed date objects
      d.DATE_CREATED_OBJ = d.DATE_CREATED;
      
      // Calculate time difference in days
      if (d.DATE_CREATED && updateDate) {
        const diffTime = Math.abs(updateDate - d.DATE_CREATED);
        d.time_diff = diffTime / (1000 * 60 * 60 * 24); // milliseconds to days
      } else {
        d.time_diff = 0;
      }
    });

    // Initialize map and then show it
    leafletMap = new LeafletMap({ parentElement: '#my-map'}, data);

    // Service Type Filter
    document.getElementById('sr-type-filter').addEventListener('change', function() {
    leafletMap.filterBySRType(this.value);
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




// Line Chart Initialization
 const binnedData = d3.rollups(
  data.filter(d => d.DATE_CREATED !== null),
  v => v.length,          // ← this IS the count: how many records share the same day
  d => +d3.timeDay.floor(d.DATE_CREATED)  // ← groups records by day
)
.map(([date, count]) => ({ date, count }))
.sort((a, b) => a.date - b.date);   // sort chronologically
console.log('max count:', d3.max(binnedData, d => d.count));
lineChart = new LineChart({ parentElement: '#line-chart' }, binnedData);
lineChart.updateVis();

//------------------------------------------------------------------------------

// Neighborhood request distributions
const neighborhoodCounts = d3.rollups(
    data.filter(d => d.NEIGHBORHOOD && d.NEIGHBORHOOD !== "N/A"),
    v => v.length,
    d => d.NEIGHBORHOOD
)
.map(([name, count]) => ({ name, count }))
.sort((a, b) => b.count - a.count) // Sort descending
.slice(0, 10); // Display Top 10 districts

// Initialize Neighborhoods Bar Chart
const barChart = new BarChart({ 
    parentElement: '#bar-chart',
    containerWidth: 500,
    containerHeight: 300
}, neighborhoodCounts);
barChart.updateVis();

// Request method distributions
const methodCounts = d3.rollups(
    data.filter(d => d.METHOD_RECEIVED), // Filter out empty values
    v => v.length,
    d => d.METHOD_RECEIVED
)
.map(([name, count]) => ({ name, count }))
.sort((a, b) => b.count - a.count); // Sort descending

//------------------------------------------------------------------------------

// Initialize Method Bar Chart
const methodChart = new BarChart({ 
    parentElement: '#method-bar-chart',
    containerWidth: 500,
    containerHeight: 300,
    // We can pass custom margins if method names are long
    margin: { top: 20, right: 20, bottom: 80, left: 60 } 
}, methodCounts);

methodChart.updateVis();

})
  .catch(error => console.error(error));

