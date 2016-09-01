
// std namespace
var std = (function () {

    function interpolate(start_x, start_y, end_x, end_y, req_x) {
        /**
        Determinates the y-value by interpolation for the given x- and y-values.
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





    // return from namespace
    return {
        interpolate,
        convergence
    }
    
})();  // std namespace


