// Global variables for visualizations and data
let allData, leafletMap, lineChart, neighborhoodChart, methodChart;

// Global filter state
let filters = {
    neighborhood: null,
    method: null,
    dept: null,
    sr_type: 'all',
    timeRange: null, // [startDate, endDate] or null
    spatialSelection: null // array of selected data points or null
};

// Parse the specific date format in CSV
function parseDate(str) {
    if (!str || str.trim() === '') return null;
    const parts = str.trim().split(/\s+/);
    const months = {Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5, Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11};
    // Format is YYYY Month DD
    return new Date(+parts[0], months[parts[1]], +parts[2]);
}

// Load the dataset
d3.csv('js/data/311Sample.csv').then(data => {
    allData = data;

    // Data Preprocessing
    allData.forEach(d => {
        d.LATITUDE = +d.LATITUDE; 
        d.LONGITUDE = +d.LONGITUDE;  
        
        // Parse dates for time difference calculation and line chart
        d.DATE_CREATED_OBJ = parseDate(d.DATE_CREATED);
        d.DATE_LAST_UPDATE_OBJ = parseDate(d.DATE_LAST_UPDATE);
        
        // Calculate time difference in days (Time to Update)
        if (d.DATE_CREATED_OBJ && d.DATE_LAST_UPDATE_OBJ) {
            const diffTime = Math.abs(d.DATE_LAST_UPDATE_OBJ - d.DATE_CREATED_OBJ);
            d.time_diff = diffTime / (1000 * 60 * 60 * 24);
        } else {
            d.time_diff = 0;
        }
    });

    // --- Initialize Visualizations --- 
    
    // Map
    leafletMap = new LeafletMap({ 
        parentElement: '#my-map',
        onBrush: (selectedPoints) => {
            filters.spatialSelection = selectedPoints;
            updateAll();
        }
    }, allData);

    // Line Chart
    lineChart = new LineChart({ 
        parentElement: '#line-chart',
        onBrush: (timeRange) => {
            filters.timeRange = timeRange;
            updateAll();
        }
    }, []);
    
    // Top Neighborhoods Bar Chart
    neighborhoodChart = new BarChart({ 
        parentElement: '#neighborhood-chart',
        // Callback function triggered when a bar is clicked
        onClick: (selectedName) => { 
            filters.neighborhood = selectedName; 
            updateAll(); 
        }
    }, []);

    // Request Method Bar Chart
    methodChart = new BarChart({ 
        parentElement: '#method-bar-chart',
        onClick: (selectedName) => { 
            filters.method = selectedName; 
            updateAll(); 
        }
    }, []);

    // Priority Bar Chart
    priorityChart = new BarChart({ 
        parentElement: '#priority-chart',
        onClick: (val) => { filters.priority = val; updateAll(); }
    }, []);


    // Initialize Department Bar Chart
    deptChart = new BarChart({ 
        parentElement: '#dept-chart',
        onClick: (selectedName) =>{
            filters.dept = selectedName;
            updateAll();
        }
    }, []);

    
    // --- Event Listeners for UI Elements ---
    
    // Service Type Dropdown
    document.getElementById('sr-type-filter').addEventListener('change', function() {
        filters.sr_type = this.value;
        updateAll();
    });

    // Color By Dropdown
    document.getElementById('color-by-filter').addEventListener('change', function() {
        leafletMap.changeColorBy(this.value);
    });


    // Light v. Dark Map Background Buttons
    d3.select('#btn-light').on('click', () => {
        leafletMap.setBackground('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    });

    d3.select('#btn-dark').on('click', () => {
        leafletMap.setBackground('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png');
    });

    // Initial render call to populate all charts
    updateAll();

}).catch(error => console.error("Error loading CSV:", error));


/**
 * Central function to filter data and update all active visualizations.
 */
function updateAll() {
    // Fully Filtered Data (for Map and Line Chart)
    // Filters by: Dropdown + Neighborhood selection + Method selection + Priority Selection + Time Range + Spatial Selection
    let fullyFilteredData = allData.filter(d => {
        const matchType = (filters.sr_type === 'all' || d.SR_TYPE_DESC === filters.sr_type);
        const matchNeighborhood = (!filters.neighborhood || d.NEIGHBORHOOD === filters.neighborhood);
        const matchMethod = (!filters.method || d.METHOD_RECEIVED === filters.method);
        const matchPriority = (!filters.priority || d.PRIORITY === filters.priority);
        const matchDept = (!filters.dept || d.DEPT_NAME == filters.dept);
        const matchTime = (!filters.timeRange || (d.DATE_CREATED_OBJ >= filters.timeRange[0] && d.DATE_CREATED_OBJ <= filters.timeRange[1]));
        const matchSpatial = (!filters.spatialSelection || filters.spatialSelection.includes(d));
        return matchType && matchNeighborhood && matchMethod && matchPriority && matchDept && matchTime && matchSpatial;
    });

    // Data for Neighborhood Chart
    // Filters by: Dropdown + Method selection + Priority Selection + Time Range + Spatial Selection
    let neighborhoodViewData = allData.filter(d => {
        const matchType = (filters.sr_type === 'all' || d.SR_TYPE_DESC === filters.sr_type);
        const matchMethod = (!filters.method || d.METHOD_RECEIVED === filters.method);
        const matchPriority = (!filters.priority || d.PRIORITY === filters.priority);
        const matchDept = (!filters.dept || d.DEPT_NAME == filters.dept);
        const matchTime = (!filters.timeRange || (d.DATE_CREATED_OBJ >= filters.timeRange[0] && d.DATE_CREATED_OBJ <= filters.timeRange[1]));
        const matchSpatial = (!filters.spatialSelection || filters.spatialSelection.includes(d));
        return matchType && matchMethod && matchPriority && matchDept && matchTime && matchSpatial;
    });

    // Data for Method Chart
    // Filters by: Dropdown + Neighborhood selection + Priority Selection + Time Range + Spatial Selection
    let methodViewData = allData.filter(d => {
        const matchType = (filters.sr_type === 'all' || d.SR_TYPE_DESC === filters.sr_type);
        const matchNeighborhood = (!filters.neighborhood || d.NEIGHBORHOOD === filters.neighborhood);
        const matchPriority = (!filters.priority || d.PRIORITY === filters.priority);
        const matchDept = (!filters.dept || d.DEPT_NAME == filters.dept);
        const matchTime = (!filters.timeRange || (d.DATE_CREATED_OBJ >= filters.timeRange[0] && d.DATE_CREATED_OBJ <= filters.timeRange[1]));
        const matchSpatial = (!filters.spatialSelection || filters.spatialSelection.includes(d));
        return matchType && matchNeighborhood && matchPriority && matchDept && matchTime && matchSpatial;
    });
    // Data for Priority Chart
    // Filters by: Dropdown + Neighborhood selection + Method Selection + Time Range + Spatial Selection
    let priorityViewData = allData.filter(d => {
        const matchType = (filters.sr_type === 'all' || d.SR_TYPE_DESC === filters.sr_type);
        const matchNeighborhood = (!filters.neighborhood || d.NEIGHBORHOOD === filters.neighborhood);
        const matchMethod = (!filters.method || d.METHOD_RECEIVED === filters.method);
        const matchDept = (!filters.dept || d.DEPT_NAME == filters.dept);
        const matchTime = (!filters.timeRange || (d.DATE_CREATED_OBJ >= filters.timeRange[0] && d.DATE_CREATED_OBJ <= filters.timeRange[1]));
        const matchSpatial = (!filters.spatialSelection || filters.spatialSelection.includes(d));
        return matchType && matchNeighborhood && matchMethod && matchDept && matchTime && matchSpatial;
    });

    // Data for Department Chart
    // Filters by: Dropdown + Neighborhood selection + Method Selection + Priority Selection + Time Range + Spatial Selection
    let deptViewData = allData.filter(d => {
        const matchType = (filters.sr_type === 'all' || d.SR_TYPE_DESC === filters.sr_type);
        const matchNeighborhood = (!filters.neighborhood || d.NEIGHBORHOOD === filters.neighborhood);
        const matchMethod = (!filters.method || d.METHOD_RECEIVED === filters.method);
        const matchPriority = (!filters.priority || d.PRIORITY === filters.priority);
        const matchTime = (!filters.timeRange || (d.DATE_CREATED_OBJ >= filters.timeRange[0] && d.DATE_CREATED_OBJ <= filters.timeRange[1]));
        const matchSpatial = (!filters.spatialSelection || filters.spatialSelection.includes(d));
        return matchType && matchNeighborhood && matchMethod && matchPriority && matchTime && matchSpatial;
    });

    
    // --- Update Visualizations ---
    leafletMap.data = fullyFilteredData;
    leafletMap.updateVis();

    lineChart.data = d3.rollups(fullyFilteredData, v => v.length, d => +d3.timeDay.floor(d.DATE_CREATED_OBJ))
        .map(([date, count]) => ({ date, count })).sort((a,b) => a.date - b.date);
    lineChart.updateVis();

    // Neighborhood Bar Chart updates based on other selections
    neighborhoodChart.data = d3.rollups(neighborhoodViewData, v => v.length, d => d.NEIGHBORHOOD)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    neighborhoodChart.updateVis();

    // Method Bar Chart updates based on other selections
    methodChart.data = d3.rollups(methodViewData, v => v.length, d => d.METHOD_RECEIVED)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    methodChart.updateVis();

    // Dept Bar Chart updates based on other selections
    deptChart.data = d3.rollups(deptViewData, v => v.length, d => d.DEPT_NAME)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    deptChart.updateVis();

    // Priority Bar Chart updates based on other selections
    const priorityOrder = { 'STANDARD': 0, 'PRIORITY': 1, 'HAZARDOUS': 2 };
    priorityChart.data = d3.rollups(priorityViewData, v => v.length, d => d.PRIORITY)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => (priorityOrder[a.name] || 0) - (priorityOrder[b.name] || 0));
    priorityChart.updateVis();

    // --- Update Neighborhood Chart ---
    neighborhoodChart.config.colorScale = (name) => {
        const cleanName = name ? name.toUpperCase() : "N/A";
        return leafletMap.colorScaleNeighborhood(cleanName);
    };
    neighborhoodChart.updateVis();

    // --- Update Priority Chart ---
    priorityChart.config.colorScale = (name) => {
        return leafletMap.colorScalePriority(name);
    };
    priorityChart.updateVis();

    // --- Update Dept Chart ---
    deptChart.config.colorScale = (name) => {
        return leafletMap.colorScaleAgency ? leafletMap.colorScaleAgency(name) : 'steelblue';
    };
    deptChart.updateVis();
}
