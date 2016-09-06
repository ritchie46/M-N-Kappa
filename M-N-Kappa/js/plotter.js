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


    

    function draw_polygon() {
        var x = document.getElementsByClassName("xval")
        //var x = document.getElementsByName("xval")
        var y = document.getElementsByClassName("yval")
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

        //location for the current sessions polygon
        var loc_list = []
        var loc_pg0 = new vector.Point(-min_x, -min_y)
        loc_list.push(loc_pg0)

        for (var i = 0; i < y.length; i++) {

            if (x[i].value.length > 0 && y[i].value.length > 0) {
                 
                var loc = {
                    x: scale(parseFloat(x[i].value) - min_x),
                    y: scale(parseFloat(y[i].value) - min_y) //+ settings.height
                }
                data.push(loc)


                //location for the current sessions polygon
                var loc_pg = new vector.Point(parseFloat(x[i].value) - min_x, parseFloat(y[i].value) - min_y)
             
                loc_list.push(loc_pg)

                
            }
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

    function set_stress_strain_svg(selector) {
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

    var svg_comp = set_stress_strain_svg("#comp_strain_svg_div")
    var svg_tens = set_stress_strain_svg("#tens_strain_svg_div")
    //var rebar_svg = set_stress_strain_svg("#rebar_svg_1")
  

    function det_min_max(array) {
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
            max,
            min
        }
    }

    
    function draw_lines(svg, xstr, ystr) {
        /** 
        Draws the strain diagrams and adds the diagrams to the current session
        */

        var x_bound = det_min_max(xstr)
        var y_bound = det_min_max(ystr)

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
            if (xstr[i].value.length > 0 && ystr[i].value.length > 0) {
      
                var loc = {
                    x: scale_x(parseFloat(xstr[i].value) - x_bound.min),
                    y: -scale_y(parseFloat(ystr[i].value) - y_bound.min) + height
                }
                data.push(loc)
               
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
        draw_polygon,
        draw_lines,
        svg_comp,
        svg_tens,
        set_stress_strain_svg
    }

})();  // plt namespace

