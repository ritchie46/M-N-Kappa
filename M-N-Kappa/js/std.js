
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
        var dx = end_x - start_x;
        var dy = end_y - start_y;

        // difference between requested points value and start points value
        var delta_x = req_x - start_x;
        var factor = delta_x / dx;
        var delta_y = factor * dy;

        return start_y + delta_y
    }

    function convergence(lhs, rhs, div) {
        /**Converting by adapting one value by a factor. The factor is determined by the ratio of the left hand side and
    the right hand side of the equation. 
    
        Factor:
    ((Left / Right) - 1) / 3 + 1
        /// <param name="rhs" type="flt">right hand side of equation</param>
        /// <param name="rhs" type="flt">left hand side of equation</param>
        /// <returns type="flt" />
        */
        // default parameter
        div = (typeof div !== "undefined") ? div: 6;

        var ratio = Math.abs(rhs) / Math.abs(lhs);
        return (ratio - 1) / div + 1
    }

    function convergence_conditions(lhs, rhs, limit_up, limit_lower) {
        // default parameter
        limit_up = (typeof limit_up !== "undefined") ? limit_up : 1.001;
        limit_lower = (typeof limit_lower !== "undefined") ? limit_lower : 0.999;

        var ratio = Math.abs(rhs) / Math.abs(lhs);
        if (limit_lower <= ratio && ratio <= limit_up) {
            return true
        }
        else {
            return false
        }
    }

    function nearest_index(arr, x) {
        /* 
        Return the nearest indexes of an array.
        */
        var lower = [];
        var higher = [];

        arr.forEach(function (val) {
            ((val < x) && lower.push(val) || (val > x) && higher.push(val))
        });
        return {"low": arr.indexOf(Math.max.apply(null, lower)), "high": arr.indexOf(Math.min.apply(null, higher))}
    }




    // return from namespace
    return {
        interpolate: interpolate,
        convergence: convergence,
        convergence_conditions: convergence_conditions,
        is_number: is_number,
        nearest_index: nearest_index
    }
    
})();  // std namespace


