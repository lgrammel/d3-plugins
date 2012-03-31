d3.chart.stream = function() {

    chart.margin = d3c_property({top: 0, right: 0, bottom: 0, left: 0});
    chart.width = d3c_property(960);
    chart.height = d3c_property(500);

    chart.key = d3c_property(undefined);

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
            var chartElement = this;

            // get values from properties
            var margin = chart.margin();
            var height = chart.height();
            var width = chart.width();
            var key = chart.key();

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

            // old data
            var oldChartInstance = chartElement.__CHART__;
            var oldData = d3.range(stackedData.length);
            if (oldChartInstance === undefined) {
                // begin in the middle and expand
                var n = stackedData[0].length
                var defaultEntries = d3.range(n).map(function(i) {
                    return {
                        'x': i,
                        'y': 0,
                        'y0': my / 2
                    }
                });
                oldData = oldData.map(function() {
                    return defaultEntries;
                });
            } else {
                // top line of current chart, 0 height
                var defaultEntries = oldChartInstance.data[oldChartInstance.data.length - 1]
                    .map(function(d) {
                    return {
                        'x': d.x,
                        'y': 0,
                        'y0': d.y0
                    }
                });

                oldData = oldData.map(function(i) {
                    return (i < oldChartInstance.data.length) ?
                            oldChartInstance.data[i] :
                            defaultEntries;
                });
            }

            var layer = g.selectAll("path").data(stackedData, key);

            // enter
            var layerEnter = layer.enter().append("path").classed("layer", true);
            // register event handlers
            layerEnter.call(function(d) {
                var _this = this;
                _on.forEach(function(args) {
                    layerEnter.on.apply(_this, args);
                });
            });
            // start with the final values for color etc.
            layerEnter.call(function(d) {
                var _this = this;
                _attr.forEach(function(args) {
                    d.attr.apply(_this, args);
                });
            }, layer);
            // if there is a current chartInstance, add on top, otherwise default path
            layerEnter.call(function(e) {
                e.attr("d", function(d, i) {
                    return area(oldData[i]);
                });
            });

            // update - tween d on y, y0 only
            var layerUpdate = d3.transition(layer);
            layerUpdate.attrTween("d", function(d, i, a) {
                // assert: originalData.length == targetData.length
                var originalData = oldData[i]; // TODO rescale ( * (oldMy / currentMy)
                var targetData = d;
                var n = targetData.length;
                return function(t) {
                    var currentData = [];
                    for (var i=0; i < n; i++) {
                        currentData[i] = {
                            'x': targetData[i].x,
                            'y': originalData[i].y + t * (targetData[i].y - originalData[i].y),
                            'y0': originalData[i].y0 + t * (targetData[i].y0 - originalData[i].y0)
                        };
                    }
                    return area(currentData);
                }
            });
            layerUpdate.call(function(d) {
                var _this = this;
                _attr.forEach(function(args) {
                    d.attr.apply(_this, args);
                });
            }, layer);
            
            // exit
            layer.exit().remove();
            // var layerExit = d3.transition(layer.exit()).remove();
            
            // store the chart in the layer and root node DOM elements
            var chartInstance = {
                'root': this,
                'data': stackedData,
                'area': area
            };

            layerEnter.each(function() {
                this.__CHART__ = chartInstance;
            });

            chartElement.__CHART__ = chartInstance;
        });
    }

    d3.rebind(chart, stack, "offset", "order");

    return chart;

};