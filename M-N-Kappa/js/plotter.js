﻿"use strict"


// plt namespace
var plt = (function () {

    var settings = {
        width: 300,
        height: 300,
        offset_origin_x: 0,
        offset_origin_y: 0
    };

    var svg_cross_section = d3.select("#pg_svg").append("svg")
    .attr("width", settings.width)
    .attr("height", settings.height)
    .append('g'); // groups svg shapes


var linefunc = d3.line()
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; });
  
    svg_cross_section.selectAll("path")
    .data([{ x: 0, y: 0 }])
    .enter()
    .append("path")
    .attr("d", linefunc(0))
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("fill", "#BDBDBD");

    svg_cross_section.selectAll("circle")
   .data(Array.apply(null, Array(500)).map(Number.prototype.valueOf, 0))
   .enter()
   .append("circle")
   .attr("cx", function (d) {
       return d[0]
   })
   .attr("cy", function (d) {
       return d[1]
   })
    .attr("r", function (d) {
        return d[2]
    });


    function input_strings_to_floats(arr) {
        var new_arr = [];
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].value.length > 0)
                new_arr.push(parseFloat(arr[i].value))
        }
        return new_arr
}

    


    function draw_polygon(x, y, session, add_to_mkap) {
        /// <param name="session" type="object"> From the session class.

        // default parameter
        add_to_mkap = (typeof add_to_mkap !== "undefined") ? add_to_mkap : true;

        if (x[0] instanceof vector.Point) {
            var x2 = [];
            y = [];
            for (i in x) {
                x2.push(x[i].x);
                y.push(x[i].y);
            }
            x = x2
        }
        
        if (typeof x[0] === "object") {  // x and y are probably from input field.
            x = input_strings_to_floats(x);
            y = input_strings_to_floats(y);
        }
        // else x and y are probably an array with floats.

        // displace values
        var minx = Math.min.apply(null, x);
        var miny = Math.min.apply(null, y);

        if (minx < 0) {
            for (i = 0; i < x.length; i++) {
                x[i] += Math.abs(minx);
            }
        }
        if (miny < 0) {
            for (i = 0; i < y.length; i++) {
                y[i] += Math.abs(miny);
            }
        }

        // Determine the max and min values for scaling
        var max_val = 0;
        var min_val = 0;
        var min_x = 0;
        var min_y = 0;
        var max_x = 0;
        var max_y = 0;

        for (i = 0; i < y.length; i++) {

            var xval = x[i];
            var yval = y[i];

            max_val = max_val < xval ? xval : max_val;
            max_val = max_val < yval ? yval : max_val;
            max_x = max_x < xval ? xval : max_x;
            max_y = max_y < yval ? yval : max_y;
            min_x = min_x > xval ? xval : min_x;
            min_y = min_y > yval ? yval : min_y;
            min_val = min_val > xval ? xval : min_val;
            min_val = min_val > yval ? yval : min_val;
        }

        // functions that scales the input to the svg size
        session.bound_max = max_val;
        var range_scale = session.range_scale = Math.max(settings.width, settings.height);

        var scale = d3.scaleLinear()
                      .domain([0, max_val -min_val])  // make sure that all the values fit in the domain, thus also negative values
                      .range([0, range_scale]);

        
        // data that will be attached to the svg path
        var data = [];
        // set first value to origin.
        var loc0 = { x: scale(x[0]), y: -scale(y[0]) + settings.height };
        data.push(loc0);

        //location for the current sessions polygon
        var loc_list = [];
        var loc_pg0 = new vector.Point(x[0], y[0]);
        loc_list.push(loc_pg0);

        for (i = 0; i < y.length; i++) {
            loc = {
                x: scale(x[i] - min_x),
                y: -scale(y[i] - min_y) + settings.height
            };
            data.push(loc);

            //location for the current sessions polygon
            var loc_pg = new vector.Point(x[i] - min_x, y[i] - min_y);
             
            loc_list.push(loc_pg)                

        }
        // set last value to origin
        data.push(loc0);
        loc_list.push(loc_pg0);
        svg_cross_section.select("path").attr("d", linefunc(data));

        if (add_to_mkap) {
            session.mkap.cross_section = new crsn.PolyGon(loc_list);
        }
        // rebar plots
        // reset the plots
        data = [];
        var arr = [0, 0, 0];
        for (i = 0; i < 50; i++) {
            data.push(arr)
        }

        svg_cross_section.selectAll("circle")
        .data(data)
        .attr("cx", function (d) {
            return d[0]
        })
        .attr("cy", function (d) {
            return d[1]
        })
        .attr("r", function (d) {
            return d[2]
        });

        var loc = [];
        for (var i = 0; i < session.mkap.rebar_As.length; i++) {
            // Determine the height and the boundary location of the rebar. The edges of the cross-section are boundaries.
            var z = session.mkap.rebar_z[i];
            if (z < session.mkap.cross_section.top && z > session.mkap.cross_section.bottom) {

                var n = 3;
                var ndx = std.nearest_index(session.mkap.cross_section.y_val, z);
                var d1 = z - session.mkap.cross_section.y_val[ndx.low]; var d2 = session.mkap.cross_section.y_val[ndx.high] - z;
                ndx = d1 < d2 ? ndx.low : ndx.high;
                var bound = session.mkap.cross_section.paired_xvals[ndx];
                var As = session.mkap.rebar_As[i];
                var radius = scale(Math.sqrt(4 * As / Math.PI) / (n * bound.length));


                // draw the rebar between the edges
                for (var j = 0; j < bound.length; j++) {
                    var width = bound[j][0] - bound[j][1];
                    var dx = width / (n + 1);
                    x = bound[j][1];
                    for (var count = 0; count < n; count++) {
                        x += dx;
                        loc.push([scale(x - min_x), -scale(z - min_y) + settings.height, radius])
                    }
                }
            }
            svg_cross_section.selectAll("circle")
            .data(loc)
            .attr("cx", function (d) {
                return d[0]
            })
            .attr("cy", function (d) {
                return d[1]
            })
            .attr("r", function (d) {
                return d[2]
            })
        }

        return loc_list

    }
    


    /**
    stress strain diagrams
    */


    var width= $('#comp_curve').width() * 0.9;
    var height = 300;

    function add_svg(selector, name_x, name_y) {
        // default parameter
        name_x = (typeof name_x !== "undefined") ? name_x : false;
        name_y = (typeof name_x !== "undefined") ? name_y : false;

        var svg = d3.select(selector).append("svg")
                .attr("width", width)
                .attr("height", height)
                .append('g');

        svg.selectAll("path")
        .data([{ x: 0, y: 0 }])
        .enter()
        .append("path")
        .attr("d", linefunc(0))
        .attr("stroke", "blue")
        .attr("stroke-width", 2)
        .attr("fill", "none");

        // adding axes
        var padding = 20;
        svg.padding = padding;
        svg.range_x = [padding, width - padding];
        svg.range_y = [padding, height - padding];
        var xaxis = d3.axisTop()
            .scale(d3.scaleLinear().domain([0, 10.5]).range(svg.range_x));
        var yaxis = d3.axisRight()
            .scale(d3.scaleLinear().domain([0, 10.5]).range(svg.range_y));

        svg.append('g')
        .attr("transform", "translate(" + (padding) + "," + (height - padding) + ")")
        .attr("class", "xaxis")
        .call(xaxis);

        svg.append('g')
            .attr("class", "yaxis")
            .attr("transform", "translate(" + (padding) + ", " + (-padding) + " )")
            .call(yaxis);

        if (name_x != false) {
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "translate("+ (width / 2) +","+(height)+")")
                .text(name_x)
        }
        if (name_y != false) {
            svg.append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "translate(" + (padding / 2) +","+(height / 2)+")rotate(-90)")
                .text(name_y)
        }
        return svg
    }

    function det_min_max_str(array) {
        /**
        Input is an array of strings representing number values
        */
        var min = 0;
        var max = -1e9;
        for (var i = 0; i < array.length; i++) {
            var val = parseFloat(array[i].value);
            
            // only execute if value is a number
            if (!isNaN(val)) {
                min = min > val ? val : min;
                max = max < val ? val : max;
            }
        }
        return {
            max: max,
            min: min
        }
    }


    
    function draw_lines(svg, xstr, ystr, floats) {
        /// <param name="svg" type="object">d3 svg object</param>
        /// <param name="xstr" type="array of strings">array from html input</param>
        /// <param name="ystr" type="array of strings">array from html input</param>
        /// <param name="floats" type="boolean">If true the x and y arrays may contain floats</param>
   
        /** 
        Draws lines on a given svg canvast. Input is standard form listst, thus contains strings.
        */

        // default parameter
        floats = (typeof floats !== "undefined") ? floats : false;
        /**
        Math.max.apply(null, xstr) determines the max value of a string. .apply() is a method for applying arrays on the object.
        */

        if (floats) {
            var x_bound = {
                max: Math.max(Math.max.apply(null, xstr), 1e-9),
                min: Math.min(Math.min.apply(null, xstr), 0)
            };

            var y_bound = {
                max: Math.max(Math.max.apply(null, ystr), 1e-9),
                min: Math.min(Math.min.apply(null, ystr), 0)
            }
        }

        else {
            
            var x_bound = det_min_max_str(xstr);
            var y_bound = det_min_max_str(ystr);
        }

        var scale_x = d3.scaleLinear()
                .domain([0, x_bound.max * 1.05])  // make sure that all the values fit in the domain, thus also negative values
                .range(svg.range_x);

        var scale_y = d3.scaleLinear()
        .domain([0, y_bound.max * 1.05])  // make sure that all the values fit in the domain, thus also negative values
        .range(svg.range_y);


        var data = [
            { x: 0 + svg.padding, y: height - svg.padding}
        ];

        for (var i = 0; i < xstr.length; i++) {
            if (floats) {
                var loc = {
                    x: scale_x(xstr[i] - x_bound.min),
                    y: -scale_y(ystr[i] - y_bound.min) + height
                };

                data.push(loc);
            }
            else {
                if (xstr[i].value.length > 0 && ystr[i].value.length > 0) {
                    var loc = {
                        x: scale_x(parseFloat(xstr[i].value) - x_bound.min) + svg.padding,
                        y: -scale_y(parseFloat(ystr[i].value) - y_bound.min) + height - svg.padding
                    };
                    data.push(loc)
                }
            }
        }

        svg.select("path").attr("d", linefunc(data));
        
        // update the axes
        var xaxis = d3.axisTop()
                     .scale(d3.scaleLinear().domain([0, x_bound.max * 1.05]).range([0, width]));
        var yaxis = d3.axisRight()
                        .scale(d3.scaleLinear().domain([0, y_bound.max * 1.05]).range([height, 0]));


        svg.selectAll("g.xaxis")
            .call(xaxis);
        svg.selectAll("g.yaxis")
            .call(yaxis);
    }


    return {
        draw_polygon: draw_polygon,
        draw_lines: draw_lines,
        add_svg: add_svg,
        input_strings_to_floats: input_strings_to_floats
    }

})();  // plt namespace

