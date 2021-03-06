﻿'use strict';

// vector namespace
var vector = (function () {

    var DEBUG = false;

//class
function Point(x, y) {
    this.x = x;
    this.y = y
}

Point.prototype.modulus = function () {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2))
};

Point.prototype.negative = function () {
    return new Point(-this.x, -this.y);
};

Point.prototype.rotate_origin = function (alpha) {
    var radius = this.modulus();
    var alpha0 = this.angle_orgin_x_axis();
    var new_p = new Point(0, 0);
    new_p.displace_polar(alpha + alpha0, radius);
    return new_p
};

Point.prototype.displace_polar = function (alpha, radius) {
    this.x += Math.cos(alpha) * radius;
    this.y += Math.sin(alpha) * radius
};

Point.prototype.angle_orgin_x_axis = function () {
    /**
    Determine the angle between the origin (x-axis=0, z-axis=0) and the point.
    */

    if (this.y == 0) {   // horizontal
        if (this.x > 0) {
            var alpha = 0
        }
        else {
            alpha = Math.PI;
        }
    }
    else if (this.x == 0) { // vertical
        if (this.y > 0) {
            alpha = 0.5 * Math.PI
        }
        else {
            alpha = 1.5 * Math.PI
        }
    }
    else if (this.x > 0 && this.y > 0) {  // quadrant 1
        alpha = Math.atan(Math.abs(this.y / this.x));
    }
    else if (this.x < 0 && 0 < this.y) { // quadrant 2
        alpha = 0.5 * Math.PI + Math.atan(Math.abs(this.x / this.y));
    }
    else if (this.x < 0 && this.y < 0) { // quadrant 3
        alpha = Math.PI + Math.atan(Math.abs(this.y / this.x));
    }
    else if (this.x > 0 && 0 > this.y) { // quadrant 4
        alpha = 1.5 * Math.PI + Math.atan(Math.abs(this.x / this.y));
    }
    else {
        if (DEBUG) {
            console.log("Can not determine the angle of the point with the axes origin")
        }
    }

    return alpha
};





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
        delta_y = req_p.y - start_p.y;

        factor = delta_y / d_y;
        delta_x = d_x * factor;
    }

    return new Point(start_p.x + delta_x, start_p.y + delta_y);
}


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
}

function heighest_point(point_1, point_2, axis) {
    /// Returns the heighest point
    /// <param name="axis" type="String">axis, x or y</param>


    return lowest_point(point_1.negative(), point_2.negative(), axis).negative()
}

return {
    interpolate_points: interpolate_points,
    Point: Point,
    highest_point: heighest_point,
    lowest_point: lowest_point


}

})();  // vector namespace