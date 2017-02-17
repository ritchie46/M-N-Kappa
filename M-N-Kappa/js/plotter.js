"use strict";

// plt namespace
var plt = (function () {

    var settings = {
        padding: 20,
        width_svg: $("#pg_svg").width(),
        width: 300,
        height: 300,
        offset_origin_x: 0,
        offset_origin_y: 0
    };

    var linefunc = d3.line()
            .x(function(d) { return d.x; })
            .y(function(d) { return d.y; });

    var line_append = function(svg, data, color, stroke_width){
        svg.append("svg:path")
            .attr("d", linefunc(data))
            .attr("stroke", color)
            .attr("stroke-width", stroke_width)
            .attr("fill", "none");
    };


    function input_strings_to_floats(arr) {
        var new_arr = [];
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].value.length > 0)
                new_arr.push(parseFloat(arr[i].value))
        }
        return new_arr
}
    var svg_cross_section = d3.select("#pg_svg").append("svg")
        .attr("width", settings.width_svg)
        .attr("height", settings.height + settings.padding)
        .append('g') // groups svg shapes
        .attr("transform", "translate(" + ((settings.width_svg - settings.width) * 0.5 ) + ", " + (settings.padding) + " )");


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

    svg_cross_section.append("svg:path")
        .attr("id", "subtract")
        .attr("d", linefunc(0))
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("fill", "white");


    function draw_polygon(x, y, session, add_to_mkap, subtract) {
        /**
         * @param session (object) From the session class.
         * @param add_to_mkap (boolean) If true the x and y coordinates will be added to the mkappa object as a new
         *                              cross section.
         */

        // default parameter
        add_to_mkap = (typeof add_to_mkap !== "undefined") ? add_to_mkap : true;
        subtract = (typeof subtract !== "undefined") ? subtract : false;

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
        // reset
        svg_cross_section.select("#subtract").attr("d", linefunc(0));
        // draw subtractor
        if (subtract) {
            data = [];
            var pl = session.mkap.cross_section.subtractor.point_list;
            for (i in pl) {
                data.push({x: scale(pl[i].x), y: scale(-pl[i].y + max_y)}
                )
            }
            svg_cross_section.select("#subtract").attr("d", linefunc(data));
        }

        // rebar plots
        // reset the plots
        data = [];
        var arr = [0, 0, 0];
        for (i = 0; i < 50; i++) {
            data.push(arr)
        }

        // reset
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
                var ndx = std.nearest_index(session.mkap.cross_section.y_val, z);
                var d1 = z - session.mkap.cross_section.y_val[ndx.low]; var d2 = session.mkap.cross_section.y_val[ndx.high] - z;
                ndx = d1 < d2 ? ndx.low : ndx.high;

                var bound = session.mkap.cross_section.paired_xvals[ndx];
                var n_per_bndry = Math.round(session.mkap.rebar_n[i] / bound.length);
                var radius = scale(session.mkap.rebar_diam[i] / 2);

                // draw the rebar between the edges
                for (var j = 0; j < bound.length; j++) {
                    var width = bound[j][0] - bound[j][1];
                    var dx = width / (n_per_bndry + 1);
                    x = bound[j][1];
                    for (var count = 0; count < n_per_bndry; count++) {
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
        if (selector == ".mkappa_svg") {
            width = $('#pg_svg').width() * 0.7
        }
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
        var x_axis = d3.axisTop()
            .scale(d3.scaleLinear().domain([0, 10.5]).range(svg.range_x));
        var y_axis = d3.axisRight()
            .scale(d3.scaleLinear().domain([0, 10.5]).range(svg.range_y));

        svg.append('g')
        .attr("transform", "translate(" + (padding) + "," + (height - padding) + ")")
        .attr("class", "x_axis")
        .call(x_axis);

        svg.append('g')
            .attr("class", "y_axis")
            .attr("transform", "translate(" + (padding) + ", " + (-padding) + " )")
            .call(y_axis);

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
        return {
            "svg": svg,
            "padding": padding
        }
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


    
    function draw_lines(svg_struct, xstr, ystr, floats, start_origin) {

        /// <param name="svg" type="object">d3 svg object</param>
        /// <param name="xstr" type="array of strings">array from html input</param>
        /// <param name="ystr" type="array of strings">array from html input</param>
        /// <param name="floats" type="boolean">If true the x and y arrays may contain floats</param>
        /// <param name="circle" type="boolean"> if true, circles added to data points</param>

        /**
         Draws lines on a given svg canvas. Input is standard form listst, thus contains strings.
         */
        // default parameter
        floats = (typeof floats !== "undefined") ? floats : false;
        start_origin = (typeof start_origin !== "undefined") ? start_origin : true;

        var svg = svg_struct.svg;

        /**
         Math.max.apply(null, xstr) determines the max value of a string. .apply() is a method for applying arrays on the object.
         */
        var x_bound;
        var y_bound;
        if (floats) {
            x_bound = {
                max: Math.max(Math.max.apply(null, xstr), 1e-9),
                min: Math.min(Math.min.apply(null, xstr), 0)
            };

            y_bound = {
                max: Math.max(Math.max.apply(null, ystr), 1e-9),
                min: Math.min(Math.min.apply(null, ystr), 0)
            }
        }

        else {

            x_bound = det_min_max_str(xstr);
            y_bound = det_min_max_str(ystr);
        }

        var scale_x = d3.scaleLinear()
            .domain([0, x_bound.max * 1.05])  // make sure that all the values fit in the domain, thus also negative values
            .range(svg.range_x);

        var scale_y = d3.scaleLinear()
            .domain([0, y_bound.max * 1.05])  // make sure that all the values fit in the domain, thus also negative values
            .range(svg.range_y);

        var data = [];
        if (start_origin) {
            data.push({x: 0 + svg.padding, y: height - svg.padding, y_original: 0})
        }


        var loc;
        for (var i = 0; i < xstr.length; i++) {
            if (floats) {
                loc = {
                    x: scale_x(xstr[i] - x_bound.min),
                    y: -scale_y(ystr[i] - y_bound.min) + height,
                    y_original: ystr[i]
                };

                data.push(loc);
            }
            else {
                if (xstr[i].value.length > 0 && ystr[i].value.length > 0) {
                    loc = {
                        x: scale_x(parseFloat(xstr[i].value) - x_bound.min) + svg.padding,
                        y: -scale_y(parseFloat(ystr[i].value) - y_bound.min) + height ,
                        y_original: parseFloat(ystr[i].value)
                    };
                    data.push(loc)
                }
            }
        }

        svg.select("path").attr("d", linefunc(data));
        // update the axes
        var x_axis = d3.axisTop()
            .scale(d3.scaleLinear().domain([0, x_bound.max * 1.05]).range([0, svg.range_x[1]]));
        var y_axis = d3.axisRight()
            .scale(d3.scaleLinear().domain([0, y_bound.max * 1.05]).range([svg.range_y[1], svg.range_x[0]]));

        svg.selectAll("g.x_axis")
            .call(x_axis);
        svg.selectAll("g.y_axis")
            .call(y_axis)
            .attr("transform", "translate(" + (svg.padding) + ", 0 )");

        return data
    }

    var moment_kappa_diagram = function (svg_struct, x, y, session) {

        var svg = svg_struct.svg;
        var data = draw_lines(svg_struct, x, y, true, false);

        var is_equal_show_stress_strain_cross_section = function (mkap, y_value) {
            /**
             * @param mkap = object from moment_kappa class
             */
            if (std.is_close(-mkap.moment / Math.pow(10, 6), y_value, 1e-6, 1e-6)) {
                show_stress_strain_cross_section_view("#modal-svg", mkap);
                // call the strain diagram plot from here.
            }
        };

        var mkap; var j;
        svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", function (d) {
                return d.x
            })
            .attr("cy", function (d) {
                return d.y
            })
            .attr("r", 5)
            .on("click", function (d) {
                for (var i = 0; i < session.all_computed_mkap.length; i++) {
                    if (session.all_computed_mkap[i].length >= 1) {// the rebar solution has got multiple mkappa's in an array.
                        for (j = 0; j < session.all_computed_mkap[i].length; j++ ) {
                            mkap = session.all_computed_mkap[i][j];
                            is_equal_show_stress_strain_cross_section(mkap, d.y_original)
                        }
                    }
                    else {
                        mkap = session.all_computed_mkap[i];
                        is_equal_show_stress_strain_cross_section(mkap, d.y_original)
                    }
                }
            })
            .on("mouseover", function() {
                d3.select(this).style("cursor", "pointer")
            })
            .on("mouseout", function() {
                d3.select(this).style("cursor", "default")
            });

    };


    var show_stress_strain_cross_section_view = function(selector, mkap) {

        $("#myModal").modal();
        $(selector).find("svg").remove();
        $("#strain_diagram_moment").html("<strong>bending moment: $ *10<sup>6</sup></strong>".replace("$",
            -Math.round(mkap.moment / Math.pow(10, 4)) / 100) +
            "  <br> <strong>kappa: $</strong>".replace("$", Math.round(mkap.kappa * 1000) / 1000) +
            "  <br> <strong>Xu: $ mm</strong>".replace("$", Math.round(mkap.xu)))

        width = $('#pg_svg').width() * 0.5;

        var svg = d3.select(selector).append("svg")
            .attr("width", width)
            .attr("height", height)
            .append('g');

        var min_x = Math.min(mkap.strain_top, Math.min.apply(null, mkap.rebar_strain));
        var max_x = Math.max(mkap.strain_btm, Math.max.apply(null, mkap.rebar_strain));
        var min_y = mkap.cross_section.bottom;
        var max_y = mkap.cross_section.top;
        var origin_x = 0 - min_x;
        max_y -= min_y;
        max_x -= min_x; //min_x -= min_x;

        var padding = 20;
        var padding_x = 45;
        var scale_x = d3.scaleLinear().domain([0, max_x]).range([padding_x, width - padding_x]);
        var scale_y = d3.scaleLinear().domain([0, max_y]).range([padding, height - padding]);

        var z_top = 0; var z_btm = mkap.cross_section.top;

        var data = [
            {x:origin_x, y: z_top, val: ""},
            {x: mkap.strain_top - min_x, y: z_top, val: mkap.strain_top},
            {x: mkap.strain_btm - min_x, y: z_btm, val: mkap.strain_btm},
            {x: origin_x, y: z_btm, val: ""},
            {x: origin_x, y: z_top, val: ""}
        ];

        var count = 0;
        data.forEach(function (i) {
            data[count] = {x: scale_x(i.x), y: scale_y(i.y), val: i.val};
            count++;
        });

        svg.append("svg:path")
            .attr("d", linefunc(data))
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("fill", "none");


        var y;
        var x;
        var a; var b;
        var x0;
        min_x = mkap.strain_top;
        for (var i = 0; i < mkap.rebar_z.length; i++){
            y = mkap.cross_section.top - mkap.rebar_z[i];
            x = mkap.rebar_strain[i];
            x0 = mkap.rebar_strain0_plt[i];
            if (Math.abs(x0) < Math.abs(x)) {
                x0 -= min_x; x -= min_x;
                a = {x: scale_x(x0), y: scale_y(y), val: x0};
                b = {x: scale_x(x), y: scale_y(y), val: mkap.rebar_strain[i]};
                line_append(svg, [a, b], "blue", 2);
                data.push(b)
            }
        }

        svg.selectAll("text")
                .data(data)
                .enter()
                 .append("text")
            .attr('x', function(d){ return d.x})
            .attr('y', function(d){ return d.y})
            .text( function (d) {
                if (typeof  d.val == 'number') {
                    return "" + (Math.round(d.val * 100) / 100) + ""
                }
            })};



    return {
        draw_polygon: draw_polygon,
        draw_lines: draw_lines,
        add_svg: add_svg,
        input_strings_to_floats: input_strings_to_floats,
        cross_section_view: show_stress_strain_cross_section_view,
        moment_kappa: moment_kappa_diagram
    }

})();  // plt namespace

