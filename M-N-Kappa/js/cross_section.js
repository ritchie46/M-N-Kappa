'use strict'

// crsn namespace
var crsn = (function () {

function PolyGon(point_list) {
    /// <param name="point_list" type="array">Array with objects from the Point class representing the polygons coordinates</param>
    this.point_list = point_list
    this.n_value = 1000
    this.top = this.heighest_point('y').y
    this.bottom = this.lowest_point('y').y
    // all the values on the y-axis
    this.y_val = this.det_height_array()
    
    // x_val array has arrays in it representing the results per y_values increment on the y-axis. In these inner arrays are the x-values paired, representing the solid boundaries.
    this.paired_xvals = []
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
        // switch the last index to the front
        x_vals.sort(function (a, b) { return a - b });

        // x_vals contains the x-values. x1 and x2 is solid, x2 and x3 is void, x3 and x4 is solid etc.
        // Pair the solid x-values like so: [[x1, x2], [x3, x4]]

        var paired_x_vals = []
        for (var x = 0; x < x_vals.length; x++) {
            if ((x + 1) % 2 == 0) {
                paired_x_vals.push([x_vals[x - 1], x_vals[x]])
            }
        }
        this.paired_xvals.push(paired_x_vals)

        // determine the full width on this y-value by summing the dx in the paired lists.
        var width = 0
        for (var a = 0; a < paired_x_vals.length; a++) {
            width += paired_x_vals[a][1] - paired_x_vals[a][0]
        }
        this.width_array.push(Math.abs(width));
    }
};


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
    
 
    function Circle(radius) {
        var n = 100;
        var alpha0 = Math.PI * 2 / n;
        var pl = [];
        var p0 = new vector.Point(0, -radius);
        var p_set = new vector.Point(radius, radius);
        for (var i = 1; i <= n; i++) {
            var alpha = alpha0 * i
            
            var p = p0.rotate_origin(alpha);
            p = new vector.Point(p.x + p_set.x, p.y + p_set.y)
          
            pl.push(p)
        }

        PolyGon.call(this, pl);  // call super constructor
    }

    Circle.prototype = Object.create(PolyGon.prototype)
    Circle.prototype.constructor = Circle;


// return from namespace
return {
    PolyGon: PolyGon,
    Circle: Circle
}
    
})();  // crsn namespace