// std namespace
var std = (function () {

    function is_close(a, b, rel_tol, abs_tol) {

        var diff = Math.abs(a - b);
        if (diff <= abs_tol) {
            return true
        }
        if (Math.abs(a) < Math.abs(b)) {
            return diff <= Math.abs(b) * rel_tol
        }
        else {
            return diff <= Math.abs(a) * rel_tol
        }
    }


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
         * the right hand side of the equation.
         *
         * Factor: ((Left / Right) - 1) / div + 1
         *
         * @param rhs: {float} Value
         * @param lhs: {float} Value
         *
         * Convergence = lhs *= factor
        */
        // default parameter
        div = (typeof div !== "undefined") ? div: 3;

        var ratio = Math.abs(rhs) / Math.abs(lhs);
        return (ratio - 1) / div + 1
    }

    function convergence_conditions(lhs, rhs, limit_up, limit_lower) {
        // default parameter
        limit_up = (typeof limit_up !== "undefined") ? limit_up : 1.001;
        limit_lower = (typeof limit_lower !== "undefined") ? limit_lower : 0.999;

        var ratio = Math.abs(rhs) / Math.abs(lhs);
        return (limit_lower <= ratio && ratio <= limit_up)
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

    function linspace (a, b, n) {
        if (typeof n === 'undefined') n = Math.max(Math.round(b - a) + 1, 1);
        if (n < 2) {
            return n === 1 ? [a] : []
        }
        var i, ret = Array(n);
        n--;
        for (i = n; i >= 0; i--) {
            ret[i] = (i * b + (n - i) * a) / n
        }
        return ret
    }

    function closest(array, x) {
        var min,
            chosen = 0;
        for (var i in array) {
            min = Math.abs(array[chosen] - x);
            if (Math.abs(array[i] - x) < min) {
                chosen = i;
            }
        }
        return chosen;
    }




    // return from namespace
    return {
        closest: closest,
        interpolate: interpolate,
        convergence: convergence,
        convergence_conditions: convergence_conditions,
        is_number: is_number,
        nearest_index: nearest_index,
        is_close: is_close,
        linspace: linspace
    }
    
})();  // std namespace


