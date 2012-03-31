d3.chart.stream = function() {

    chart.margin = d3c_property({top: 0, right: 0, bottom: 0, left: 0});
    chart.width = d3c_property(960);
    chart.height = d3c_property(500);

    var stack =  d3.layout.stack().offset("wiggle");
    
    var _attr = [];
    chart.attr = function() {
        _attr.push(arguments);
        return chart;
    };

    var _on = [];
    chart.on = function() {
        _on.push(arguments);
        return chart;
    };
    
    function chart(selection) {
        selection.each(function(data) {
            // get values from properties
            var margin = chart.margin();
            var height = chart.height();
            var width = chart.width();

            // Select the svg element, if it exists.
            var svg = d3.select(this).selectAll("svg").data([data]);

            // Otherwise, create the skeletal chart.
            svg.enter().append("svg").append("g");

            // Update the outer dimensions.
            svg .attr("width", width)
                .attr("height", height);

            // Update the inner dimensions.
            var g = svg.select("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var availableWidth = width - margin.left - margin.right,
                availableHeight = height - margin.top - margin.bottom;

            // stacking
            var stackedData = stack(data);

            var mx = stackedData[0].length - 1, // assumes that all layers have same # of samples & that there is at least one layer
                my = d3.max(stackedData, function(d) {
                    return d3.max(d, function(d) {
                        return d.y0 + d.y;
                    });
                });

            var area = d3.svg.area()
                .x(function(d) { return d.x * availableWidth / mx; })
                .y0(function(d) { return availableHeight - d.y0 * availableHeight / my; })
                .y1(function(d) { return availableHeight - (d.y + d.y0) * availableHeight / my; });

            var layer = g.selectAll("path").data(stackedData);
            
            // enter
            var layerEnter = layer.enter().append("path").classed("layer", true);
            layerEnter.call(function(d) {
                var _this = this;
                _on.forEach(function(args) {
                    layerEnter.on.apply(_this, args);
                });
            });

            // update
            var layerUpdate = d3.transition(layer);
            layerUpdate.attr("d", area);
            layerUpdate.call(function(d) { 
                var _this = this;
                _attr.forEach(function(args) {
                    d.attr.apply(_this, args);
                });
            }, layer);
            
            // exit
            var layerExit = d3.transition(layer.exit()).remove();
            
            // store the chart in the layer and root node DOM elements
            var chartInstance = {
                'root': this
            };

            layerEnter.each(function() {
                this.__CHART__ = chartInstance;
            });

            this.__CHART__ = chartInstance;
        });
    }

    d3.rebind(chart, stack, "offset", "order");

    return chart;

};