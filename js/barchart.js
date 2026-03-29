class BarChart {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 500,
            containerHeight: _config.containerHeight || 300,
            margin: _config.margin || { top: 20, right: 20, bottom: 80, left: 60 },
            onClick: _config.onClick || (() => {}) // Callback function
        }
        this.data = _data;
        this.initVis();
    }

    initVis() {
        let vis = this;
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.xScale = d3.scaleBand().range([0, vis.width]).padding(0.2);
        vis.yScale = d3.scaleLinear().range([vis.height, 0]);

        vis.xAxis = d3.axisBottom(vis.xScale);
        vis.yAxis = d3.axisLeft(vis.yScale).ticks(5);

        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.xAxisG = vis.chart.append('g').attr('transform', `translate(0,${vis.height})`);
        vis.yAxisG = vis.chart.append('g');
        
        vis.activeCategory = null; // Track selection
    }

    updateVis() {
        let vis = this;
        vis.xScale.domain(vis.data.map(d => d.name));
        vis.yScale.domain([0, d3.max(vis.data, d => d.count) || 1]);
        vis.renderVis();
    }

    renderVis() {
        let vis = this;

        vis.chart.selectAll('.bar')
            .data(vis.data)
            .join('rect')
            .attr('class', d => d.name === vis.activeCategory ? 'bar active' : 'bar')
            .attr('x', d => vis.xScale(d.name))
            .attr('y', d => vis.yScale(d.count))
            .attr('width', vis.xScale.bandwidth())
            .attr('height', d => vis.height - vis.yScale(d.count))
            .attr('fill', d => {
            // NEW: If a color scale was passed to the chart, use it!
                if (vis.config.colorScale) {
                    return vis.config.colorScale(d.name);
                }
                
                // Fallback to your selection logic
                if (!vis.activeCategory) return 'steelblue'; 
                return d.name === vis.activeCategory ? '#e31a1c' : '#dae1e7'; 
            })
            .on('click', (event, d) => {
                vis.activeCategory = (vis.activeCategory === d.name) ? null : d.name;
                vis.config.onClick(vis.activeCategory);
                vis.updateVis();
            });

        vis.xAxisG.call(vis.xAxis)
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('transform', 'rotate(-45)');

        vis.yAxisG.call(vis.yAxis);
    }
}
