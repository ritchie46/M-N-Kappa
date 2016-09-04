"use strict"


// plt namespace
var plt = (function () {
    var settings = {
        width: 300,
        height: 300,
        offset_origin_x: 0,
        offset_origin_y: 0,
    }

    var svg = d3.select("body").append("svg")
    .attr("style", "float: right; float: top")
    .attr("width", settings.width)
    .attr("height", settings.height)
    .append('g') // groups svg shapes
    //.attr("transform", "translate( %1,%2)".replace("%1", settings.offset_origin_x).replace("%2", settings.offset_origin_y));

/**
<svg width="100" height="100">
<path d=" M 10 25
    L 10 75
    L 60 75
    stroke="red" stroke-width="2" fill="none" />
</svg>
*/

    var data = [
        { x: 0, y: 200 },
    ];

var linefunc = d3.line()
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; })
  
    svg.selectAll("path")
    .data(data)
    .enter()
    .append("path")
    .attr("d", linefunc(data))
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("fill", "#BDBDBD")
    

    var row_count = 0
    function draw_polygon() {
  
        var x = document.getElementsByName("xval")
        var y = document.getElementsByName("yval")
        // returns a list with input fields


        // Determine the max and min values for scaling
        var max_val = 0
        var min_val = 0
        var min_x = 0
        var min_y = 0
        var max_x = 0
        var max_y = 0
        for (var i = 0; i < y.length; i++) {

            var xval = parseFloat(x[i].value)
            var yval = parseFloat(y[i].value)

            max_val = max_val < xval ? xval : max_val
            max_val = max_val < yval ? yval : max_val
            max_x = max_x < xval ? xval : max_x
            max_y = max_y < yval ? yval : max_y
            min_x = min_x > xval ? xval : min_x
            min_y = min_y > yval ? yval : min_y
            min_val = min_val > xval ? xval : min_val
            min_val = min_val > yval ? yval : min_val
        }

        // functions that scales the input to the svg size
        var scale = d3.scaleLinear()
                      .domain([0, max_val -min_val])  // make sure that all the values fit in the domain, thus also negative values
                      .range([0, Math.max(settings.width, settings.height)])

        // data that will be attached to the svg path
        var data = []
        // set first value to origin.
        var loc0 = { x: scale(-min_x), y: scale(-min_y) }
        data.push(loc0)

        for (var i = 0; i < y.length; i++) {

            if (x[i].value.length > 0 && y[i].value.length > 0) {
                 
                var loc = {
                    x: scale(parseFloat(x[i].value) - min_x),
                    y: scale(parseFloat(y[i].value) - min_y) //+ settings.height
                }
                data.push(loc)
            }
        }
        // set last value to origin
        data.push(loc0)
        svg.select("path").attr("d", linefunc(data));

    }


    return {
        draw_polygon
    }

})();  // plt namespace

