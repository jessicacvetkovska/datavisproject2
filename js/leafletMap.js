class LeafletMap {

  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
    }
    this.data = _data;
    this.initVis();
  }
  
  /**
   * Initialize the map.
   */
  initVis() {
    let vis = this;

    vis.fullData = vis.data
    //OpenStreetMap - shows neighborhoods clearly
    vis.openStreetUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    vis.openStreetAttr = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';

    vis.colorScale = d3.scaleOrdinal()
      .domain([...new Set(vis.data.map(d => d.DEPT_NAME))])
      .range(d3.schemeTableau10);

    //this is the base map layer, where we are showing the map background
    vis.base_layer = L.tileLayer(vis.openStreetUrl, {
      id: 'openStreet-image',
      attribution: vis.openStreetAttr,
      ext: 'png'
    });

    // Init map with base layer image
    vis.theMap = L.map('my-map', {
      center: [30, 0],
      zoom: 2,
      minZoom: 11,
      maxZoom: 17,
      layers: [vis.base_layer]
    });

    // Set default zoom to Cincinnati upon open
    vis.theMap.setView([39.1413, -84.5061], 12);
    
    L.svg().addTo(vis.theMap);
    vis.overlay = d3.select(vis.theMap.getPanes().overlayPane)
    vis.svg = vis.overlay.select('svg').attr("pointer-events", "auto")    

    vis.Dots = vis.svg.selectAll('circle')
                .data(vis.data) 
                .join('circle')
                    .attr("fill", d => vis.colorScale(d.DEPT_NAME))  //---- TO DO- color by magnitude 
                    .attr("stroke", "black")
                    //Leaflet has to take control of projecting points. 
                    //Here we are feeding the latitude and longitude coordinates to
                    //leaflet so that it can project them on the coordinates of the view. 
                    //the returned conversion produces an x and y point. 
                    //We have to select the the desired one using .x or .y
                    .attr("cx", d => vis.theMap.latLngToLayerPoint([d.LATITUDE,d.LONGITUDE]).x)
                    .attr("cy", d => vis.theMap.latLngToLayerPoint([d.LATITUDE,d.LONGITUDE]).y) 
                    .attr("r", d=> 8)  // --- TO DO- want to make radius proportional to earthquake size? 
                    .on('mouseover', function(event,d) { //function to add mouseover event
                        d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
                          .duration('150') //how long we are transitioning between the two states (works like keyframes)
                          .attr("fill", "red") //change the fill
                          .attr('r', 8); //change radius

                        //create a tool tip
                        d3.select('#tooltip')
                            .style('opacity', 1)
                            .style('z-index', 1000000)
                              // Format number with million and thousand separator
                              //***** TO DO- change this tooltip to show useful information about the quakes
                            .html(`<div class="tooltip-label">Description: ${d.SR_TYPE_DESC}, Priority: ${d.PRIORITY || 'No Priority'}, Date of Call: ${d.DATE_CREATED}, Date Closed: ${d.DATE_CLOSED}, Department: ${d.DEPT_NAME} `);

                      })
                    .on('mousemove', (event) => {
                        //position the tooltip
                        d3.select('#tooltip')
                          .style('left', (event.pageX + 10) + 'px')   
                          .style('top', (event.pageY + 10) + 'px');
                      })              
                    .on('mouseleave', function() { //function to add mouseover event
                        d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
                          .duration('150') //how long we are transitioning between the two states (works like keyframes)
                          .attr("fill", "steelblue") //change the fill  TO DO- change fill again
                          .attr('r', 8) //change radius

                        d3.select('#tooltip').style('opacity', 0);//turn off the tooltip

                          })
    
    //handler here for updating the map, as you zoom in and out           
    vis.theMap.on("zoomend", function(){
      vis.updateVis();
    });

  }

  filterBySRType(selectedType){
    let vis = this;

    vis.data = selectedType === 'all'
      ? vis.fullData
      : vis.fullData.filter(d => d.SR_TYPE_DESC === selectedType)
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

updateVis() {
    let vis = this;

    vis.Dots = vis.svg.selectAll('circle')
        .data(vis.data)
        .join('circle')

            .attr("cx", d => vis.theMap.latLngToLayerPoint([d.LATITUDE, d.LONGITUDE]).x)
            .attr("cy", d => vis.theMap.latLngToLayerPoint([d.LATITUDE, d.LONGITUDE]).y)
            .attr("r", 8);
}


  renderVis() {
    let vis = this;

    //not using right now... 
 
  }
}
