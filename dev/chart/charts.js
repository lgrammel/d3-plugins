window.d3.chart = function(el) {
    // walk up the tree to find surrounding chart
    var c = undefined;
    while (c === undefined && el !== undefined) {
        c = el.__CHART__;
        el = el.parentNode;
    }
    return c;
}

// @return selection of chart root element
window.d3.selectChart = function(el) {
    // walk up the tree to find surrounding chart
    var c = undefined;
    while (el !== undefined) {
        if (el.__CHART__ !== undefined) {
            return d3.select(el.__CHART__.root);
        }
        el = el.parentNode;
    }
    return null;
}

window.d3c_property = function(value) {
 return function(_) {
   if (!arguments.length) return value;
   value = _;
   return this;
 };
};