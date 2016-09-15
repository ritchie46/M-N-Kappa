
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
        interpolate,
        convergence,
        convergence_conditions,
        is_number
    }
    
})();  // std namespace


