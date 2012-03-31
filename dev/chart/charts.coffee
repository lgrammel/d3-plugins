@d3.chart = {}

@d3c_property = (value) ->
  (_) ->
    if (!arguments.length) 
      value
    else
      value = _
      this