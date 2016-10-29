"use strict"


// plt namespace
var plt = (function () {

    var settings = {
        width: 300,
        height: 300,
        offset_origin_x: 0,
        offset_origin_y: 0,
    }

    var svg_cross_section = d3.select("#pg_svg").append("svg")
    .attr("width", settings.width)
    .attr("height", settings.height)
    .append('g') // groups svg shapes


var linefunc = d3.line()
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; })
  
    svg_cross_section.selectAll("path")
    .data([{ x: 0, y: 0 }])
    .enter()
    .append("path")
    .attr("d", linefunc(0))
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("fill", "#BDBDBD")


    function input_strings_to_floats(arr) {
        var new_arr = []
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].value.length > 0)
                new_arr.push(parseFloat(arr[i].value))
        }
        return new_arr
}

    


    function draw_polygon(x, y) {

        if (x[0] instanceof vector.Point) {
            var x2 = []
            y = []
            for (i in x) {
                x2.push(x[i].x)
                y.push(x[i].y)
            }
            x = x2
        }
        
        console.log(x)
        console.log(y)

        if (typeof x[0] === "object") {  // x and y are probably from input field.
            x = input_strings_to_floats(x)
            y = input_strings_to_floats(y)
        }
        // else x and y are probably an array with floats.

        // displace values
        var minx = Math.min.apply(null, x)
        var miny = Math.min.apply(null, y)

        if (minx < 0) {
            for (i = 0; i < x.length; i++) {
                x[i] += Math.abs(minx);
            };
        };
        if (miny < 0) {
            for (i = 0; i < y.length; i++) {
                y[i] += Math.abs(miny);
            };
        }

        // Determine the max and min values for scaling
        var max_val = 0
        var min_val = 0
        var min_x = 0
        var min_y = 0
        var max_x = 0
        var max_y = 0

        for (var i = 0; i < y.length; i++) {

            var xval = x[i]
            var yval = y[i]

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
        //var loc0 = { x: scale(-min_x), y: -scale(-min_y) + settings.height }
        var loc0 = { x: scale(x[0]), y: -scale(y[0]) + settings.height }
        data.push(loc0)

        //location for the current sessions polygon
        var loc_list = []
        //var loc_pg0 = new vector.Point(-min_x, -min_y)
        var loc_pg0 = new vector.Point(x[0], y[0])
        loc_list.push(loc_pg0)

        for (var i = 0; i < y.length; i++) {    
            var loc = {
                x: scale(x[i] - min_x),
                y: -scale(y[i] - min_y) + settings.height
            }
            data.push(loc)

            //location for the current sessions polygon
            var loc_pg = new vector.Point(x[i] - min_x, y[i] - min_y)
             
            loc_list.push(loc_pg)                

        }
        // set last value to origin
        data.push(loc0)
        loc_list.push(loc_pg0)
        svg_cross_section.select("path").attr("d", linefunc(data));

        return loc_list

    }
    


    /**
    stress strain diagrams
    */


    var width= $('#comp_curve').width() * 0.9;
    var height = 300;

    // adding axes
    var xaxis = d3.axisTop()
                    .scale(d3.scaleLinear().domain([0, 10.5]).range([0, width]))
    var yaxis = d3.axisRight()
                    .scale(d3.scaleLinear().domain([0, 10.5]).range([height, 0]))

    function add_svg(selector) {
        var svg = d3.select(selector).append("svg")
                .attr("width", width)
                .attr("height", height)
                .append('g')
        //.attr("transform", "translate(0," + settings.offset_origin_y + ")")

        svg.selectAll("path")
        .data([{ x: 0, y: 0 }])
        .enter()
        .append("path")
        .attr("d", linefunc(0))
        .attr("stroke", "blue")
        .attr("stroke-width", 2)
        .attr("fill", "none")

        svg.append('g')
        .attr("transform", "translate(0," + (height - 1) + ")")
        .attr("class", "xaxis")
        .call(xaxis)

        svg.append('g')
            .attr("class", "yaxis")
            .call(yaxis)

        return svg
    }

    var svg_comp = add_svg("#comp_strain_svg_div")


    function det_min_max_str(array) {
        /**
        Input is an array of strings representing number values
        */
        var min = 0
        var max = -1e9
        for (var i = 0; i < array.length; i++) {
            var val = parseFloat(array[i].value)
            
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
        /// <param name="lists" type="boolean">If true the x and y arrays may contain floats</param>

        /** 
        Draws lines on a given svg canvast. Input is standard form listst, thus contains strings.
        */

        // default parameter
        var floats = (typeof floats !== "undefined") ? floats : false;

        /**
        Math.max.apply(null, xstr) determines the max value of a string. .apply() is a method for applying arrays on the object.
        */

        if (floats) {
            var x_bound = {
                max: Math.max(Math.max.apply(null, xstr), 1e-9),
                min: Math.min(Math.min.apply(null, xstr), 0)
            }

            var y_bound = {
                max: Math.max(Math.max.apply(null, ystr), 1e-9),
                min: Math.min(Math.min.apply(null, ystr), 0)
            }
        }

        else {
            
            var x_bound = det_min_max_str(xstr)
            var y_bound = det_min_max_str(ystr)
        }

        var scale_x = d3.scaleLinear()
                .domain([0, x_bound.max * 1.05])  // make sure that all the values fit in the domain, thus also negative values
                .range([0, width])

        var scale_y = d3.scaleLinear()
        .domain([0, y_bound.max * 1.05])  // make sure that all the values fit in the domain, thus also negative values
        .range([0, height])


        var data = [
            { x: 0, y: height },
        ]

        for (var i = 0; i < xstr.length; i++) {

            if (floats) {
                var loc = {
                    x: scale_x(xstr[i] - x_bound.min),
                    y: -scale_y(ystr[i] - y_bound.min) + height
                }

                data.push(loc)

            }
            else {
                if (xstr[i].value.length > 0 && ystr[i].value.length > 0) {
                    var loc = {
                        x: scale_x(parseFloat(xstr[i].value) - x_bound.min),
                        y: -scale_y(parseFloat(ystr[i].value) - y_bound.min) + height
                    }
                    data.push(loc)
                }
            }
        }
  
        svg.select("path").attr("d", linefunc(data));
        
        // update the axes
        var xaxis = d3.axisTop()
                     .scale(d3.scaleLinear().domain([0, x_bound.max * 1.05]).range([0, width]))
        var yaxis = d3.axisRight()
                        .scale(d3.scaleLinear().domain([0, y_bound.max * 1.05]).range([height, 0]))

        svg.selectAll("g.xaxis")
            .call(xaxis)
        svg.selectAll("g.yaxis")
            .call(yaxis)

    }


    return {
        draw_polygon: draw_polygon,
        draw_lines: draw_lines,
        svg_comp: svg_comp,
        add_svg: add_svg,
        input_strings_to_floats: input_strings_to_floats
    }

})();  // plt namespace

