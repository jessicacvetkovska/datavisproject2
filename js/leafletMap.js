class LeafletMap {

  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      onBrush: _config.onBrush || (() => {}) // Callback for spatial brush
    }
    this.data = _data;
    this.colorBy = 'none'; // Track current color state
    this.isBrushing = false;
    this.brushStart = null;
    this.brushRect = null;
    this.initVis();
  }
  
  /**
   * Initialize map.
   */
  initVis() {
    let vis = this;
    vis.fullData = vis.data;

    // Track heatmap visibility state
    vis.showHeatmap = false;

    // Remove the old map instance from the DOM element before starting
    let mapContainer = L.DomUtil.get(vis.config.parentElement.replace('#', ''));
    if (mapContainer && mapContainer._leaflet_id !== undefined) {
        mapContainer._leaflet_id = null;
    }
    // Unique Service Type Color Scale
    // get all unique types and use the Golden Ratio to pick distinct colors
    vis.serviceTypes = [...new Set(vis.fullData.map(d => d.SR_TYPE_DESC))].sort();
    
    // The Golden Ratio (phi) helps spread hues evenly around the color wheel
    const phi = 0.618033988749895;
    let hue = 0;

    vis.colorScaleServiceType = d3.scaleOrdinal()
        .domain(vis.serviceTypes)
        .range(vis.serviceTypes.map(() => {
            hue = (hue + phi) % 1; // Jumps to a new part of the wheel
            return d3.hsl(hue * 360, 0.8, 0.5).toString();
        }));

    // Define Domains for Legends
    vis.neighborhoods = [...new Set(vis.fullData.map(d => d.NEIGHBORHOOD))].sort();
    vis.agencies = [...new Set(vis.fullData.map(d => d.DEPT_NAME))].sort();
    vis.priorities = ['STANDARD', 'PRIORITY', 'HAZARDOUS'];

    // Initialize Color Scales
    // Generate the standard 50 colors
    const baseColors = d3.quantize(d3.interpolateRainbow, vis.neighborhoods.length);
    
    // Time to Update: Sequential scale (Yellow to Red)
    const maxTime = d3.max(vis.fullData, d => d.time_diff);
    vis.colorScaleTime = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, maxTime]);
    
    // Neighborhood Color ScaleYYY
    const neighborhoods = [
        "EAST PRICE HILL", "CUF", "LINWOOD", "MILLVALE", "HARTWELL", 
        "PLEASANT RIDGE", "WESTWOOD", "WALNUT HILLS", "RIVERSIDE", 
        "WEST PRICE HILL", "SPRING GROVE VILLAGE", "MADISONVILLE", 
        "HYDE PARK", "COLLEGE HILL", "NORTH AVONDALE", "AVONDALE", 
        "MT. AUBURN", "EVANSTON", "SOUTH CUMMINSVILLE", "BOND HILL", 
        "OAKLEY", "CLIFTON", "MT. LOOKOUT", "MT. WASHINGTON", 
        "KENNEDY HEIGHTS", "SOUTH FAIRMOUNT", "EAST WESTWOOD", "WEST END", 
        "NORTHSIDE", "EAST WALNUT HILLS", "PENDLETON", "OVER-THE-RHINE", 
        "NORTH FAIRMOUNT", "CORRYVILLE", "CALIFORNIA", "CAMP WASHINGTON", 
        "DOWNTOWN", "MT. ADAMS", "LOWER PRICE HILL", "COLUMBIA TUSCULUM", 
        "ROSELAWN", "MT. AIRY", "EAST END", "QUEENSGATE", "SAYLER PARK", 
        "WINTON HILLS", "VILLAGES AT ROLL HILL", "CARTHAGE", "SEDAMSVILLE", 
        "N/A", "0"
    ];


    // Shuffle colors so neighbors in the list get very different hues
    const neighborScatteredColors = vis.neighborhoods.map((d, i) => {
        return baseColors[(i * 13) % baseColors.length];
    });

    // Apply to scale
    vis.colorScaleNeighborhood = d3.scaleOrdinal()
        .domain(vis.neighborhoods)
        .range(neighborScatteredColors);
    
    // Priority Color Scale
    vis.colorScalePriority = d3.scaleOrdinal()
        .domain(vis.priorities) 
        .range(['#2ca02c', '#ff7f0e', '#d62728']); 
    
        
    // Agency Color Scale
    const agencies = [
        "CINC BUILDING DEPT",
        "DEPT OF TRANS AND ENG",
        "PUBLIC SERVICES",
        "CINC HEALTH DEPT",
        "CIN WATER WORKS",
        "PARK DEPARTMENT",
        "COMMUNITY DEVELOPMENT",
        "CITY MANAGER'S OFFICE",
        "POLICE DEPARTMENT",
        "EMERGENCY COMMUNICATIONS",
        "CINCINNATI RECREATION",
        "METROPOLITAN SEWER",
        "FIRE DEPT"
    ];


    // Shuffle colors so agencies in the list get very different hues
    const agencyScatteredColors = vis.agencies.map((d, i) => {
      return baseColors[(i * 13) % baseColors.length];
    });

    // Apply to scale
    vis.colorScaleAgency = d3.scaleOrdinal()
        .domain(vis.agencies)
        .range(agencyScatteredColors);


    // Setup Map
    vis.openStreetUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    vis.openStreetAttr = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';

    vis.base_layer = L.tileLayer(vis.openStreetUrl, {
      id: 'openStreet-image',
      attribution: vis.openStreetAttr,
      ext: 'png'
    });

    vis.theMap = L.map('my-map', {
      center: [39.1413, -84.5061],
      zoom: 12,
      minZoom: 11,
      maxZoom: 17,
      layers: [vis.base_layer]
    });
    
    L.svg().addTo(vis.theMap);
    vis.overlay = d3.select(vis.theMap.getPanes().overlayPane);
    vis.svg = vis.overlay.select('svg').attr("pointer-events", "auto");

    // Add brush rectangle
    vis.brushRect = vis.svg.append('rect')
        .attr('class', 'brush-rect')
        .attr('fill', 'rgba(0, 123, 255, 0.3)')
        .attr('stroke', 'blue')
        .attr('stroke-width', 2)
        .style('display', 'none');

    // Redraw points when zooming in and out
    vis.theMap.on("zoomend", function(){
      vis.updateVis();
    });


    // Initialize the Heatmap Layer
    // Start with an empty array; it will be populated in updateVis
    vis.heatLayer = L.heatLayer([], {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        minOpacity: 0.4,
        gradient: {0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red'}
    }).addTo(vis.theMap);

    // Ensure the SVG (circles) stays on top of the heatmap for interaction
    vis.svg.raise();
    
    // SVG layer for individual points
    L.svg().addTo(vis.theMap);
    vis.overlay = d3.select(vis.theMap.getPanes().overlayPane);
    vis.svg = vis.overlay.select('svg').attr("pointer-events", "auto");

    // Call updateVis to draw the initial points
    vis.updateVis();
  }

  // --- Helper to determine color based on dropdown state ---
  getPointColor(d) {
      let vis = this;
      // Time Point Color
      if (vis.colorBy === 'time') return vis.colorScaleTime(d.time_diff);
      
      // Neighborhood
      if (vis.colorBy === 'neighborhood') {
        // Use .toUpperCase() to ensure it matches defined list exactly
        const neighborhoodName = d.NEIGHBORHOOD ? d.NEIGHBORHOOD.toUpperCase() : "N/A";
        return vis.colorScaleNeighborhood(neighborhoodName);
      }
      
      // Priority
      if (vis.colorBy === 'priority') return vis.colorScalePriority(d.PRIORITY); 
      
      // Agency
      if (vis.colorBy === 'agency') return vis.colorScaleAgency(d.DEPT_NAME); 
      
      return vis.colorScaleServiceType(d.SR_TYPE_DESC);
  }

  // Set color based on filter
  changeColorBy(selectedColorBy) {
      let vis = this;
      vis.colorBy = selectedColorBy; // Update the state
      
      // Select all circles and smoothly transition their fill color
      vis.svg.selectAll('circle')
          .transition()
          .duration(300)
          .attr("fill", d => vis.getPointColor(d));

      vis.updateLegend();
  }

  updateLegend() {
      let vis = this;
      const legendContainer = d3.select('#map-legend');
      if (legendContainer.empty()) return; 
      legendContainer.html(""); 

      if (vis.colorBy === 'none') return;

      let legendData = [];
      // Set legend data based on colorBy filter
      if (vis.colorBy === 'priority') {
          legendData = vis.priorities.map(p => ({ label: p, color: vis.colorScalePriority(p) }));
      } else if (vis.colorBy === 'agency') {
          legendData = vis.agencies.map(a => ({ label: a, color: vis.colorScaleAgency(a) }));
      } else if (vis.colorBy === 'neighborhood') {
          legendData = vis.neighborhoods.map(n => ({ label: n, color: vis.colorScaleNeighborhood(n) }));
      } else if (vis.colorBy === 'time') {
          const maxTime = vis.colorScaleTime.domain()[1];
          for (let i = 0; i <= 4; i++) {
              let val = (maxTime / 4) * i;
              legendData.push({ label: `${val.toFixed(0)} days`, color: vis.colorScaleTime(val) });
          }
      }




      // Create the legend boxes
      const items = legendContainer.selectAll('.legend-item')
        .data(legendData)
        .enter()
        .append('div')
        .attr('class', 'legend-item'); // Uses CSS from style.css

      items.append('div')
        .attr('class', 'legend-color') // Uses CSS from style.css
        .style('background-color', d => d.color);

      items.append('span')
        .text(d => d.label);
    }

  filterBySRType(selectedType){
    let vis = this;

    // Update data based on filter
    vis.data = selectedType === 'all'
      ? vis.fullData
      : vis.fullData.filter(d => d.SR_TYPE_DESC === selectedType);
    
    // Redraw with new data
    vis.updateVis();
  }

  setBackground(selectedBackground, selectedAttr) {
  let vis = this;

  // Remove the current tile layer from the map
  vis.base_layer.remove();

  // Create and add the new tile layer
  vis.base_layer = L.tileLayer(selectedBackground, {
    attribution: selectedAttr,
    ext: 'png'
  });

  vis.base_layer.addTo(vis.theMap);

}

// Toggle heatmap function
toggleHeatmap(isVisible) {
    let vis = this;
    vis.showHeatmap = isVisible;
    
    if (vis.showHeatmap) {
        vis.theMap.addLayer(vis.heatLayer);
    } else {
        vis.theMap.removeLayer(vis.heatLayer);
    }
    
    // Refresh the view to ensure points/heatmap are in sync
    vis.updateVis();
}

  // Main drawing function (handles init, zoom, data filtering)
  updateVis() {
    let vis = this;
    
    // Only update heatmap data if it's currently active
    if (vis.showHeatmap) {
        const heatPoints = vis.data.map(d => [d.LATITUDE, d.LONGITUDE, 1]);
        vis.heatLayer.setLatLngs(heatPoints);
    }

    vis.Dots = vis.svg.selectAll('circle')
        .data(vis.data)
        .join('circle')
            // Apply the current color state during any redraw/zoom
            .attr("fill", d => vis.getPointColor(d)) 
            .attr("stroke", "black")
            .attr("stroke-width", 0.5)
            .style("opacity", vis.colorBy === 'none' ? 0.6 : 1)
            .attr("cx", d => vis.theMap.latLngToLayerPoint([d.LATITUDE, d.LONGITUDE]).x)
            .attr("cy", d => vis.theMap.latLngToLayerPoint([d.LATITUDE, d.LONGITUDE]).y)
            .attr("r", 3)
            .on('mouseover', function(event, d) { 
                d3.select(this).transition() 
                  .duration(150) 
                  .attr("fill", "cyan") // Highlight color
                  .attr('r', 5); 

                d3.select('#tooltip')
                    .style('opacity', 1)
                    .style('z-index', 1000000)
                    .html(`<div class="tooltip-label">Description: ${d.SR_TYPE_DESC}<br>Priority: ${d.PRIORITY || 'N/A'}<br>Agency: ${d.DEPT_NAME || 'N/A'}<br>Date of Call: ${d.DATE_CREATED}<br>Date Closed: ${d.DATE_CLOSED}<br>Days to Update: ${d.time_diff ? d.time_diff.toFixed(1) : 'N/A'}</div>`);
              })
            .on('mousemove', (event) => {
                d3.select('#tooltip')
                  .style('left', (event.pageX + 10) + 'px')   
                  .style('top', (event.pageY + 10) + 'px');
              })              
            .on('mouseleave', function(event, d) { 
                d3.select(this).transition() 
                  .duration(150) 
                  // Maintain correct color state
                  .attr("fill", vis.getPointColor(d)) 
                  .attr('r', 3); 

                d3.select('#tooltip').style('opacity', 0);
              });

              // Add to initVis in leafletMap.js
              vis.theMap.on('mousedown', (e) => {
                  if (e.originalEvent.shiftKey) {
                      vis.isBrushing = true;
                      vis.theMap.dragging.disable();
                      const point = vis.theMap.latLngToContainerPoint(e.latlng);
                      vis.brushStart = point;
                      vis.brushRect
                          .attr('x', point.x)
                          .attr('y', point.y)
                          .attr('width', 0)
                          .attr('height', 0)
                          .style('display', null);
                  }
              });

              vis.theMap.on('mousemove', (e) => {
                  if (vis.isBrushing && vis.brushStart) {
                      const currentPoint = vis.theMap.latLngToContainerPoint(e.latlng);
                      const x = Math.min(vis.brushStart.x, currentPoint.x);
                      const y = Math.min(vis.brushStart.y, currentPoint.y);
                      const width = Math.abs(currentPoint.x - vis.brushStart.x);
                      const height = Math.abs(currentPoint.y - vis.brushStart.y);
                      vis.brushRect
                          .attr('x', x)
                          .attr('y', y)
                          .attr('width', width)
                          .attr('height', height);
                  }
              });

              vis.theMap.on('mouseup', () => {
                  if (vis.isBrushing) {
                      vis.isBrushing = false;
                      vis.theMap.dragging.enable();
                      // Get selected points
                      const bounds = vis.getBrushBounds();
                      if (bounds) {
                          const selectedPoints = vis.data.filter(d => {
                              const point = vis.theMap.latLngToContainerPoint([d.LATITUDE, d.LONGITUDE]);
                              return point.x >= bounds.x && point.x <= bounds.x + bounds.width &&
                                     point.y >= bounds.y && point.y <= bounds.y + bounds.height;
                          });
                          vis.config.onBrush(selectedPoints.length > 0 ? selectedPoints : null);
                      } else {
                          vis.config.onBrush(null);
                      }
                      vis.brushRect.style('display', 'none');
                  }
              });

              vis.theMap.on('dblclick', () => {
                  vis.config.onBrush(null); // Clear spatial selection
              });
  }

  getBrushBounds() {
      let vis = this;
      if (!vis.brushRect) return null;
      const rect = vis.brushRect.node();
      if (!rect) return null;
      const bbox = rect.getBBox();
      return bbox.width > 0 && bbox.height > 0 ? bbox : null;
  }
}
