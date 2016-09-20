
// std namespace
var std = (function () {

    function is_number(obj) {
        return !isNaN(parseFloat(obj))
    }

    function interpolate(start_x, start_y, end_x, end_y, req_x) {
        /**
        Determinates the y-value by interpolation for the given x- and y-values.
        Does also extrapolate
        */

        // Differencte between end point and start point
        var dx = end_x - start_x
        var dy = end_y - start_y

        // difference between requested points value and start points value
        var delta_x = req_x - start_x
        var factor = delta_x / dx
        var delta_y = factor * dy

        return start_y + delta_y
    }

    function convergence(lhs, rhs) {
        /**Converting by adapting one value by a factor. The factor is determined by the ratio of the left hand side and
    the right hand side of the equation. 
    
        Factor:
    ((Left / Right) - 1) / 3 + 1
        /// <param name="rhs" type="flt">right hand side of equation</param>
        /// <param name="rhs" type="flt">left hand side of equation</param>
        /// <returns type="flt" />
        */
 

        var ratio = Math.abs(rhs) / Math.abs(lhs)
        return (ratio - 1) / 3 + 1
    }

    function convergence_conditions(lhs, rhs, limit_up, limit_lower) {
        // default parameter
        var limit_up = (typeof limit_up !== "undefined") ? limit_up : 1.001;
        var limit_lower = (typeof limit_lower !== "undefined") ? limit_lower : 0.999;

        var ratio = Math.abs(rhs) / Math.abs(lhs)
        if (limit_lower <= ratio && ratio <= limit_up) {
            return true
        }
        else {
            return false
        }
    }





    // return from namespace
    return {
        interpolate: interpolate,
        convergence: convergence,
        convergence_conditions: convergence_conditions,
        is_number: is_number
    }
    
})();  // std namespace



'use strict'

// vector namespace
var vector = (function () {

//class
function Point(x, y) {
    this.x = x
    this.y = y
}

Point.prototype.modulus = function () {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2))
};

Point.prototype.negative = function () {
    return new Point(-this.x, -this.y)
}
//end class


function interpolate_points(start_p, end_p, req_p) {
    /// <param name="start_p" type="Object from Point class">reference value that should be interpolated between</param>
    /// <param name="end_p" type="Object from Point class">reference value that should be interpolated between</param>
    /// <param name="req_p" type="Object from Point class">Value that is requested. x or y of the object should be null, on the request time.</param>

    // Differencte between end point and start point
    var d_x = end_p.x - start_p.x;
    var d_y = end_p.y - start_p.y;

    if (req_p.y == null) {
        // difference between requested points value and start points value
        var delta_x = req_p.x - start_p.x;

        var factor = delta_x / d_x;
        var delta_y = d_y * factor;
    }
    else if (req_p.x == null) {
        var delta_y = req_p.y - start_p.y;

        var factor = delta_y / d_y;
        var delta_x = d_x * factor;
    }

    return new Point(start_p.x + delta_x, start_p.y + delta_y);
};


function lowest_point(point_1, point_2, axis) {
    /// Returns the lowest point
    /// <param name="axis" type="String">axis, x or y</param>
    if (axis == 'x') {
        if (point_1.x < point_2.x) {
            return point_1;
        }
        else if (point_2.x < point_1.x) {
            return point_2;
        }
        else {
            console.log("points x values are identical")
        }
    }
    else if (axis == 'y') {
        if (point_1.y < point_2.y) {
            return point_1;
        }
        else if (point_2.y < point_1.y) {
            return point_2;
        }
        else {
            return new Point(null, point_1.y)
        }
    }

    console.log("cannot verify given axis")
};

function heighest_point(point_1, point_2, axis) {
    /// Returns the heighest point
    /// <param name="axis" type="String">axis, x or y</param>


    return lowest_point(point_1.negative(), point_2.negative(), axis).negative()
};

return {
    interpolate_points: interpolate_points,
    Point: Point,
    heighest_point: heighest_point,
    lowest_point: lowest_point


}

})();  // vector namespace
'use strict'

// crsn namespace
var crsn = (function () {

function PolyGon(point_list) {
    /// <param name="point_list" type="array">Array with objects from the Point class representing the polygons coordinates</param>
    this.point_list = point_list
    this.n_value = 1000
    this.top = this.heighest_point('y').y
    this.bottom = this.lowest_point('y').y
    this.y_val = this.det_height_array()
    
    // x_val array has arrays in it representing the results per y_values increment on the y-axis. In these inner arrays are the x-values paired, representing the solid boundaries.
    this.x_val_array = []
    this.width_array = []

    this.return_x_on_axis()
};

PolyGon.prototype.det_height_array = function () {
    return linspace(0, this.top, this.n_value)
};

PolyGon.prototype.lowest_point = function (axis) {
    /// Find the lowest point on a give axis. 
    /// <param name="axis" type="String">axis, x or y</param>

    var low = this.point_list[0]
    
    for (var i = 1; i < this.point_list.length; i++) {
        low = vector.lowest_point(low, this.point_list[i], axis)
    }
    return low
}

PolyGon.prototype.heighest_point = function (axis) {
    var height = this.point_list[0]

    for (var i = 1; i < this.point_list.length; i++) {
        height = vector.heighest_point(height, this.point_list[i], axis)
    }
    return height
}


PolyGon.prototype.return_x_on_axis = function () {
    /**
    Method for defining the x values of the sections part that hit the polygon sides.
    The y axis is incremented. And with each step the x-axis on this y-value are determined.
    Two x-values means a closed cross section on that y-value. Three or more x-values indicate that
    there is a void in the cross section.


    x1  x2  x3  x4
    _____   _____            y
    |   |   |   |           |
    |   |   |   |           |
    |   |___|   |           |          x
    |___________|           ---------->

     */

    for (var i = 0; i < this.y_val.length; i++) {
        /** increment a value on the y-axis and search the coordinates of the polygon for crossing edges.
         An edge crosses the x-axis on this y-values height if one coordinate is above and the subsequent/previous
        coordinate is underneath the y-value.
        */

        var y = this.y_val[i] - this.y_val[1] * 0.5

        // the x_values that intersect the polygon on this y increment.
        var x_vals = []


        // iterate through the coordinates
        for (var a = 0; a < this.point_list.length - 1; a++) {


            // y-value is between point at index a and point at index a + 1
            if ((this.point_list[a].y >= y) == !(this.point_list[a + 1].y >= y)) {

                var interpolated_point = vector.interpolate_points(this.point_list[a], this.point_list[a + 1], new vector.Point(null, y));
                x_vals.push(interpolated_point.x)
            };
            
        };

        // x_vals contains the x-values. x1 and x2 is solid, x2 and x3 is void, x3 and x4 is solid etc.
        // Pair the solid x-values like so: [[x1, x2], [x3, x4]]

        var paired_x_vals = []
        for (var x = 0; x < x_vals.length; x++) {
            if ((x + 1) % 2 == 0) {
                paired_x_vals.push([x_vals[x - 1], x_vals[x]])
            }
        }
        this.x_val_array.push(paired_x_vals)
        
        // determine the full width on this y-value by summing the dx in the paired lists.
        var width = 0
        for (var a = 0; a < paired_x_vals.length; a++) {

            width += paired_x_vals[a][1] - paired_x_vals[a][0]
        }
        this.width_array.push(Math.abs(width));
    }
    
};

function linspace (a, b, n) {
    if (typeof n === 'undefined') n = Math.max(Math.round(b - a) + 1, 1)
    if (n < 2) {
        return n === 1 ? [a] : []
    }
    var i, ret = Array(n)
    n--
    for (i = n; i >= 0; i--) {
        ret[i] = (i * b + (n - i) * a) / n
    }
    return ret
}

PolyGon.prototype.area = function () {
    var dy = this.y_val[1] 
    var area = 0
    for (var i = 0; i < this.y_val.length; i++) {
        area += dy * this.width_array[i]
    }
    area = Math.round(area) 
    return Math.abs(area)
}

// end class

// return from namespace
return {
    PolyGon: PolyGon
}
    
})();  // crsn namespace
'use strict'

var DEBUG = false

// mkap namespace
var mkap = (function () {

    //class
    function MomentKappa(cross_section, compressive_diagram, tensile_diagram) {
        this.cross_section = cross_section
        this.compressive_diagram = compressive_diagram
        this.tensile_diagram = tensile_diagram
        // sum of the forces in the cross section
        this.force_tensile = 0
        this.force_compression = 0
        this.normal_force = 0

        /** 
        rebar
        */
        this.rebar_As = []
        // distance rebar from the bottom of the master cross section
        this.rebar_z = []
        // objects from the StressStrain class
        this.rebar_diagram = []
    
        /**
        results
        */
        this.rebar_force = []
        this.rebar_strain = []
        this.stress = []
        this.moment = null
        this.kappa = null
        this.strain_top = null
        this.strain_btm = null
        this.zero_line = null  // xu is height - zero line

    }

    MomentKappa.prototype.det_force_distribution = function (strain_top, strain_btm) {
        this.force_compression = 0
        this.force_tensile = 0 + this.normal_force
        this.stress = []
        this.rebar_strain = []
        this.strain_top = strain_top
        this.strain_btm = strain_btm

        // height of the sections
        var dh = this.cross_section.y_val[1];

        //cross section
        var crs_btm = this.cross_section.y_val[0]
        var crs_top = this.cross_section.y_val[this.cross_section.y_val.length - 1]

        // iterate over the y-axis of the master cross section and determine the stresses.
        // y-axis starts at bottom.
        for (var i = 0; i < this.cross_section.y_val.length; i++) {

            // interpolate the strain at this y-value
            var strain_y = std.interpolate(crs_btm, strain_btm,
                crs_top, strain_top, this.cross_section.y_val[i])
        

            // Send the strain value as parameter in the stress strain diagram
            var stress
            if (strain_y < 0) {
                stress = -this.compressive_diagram.det_stress(Math.abs(strain_y))
                this.force_compression -= stress * this.cross_section.width_array[i] * dh

            }

            else {
                stress = this.tensile_diagram.det_stress(strain_y)
                this.force_tensile += stress* this.cross_section.width_array[i] * dh
            }
            this.stress.push(stress)
        }

    
        // determine rebar forces
        this.rebar_force = []
        for (var i = 0; i < this.rebar_As.length; i++) {
            var strain = std.interpolate(crs_btm, strain_btm, crs_top, strain_top,
                this.rebar_z[i])
            this.rebar_strain.push(strain)

            var stress = this.rebar_diagram[i].det_stress(Math.abs(strain));

            // absolute value
            var force = this.rebar_As[i] * stress
        
            var stress_reduct
            if (strain < 0) {
                this.force_compression += force
                this.rebar_force.push(-force)

                // reduce rebar area from master element
                stress_reduct = this.compressive_diagram.det_stress(Math.abs(strain))
                this.force_compression -= this.rebar_As[i] * stress_reduct


            }
            else {
                this.force_tensile += force
                this.rebar_force.push(force)

                // reduce rebar area from master element
                stress_reduct = this.tensile_diagram.det_stress(strain)
                this.force_tensile -= this.rebar_As[i] * stress_reduct
            }
        }

    }

    MomentKappa.prototype.solver = function (strain_top, strain, print) {
        /**
        Return the .det_stress method several times and adapt the input untill the convergence criteria is met.
    
        /// <param name="strain_top" type="bool">constant strain</param>
        If the strain_top == true, the strain at the top will remain constant and the strain at the bottom will be iterated
        over. If false vice versa for strain_bottom.
        */
        // default parameter
        var strain_top = (typeof strain_top !== "undefined") ? strain_top : true;
        var print = (typeof print !== "undefined") ? print : true;

        // first iteration
        var btm_str = strain
        var top_str = -strain

        this.det_force_distribution(top_str, btm_str)    
        var count = 0

        if (strain_top) {  // top strain remains constant
            // iterate untill the convergence criteria is met
            while (1) {
                if (std.convergence_conditions(this.force_compression, this.force_tensile)) {
                    if (print) {
                        if (window.DEBUG) {
                            console.log("convergence after %s iterations".replace("%s", count))
                        }
                    }
                    break
                }
                
                // if the rebar is above the zero line, there will sometimes be no tensile force
                var low = Math.min.apply(null, this.rebar_z);
                for (var i = 0; i < this.rebar_As.length; i++) {
                    if (this.rebar_z[i] == low) {
                        var str_rbr = this.rebar_strain[i]
                        var rbr_index = i
                        }
                    };


                if (this.force_tensile === 0 && str_rbr <= 0) {
                    // Extrapolate the from the first significant rebar strain point, to the bottom strain.
                    // Needed when the rebar is above the neutral line.
                    var btm_str = std.interpolate(this.cross_section.top, top_str, low, this.rebar_diagram[rbr_index].strain[1], this.cross_section.bottom)
                         
                }
                else if (isNaN(this.force_tensile)) {
                    var btm_str = std.interpolate(this.cross_section.top, top_str, low, this.rebar_diagram[rbr_index].strain[1], this.cross_section.bottom)
                }
                else {
                    var factor = std.convergence(this.force_tensile, this.force_compression)
                    var btm_str = btm_str * factor
                }
                
                this.det_force_distribution(top_str, btm_str)
                if (count > 100) {
                    if (print) {
                        if (window.DEBUG) {
                            console.log("no convergence found after %s iterations".replace("%s", count))
                        }
                    }
                    break
                }
                count += 1
            }
        }
        else { // bottom strain remains constant
            // iterate untill the convergence criteria is met
            while (1) {
                if (std.convergence_conditions(this.force_compression, this.force_tensile)) {
                    if (print) {
                        if (window.DEBUG) {
                            console.log("convergence after %s iterations".replace("%s", count))
                        }
                    }
                    break
                }

                var factor = std.convergence(this.force_compression, this.force_tensile)
                var top_str = top_str * factor
     
                this.det_force_distribution(top_str, btm_str)

                if (count > 100) {
                    if (print) {
                        if (window.DEBUG) {
                            console.log("no convergence found after %s iterations".replace("%s", count))
                        }
                    }
                    break
                }
                count += 1
            }
        }

        this.zero_line = std.interpolate(this.strain_top, this.cross_section.top, this.strain_btm,
            this.cross_section.bottom, 0);
    }

    MomentKappa.prototype.det_m_kappa = function () {
        /**
        Determines the moment and kappa values.
    
        For each sections center of gravity the moment around the origin is determined.
    
    
        ______     <---- - F compression 
        |     |         
        |     |                           |y
        |     |                           |
        |_____|    ----> + F tensile      |0____x
        
        */

        // center of gravity offset of a section
        this.kappa = (Math.abs(this.strain_top) + Math.abs(this.strain_btm)) / (this.cross_section.top - this.cross_section.bottom)  //this.strain_btm / (this.zero_line - this.cross_section.bottom)
        this.moment = 0
        var offset = this.cross_section.y_val[1] * 0.5

        // height of the sections
        var dh = this.cross_section.y_val[1];

        for (var i = 0; i < this.cross_section.y_val.length; i++) {
            var arm = this.cross_section.y_val[i] + offset
            var force = this.stress[i] * this.cross_section.width_array[i] * dh
       
            this.moment += arm * force;
        }

        // N normal force share
        this.moment += this.normal_force * (this.cross_section.top - this.cross_section.bottom) * 0.5

        // rebar share
        for (var i = 0; i < this.rebar_As.length; i++) {
            this.moment += this.rebar_force[i] * this.rebar_z[i]

            // reduction of master cross section at place of rebar
            if (this.rebar_force[i] > 0) {
                var stress_reduct = this.tensile_diagram.det_stress(this.rebar_strain[i])
                this.moment -= stress_reduct * this.rebar_As[i] * this.rebar_z[i]
            }
            else {
                var stress_reduct = this.compressive_diagram.det_stress(Math.abs(this.rebar_strain[i]))
                this.moment -= stress_reduct * this.rebar_As[i] * this.rebar_z[i]
            }
        }

    }





    //end class


    //class
    function StressStrain(strain, stress) {
        /**
        Class for creating stress strain diagrams.
        */
        /// <param name="strain" type="array">Contains strain values corresponding with this.stress</param>
        /// <param name="stress" type="array">Contains stress values corresponding with this.strain</param>

        this.strain = strain
        this.stress = stress
    }


    StressStrain.prototype.det_stress = function (strain) {
        /// <param name="strain" type="flt">strain for wich the stress needs to be determined</param>

        // iterate through the strain array untill iterated value exceeds the requested strain.
        // At that the point the two values will interpolated.
        for (var i = 0; i < this.strain.length; i++) {
            if (strain > this.strain[this.strain.length - 1]) {
                return 0;
            }
            else if (this.strain[i] == strain) {
                return this.stress[i]
            }
            else if (this.strain[i] > strain) {
                return std.interpolate(this.strain[i - 1], this.stress[i - 1],
                    this.strain[i], this.stress[i], strain);
            };

        };
    }
    //end class


    /**
    var concrete_comp = new StressStrain([0, 1.75 * 0.001, 3.5 * 0.001], [0, 20, 20])
    var concrete_tensile = new StressStrain([0], [0])  // fictional for testing

    var run = new MomentKappa(crsn.cs, concrete_comp, concrete_tensile)
    run.rebar_As.push(800)
    run.rebar_z.push(20)
    run.rebar_diagram.push(new StressStrain([0, 2.175 * 0.001, 10], [0, 435, 435]))


    run.solver(true, 3.5e-3)
    run.det_m_kappa()
    console.log(run.moment / 1e6)
    console.log(run.kappa);
    */

    return {    MomentKappa: MomentKappa,
                StressStrain: StressStrain
    }

})();  // mkap namespace
"use strict"


// plt namespace
var plt = (function () {

    var settings = {
        width: 350,
        height: 350,
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
        
        if (typeof x[0] === "object") {  // x and y are probably from input field.
            x = input_strings_to_floats(x)
            y = input_strings_to_floats(y)
        }
        // else x and y are probably an array with floats.

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
        var loc0 = { x: scale(-min_x), y: -scale(-min_y) + settings.height }
        data.push(loc0)

        //location for the current sessions polygon
        var loc_list = []
        var loc_pg0 = new vector.Point(-min_x, -min_y)
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
        add_svg: add_svg
    }

})();  // plt namespace


/**
Note to self:
    The plotter also adds the objects uses for calculations to the sessions
*/

"use strict"
var DEBUG = false

$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();

    // General collapse panel logic
    $(".collapse_glyph").click(function () {
        $(this).closest(".panel").children(".collapse").toggle()
        $(this).toggleClass('glyphicon-triangle-top glyphicon-triangle-bottom')
    });

    // General add row logic
    function add_row(self) {
        var $row = self.closest(".panel-body").find(".custom_row").last();
        var $clone = $row.clone()
        $clone.removeClass('hidden')
        $row.after($clone);
    }
        
    $(".add_row").click(function () {
        add_row($(this))
    })


    // General remove panel row logic
    function remove_row(self) {
        self.closest('.custom_row').remove()
    }

    $(".panel").on("click", ".remove_row", function () {
        remove_row($(this))
    })


    //Call polygon draw function if row is removed
    $('#pg_body').on("click", ".remove_row", function () {
        $(this).closest('.custom_row').remove()
        trigger_polygon();
    })

    //Call polygon draw function if row is removed
    $('#pg_body').on("change", "input", function () {
        trigger_polygon();
    })


    // create polygon
    function trigger_polygon() {
        // plotter draws polygon and returns the polygons Points (Point class) in a list.
        
        if ($("#cross_section_type").val() == "custom") {
            var x = document.getElementsByClassName("xval")
            var y = document.getElementsByClassName("yval")
            var point_list = plt.draw_polygon(x, y);
            // add polygon to session
            session.mkap.cross_section = new crsn.PolyGon(point_list)
            //session.mkap.cross_section.return_x_on_axis()
            $("#area").html("Area: " + session.mkap.cross_section.area())
        }
        else if ($("#cross_section_type").val() == "rectangle") {
            var width = parseFloat(document.getElementById("width").value);
            var height = parseFloat(document.getElementById("height").value);
            var x = [width, width, 0];
            var y = [0, height, height];
            if (width > 0 && height > 0) {
                var point_list = plt.draw_polygon(x, y);
                // add polygon to session
                session.mkap.cross_section = new crsn.PolyGon(point_list)
                //session.mkap.cross_section.return_x_on_axis()
                $("#area").html("Area: " + session.mkap.cross_section.area())
            }
        };

        
    }

    
    // compression stress strain
    var trigger_comp_strain = function () {
        var strain = document.getElementsByClassName("comp_strain")
        var stress = document.getElementsByClassName("comp_stress")
        plt.draw_lines(plt.svg_comp, strain, stress)

        strain = extract_floats(strain)
        stress = extract_floats(stress)
        strain.unshift(0)
        stress.unshift(0)
    
        // reduce with the material factor
        for (var i = 0; i < stress.length; i++) {
            stress[i] /= parseFloat($("#comp_material_factor").val())
        }
        session.mkap.compressive_diagram = new mkap.StressStrain(strain, stress)
    }


    $('#comp_curve_body').on('change', 'input', function () {
        $("#compression_material").val('custom')
        trigger_comp_strain();
    });

    $('#comp_curve_body').on('click', '.remove_row', function () {
        $("#compression_material").val('custom')
        $(this).closest('.custom_row').remove()
        trigger_comp_strain();
    });


    // tensile stress strain
    var trigger_tens_strain = function () {
        var strain = document.getElementsByClassName("tens_strain")
        var stress = document.getElementsByClassName("tens_stress")

        // remove old svg
        $('#tens_strain_svg_div').find('svg').remove()

        var svg = plt.add_svg("#tens_strain_svg_div")
        plt.draw_lines(svg, strain, stress)

        strain = extract_floats(strain)
        stress = extract_floats(stress)
        strain.unshift(0)
        stress.unshift(0)
        session.mkap.tensile_diagram = new mkap.StressStrain(strain, stress)
    }

    $('#tens_curve_body').on('change', 'input', function () {
        trigger_tens_strain();
    });

    $('#tens_curve_body').on('click', '.remove_row', function () {
        $(this).closest('.custom_row').remove()
        trigger_tens_strain();
    });

    /** rebar stress strain
    There can be more than one rebar stress strain diagram
    */

    var trigger_rebar_strain = function (parent) {
        // find the panel that send the request.
        var id = parent.attr('id');
        var strain = $('#' + id).find('.rebar_strain');
        var stress = $('#' + id).find('.rebar_stress');
        
        // remove old svg
        $('#' + id).find('svg').remove()
        // add new svg
        
        var svg = plt.add_svg('#rebar_svg_' + id[id.length - 1])
        plt.draw_lines(svg, strain, stress)

        strain = extract_floats(strain)
        stress = extract_floats(stress)
        strain.unshift(0)
        stress.unshift(0)

        var fact = parseFloat($(parent).find(".rebar_material_factor").val())
        // reduce with the material factor
        for (var i = 0; i < stress.length; i++) {
            stress[i] /= fact
            strain[i] /= fact
        }
        var rebar_number = id[id.length - 1]
        session.rebar_diagrams[rebar_number - 1] = new mkap.StressStrain(strain, stress)
    }

    $('.rebar_curve').on('click', '.remove_row', function () {
        var parent = $(this).closest('.rebar_curve');
        $(this).closest('.custom_row').remove();
        trigger_rebar_strain(parent);
        $(parent).find(".rebar_material").val("custom")
    })

    $('.rebar_curve').on('change', 'input', function () {
        var parent = $(this).closest('.rebar_curve')
        trigger_rebar_strain(parent);
        $(parent).find(".rebar_material").val("custom")
    });


    // rebar area
    function trigger_rebar_input() {
        // reset
        session.mkap.rebar_As = []
        session.mkap.rebar_z = []
        session.mkap.rebar_diagram = []

        var As = document.getElementsByClassName("rebar_As")
        var d = document.getElementsByClassName("rebar_d")
        var rebar_diagram = document.getElementsByClassName("rebar_material_select")
        $("#option_rebar_results").empty()

        As = extract_floats(As)
        d = extract_floats(d)
        
        var height = session.mkap.cross_section.top
        
        for (var i = 0; i < As.length; i++) {
            var z = height - d[i]
            
            // The corresponding rebar material
            var no_of_diagram = rebar_diagram[i].value[rebar_diagram[i].value.length - 1]

            // add the rebar in the correct order to the mkap
            session.mkap.rebar_As[i] = As[i]
            session.mkap.rebar_z[i] = z
            session.mkap.rebar_diagram[i] = session.rebar_diagrams[no_of_diagram - 1]

            // set the rebar options in the results table
            $("#option_rebar_results").append("<option>rebar row #%s</option>".replace("%s", i + 1))
        }
    }
    
    $('.rebar_input').on('click', '.remove_row', function () {
        $(this).closest('.custom_row').remove();
        trigger_rebar_input();
    })

    $('.rebar_input').on('change', 'input', function () {
        trigger_rebar_input();
    });

    $('.rebar_input').on('click', '.add_row', function () {
        trigger_rebar_input();
    });


    //-- Set rebar result table

    function update_rebar_results(index) {

        // tensile results table
        if ($(".results_table_rebar_diagram").length > 1) {
            $(".results_table_rebar_diagram").last().remove()
        }

        var table = $(".results_table_rebar_diagram").first().clone().removeClass("hidden")
        $("#result_table_div_rbr").append(table)

        for (var i = 0; i < session.moment_rebar[index].length; i++) {
            $(".results_table_row_rbr").last().find(".signifcant_moment").html(Math.round(session.moment_rebar[index][i] / 1e4) / 100)
            $(".results_table_row_rbr").last().find(".signifcant_row_no").last().html(i + 1)
            $(".results_table_row_rbr").last().find(".signifcant_kappa").last().html(Math.round(session.kappa_rebar[index][i] * 100) / 100)
            $(".results_table_row_rbr").first().clone().insertAfter($(".results_table_row_rbr").last())
        }
    }
    
    $("#result_table_div_rbr").on("change", "#option_rebar_results", function () {
        var index = parseInt($("#option_rebar_results").val().replace("rebar row #", "")) - 1
        update_rebar_results(index)
    })



    var calculate_mkappa = function () {
        trigger_rebar_input()
        trigger_comp_strain()
        trigger_comp_strain()

        // remove old svg
        $('.mkappa_svg').find('svg').remove()
        // add new svg
        var svg = plt.add_svg('.mkappa_svg')


        var sol = session.calculate_significant_points()
        var moment = sol.moment
        var kappa = sol.kappa

        moment.unshift(0)
        kappa.unshift(0)

        plt.draw_lines(svg, kappa, moment, true)

        var html_moment = Math.round(Math.max.apply(null, moment) / Math.pow(10, 6) * 100) / 100
        $("#MRd").removeClass("hidden")
        $("#MRd").html("Maximum moment: %s * 10<sup>6</sup>".replace("%s", html_moment))

        //-- display results in result tables --//

        // compression results table
        if ($(".results_table_compression_diagram").length > 1) {
            $(".results_table_compression_diagram").last().remove()
        }

        var table = $(".results_table_compression_diagram").first().clone().removeClass("hidden")
        $("#result_table_div_comp").append(table)

        for (var i = 0; i < session.moment_compression.length; i++) {
            $(".results_table_row_comp").last().find(".signifcant_moment").html(Math.round(session.moment_compression[i] / 1e4) / 100)
            $(".results_table_row_comp").last().find(".signifcant_row_no").last().html(i + 1)
            $(".results_table_row_comp").last().find(".signifcant_kappa").last().html(Math.round(session.kappa_compression[i] * 100) / 100)
            $(".results_table_row_comp").first().clone().insertAfter($(".results_table_row_comp").last())
        }

        // tensile results table
        if ($(".results_table_tensile_diagram").length > 1) {
            $(".results_table_tensile_diagram").last().remove()
        }

        var table = $(".results_table_tensile_diagram").first().clone().removeClass("hidden")
        $("#result_table_div_tens").append(table)

        for (var i = 0; i < session.moment_tensile.length; i++) {
            $(".results_table_row_tens").last().find(".signifcant_moment").html(Math.round(session.moment_tensile[i] / 1e4) / 100)
            $(".results_table_row_tens").last().find(".signifcant_row_no").last().html(i + 1)
            $(".results_table_row_tens").last().find(".signifcant_kappa").last().html(Math.round(session.kappa_tensile[i] * 100) / 100)
            $(".results_table_row_tens").first().clone().insertAfter($(".results_table_row_tens").last())
        }

        // rebar results table
        update_rebar_results(0)
    }

    $('#calculate').click(function () {
        calculate_mkappa()
    });


    // Material library

    // compression material
    $("#compression_material").on("change", function () {
        if (this.value !== "custom") {
            // get the value between 'C' and '/' in for instance C20/25
            var end_index = this.value.indexOf('/')
            var fc = this.value.substring(1, end_index)

            // 3 input rows are needed. Two for the material. 1 hidden.
            var n = document.getElementsByClassName("comp_strain").length;

            for (n; n < 3; n++) {
                add_row($("#compression_add_row"));

            };
            for (n; n > 3; n--) {
                var row = $("#comp_curve_body").children(".custom_row").last();
                remove_row(row);
            }
            $("#comp_curve_body").find(".comp_strain")[1].value = 1.75
            $("#comp_curve_body").find(".comp_strain")[2].value = 3.5
            $("#comp_curve_body").find(".comp_stress")[1].value = fc
            $("#comp_curve_body").find(".comp_stress")[2].value = fc
            trigger_comp_strain()
        }
    })
   
    // rebar material
    $(".rebar_material").change(function () {
        if (this.value !== "custom") {
            // get the value between after 'B' in for instance 'B500'
            
            var fy = this.value.substring(1, 4)

            // 3 input rows are needed. Two for the material. 1 hidden.
            parent = $(this).closest(".rebar_curve");
            var n = $(parent).find(".rebar_strain").length;
          
     
            for (n; n < 3; n++) {
                add_row($(parent).find(".add_row"));

            };
            for (n; n > 3; n--) {
                var row = $(parent).children(".custom_row").last();
                remove_row(row);
            }
            $(parent).find(".rebar_strain")[1].value = parseFloat(fy) / 200
            $(parent).find(".rebar_strain")[2].value = 50
            $(parent).find(".rebar_stress")[1].value = fy
            $(parent).find(".rebar_stress")[2].value = fy
            trigger_rebar_strain(parent)
        }
    })
    

    // cross-section type
    $("#cross_section_type").change(function () {
        if (this.value == "rectangle") {
            $("#polygon_rows").addClass("hidden")
            $("#rectangle_rows").removeClass("hidden")
        }
        if (this.value == "custom") {
            $("#polygon_rows").removeClass("hidden")
            $("#rectangle_rows").addClass("hidden")
        }
    })



    // setting up the presettings
    $("#compression_material").val("C20/25")
    $("#compression_material").trigger("change")
    $(".rebar_material").val("B500")
    $(".rebar_material").trigger("change")
    $("#cross_section_type").val("rectangle")
    $("#cross_section_type").trigger("change")
    $("#width").val(1000)
    $("#height").val(200)
    trigger_polygon()



    // Logic for collapsing the input divs
    $("#collapse_polygon").collapse("show");
    $("#comp_curve").find(".panel-collapse").collapse("show");
    $("#rebar_input").find(".panel-collapse").collapse("show");
    $("#rebar_curve_1").closest(".panel-collapse").collapse("show");

       

});


//class
function Session() {
    this.mkap = null
    // significant points compression diagram
    this.moment_compression = []
    this.kappa_compression = []
    this.moment_tensile = []
    this.kappa_tensile = []
    // the diagrams in order
    this.rebar_diagrams = []
    this.moment_rebar = []
    this.kappa_rebar = []
    
}


Session.prototype.calculate_significant_points = function () {

    /** 
    determines the moment and kappa points for the given significant strain points in the compression stress strain diagram
    */
    var moment = []
    var kappa = []
    this.moment_compression = []
    this.kappa_compression = []
    this.moment_tensile = []
    this.kappa_tensile = []
    // in these are array representing the significant points of different layers of rebar
    this.moment_rebar = []
    this.kappa_rebar = []
    
    // Solve for significant points in compression diagram
    for (var i = 1; i < this.mkap.compressive_diagram.strain.length; i++) {
        var strain = this.mkap.compressive_diagram.strain[i]

        this.mkap.solver(true, strain)
        this.mkap.det_m_kappa()

        if (std.is_number(this.mkap.moment) && std.is_number(this.mkap.kappa)) {
            moment.push(Math.abs(this.mkap.moment))
            kappa.push(Math.abs(this.mkap.kappa))
            this.moment_compression.push(Math.abs(this.mkap.moment))
            this.kappa_compression.push(Math.abs(this.mkap.kappa))
        }
    }
    
    
    // Solve for significant points in tensile diagram
    for (var i = 1; i < this.mkap.tensile_diagram.strain.length; i++) {
        var strain = this.mkap.tensile_diagram.strain[i]
        
        this.mkap.solver(false, strain)
        this.mkap.det_m_kappa()

        if (std.is_number(this.mkap.moment) && std.is_number(this.mkap.kappa)) {
            moment.push(Math.abs(this.mkap.moment))
            kappa.push(Math.abs(this.mkap.kappa))
            this.moment_tensile.push(Math.abs(this.mkap.moment))
            this.kappa_tensile.push(Math.abs(this.mkap.kappa))
        }
    }

    
    // Solve for significant in the rebars material diagram. 
    //Loop for the variable number of rebar inputs
    for (var i = 0; i < this.mkap.rebar_As.length; i++) {
        this.moment_rebar[i] = []
        this.kappa_rebar[i] = []

        // Loop for the siginificant points in the rebars material stress strain diagram.
        for (var a = 1; a < this.mkap.rebar_diagram[i].strain.length; a++) {
            var sign_strain = this.mkap.rebar_diagram[i].strain[a] // siginificant point

            top_str = sign_strain * 0.5  // start the iteration at the half of the rebar strain.
            // looper rebar
            this.mkap.solver(true, top_str, false)

            // iterate untill the convergence criteria is met
            var count = 0
            while (1) {
                if (std.convergence_conditions(sign_strain, this.mkap.rebar_strain[i], 1.01, 0.99)) {
                    if (window.DEBUG) {
                        console.log("rebar convergence after %s iterations".replace("%s", count))
                    }
                    this.mkap.det_m_kappa()
                    if (std.is_number(this.mkap.moment) && std.is_number(this.mkap.kappa)
                        && this.mkap.strain_top >= -this.mkap.compressive_diagram.strain[this.mkap.compressive_diagram.strain.length - 1]) {     
                        moment.push(Math.abs(this.mkap.moment))
                        kappa.push(Math.abs(this.mkap.kappa))

                        this.moment_rebar[i].push(Math.abs(this.mkap.moment))
                        this.kappa_rebar[i].push(Math.abs(this.mkap.kappa))
                        
                    }
                    break
                }

                var factor = std.convergence(this.mkap.rebar_strain[i], sign_strain)
                var top_str = top_str * factor
                
                this.mkap.solver(true, top_str, false)

                if (count > 50) {
                    if (window.DEBUG) {
                        console.log("no rebar convergence found after %s iterations".replace("%s", count))
                    }
                    break
                }
                count += 1
            }
  
        }

    }


    // sort the arrays on inclining kappa.
    var a = []
    
    // first combine them in array a
    for (var i in kappa) {
        a.push(
            { m: moment[i], k: kappa[i] }
            )
    };

    // sort them
    a.sort(function (b, c) {
        return ((b.k < c.k) ? -1 : ((b.k < c.k) ? 0 : 1));
    });

    for (var i = 0; i < a.length; i++) {
        moment[i] = a[i].m
        kappa[i] = a[i].k
    }

    if (DEBUG) {
        console.log(moment)
        console.log(kappa)
    }
  
    return {
        moment: moment,
        kappa: kappa
    }



}
// end class

var session = new Session()
session.mkap = new mkap.MomentKappa()
session.mkap.tensile_diagram = new mkap.StressStrain([0], [0])


var extract_floats = function (arr) {
    /// <param name="arr" type="array">DOM input fields array</param>
    /**
    Casts the strings to floats and pops invalid data from the array.
    */

    var data = []

    for (var i = 0; i < arr.length; i++) {
        if (arr[i].value.length > 0) { // input field is filled
            var val = parseFloat(arr[i].value)
            data.push(val)
        }
    }
    return data
}