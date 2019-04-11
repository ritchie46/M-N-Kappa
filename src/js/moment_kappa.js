'use strict';
var DEBUG = false;
// mkap namespace
var mkap = (function () {

    //class
    function MomentKappa(cross_section, compressive_diagram, tensile_diagram) {
        this.cross_section = cross_section;
        this.compressive_diagram = compressive_diagram;
        this.tensile_diagram = tensile_diagram;
        // sum of the forces in the cross section
        this.force_tensile = 0;
        this.force_compression = 0;
        this.normal_force = 0;
        this.iterations = 250;
        this.div = 2;

        /*
         * Reinforcement.
         * For n layers of reinforcement, n parameters need to be initiated in the arrays.
         */
        this.rebar_As = [];
        // distance rebar from the bottom of the master cross section
        this.rebar_z = [];
        // objects from the StressStrain class
        this.rebar_diagram = [];
        // phased rebar
        this.m0 = [];
        this.rebar_strain0_plt = [];
        this.rebar_diam = null;  // for the plotter

        // Applied at t=0. 'werkvoorspanning'
        this.prestress = [];

        // Stress and strain in the reinforcement after Mp has been applied and the deformation is zero.
        this.d_stress = [];
        this.d_strain = [];
        this.mp = 0;
        // Used by session.js when prestress is applied.
        this.original_rebar_diagrams = [];


        /**
         results
         */
        this.solution = null;
        this.rebar_force = [];
        this.rebar_strain = [];
        this.stress = [];
        this.moment = null;
        this.kappa = null;
        this.strain_top = null;
        this.strain_btm = null;
        this.zero_line = null ; // xu is height - zero line
        this.xu = null;

        this.reduce_rebar = false

    }

    MomentKappa.prototype.det_force_distribution = function (strain_top, strain_btm, reduce_rebar) {
        /**
         * Sum the tensile and compression forces based on the strain distribution
         *
         * @param strain_top: (float) Strain at the top of the cross section.
         * @param strain_btm: (float) Strain at the bottom of the cross section.
         * @param reduce_rebar: (bool) Subtract the reinforcement cross section of the whole cross section.
         *
         */
        this.force_compression = 0;
        this.force_tensile = 0;
        this.stress = [];
        this.rebar_strain = [];
        this.strain_top = strain_top;
        this.strain_btm = strain_btm;

        // default parameter
        reduce_rebar = (typeof reduce_rebar !== "undefined") ? reduce_rebar : false;
        this.reduce_rebar = reduce_rebar;

        if (this.normal_force < 0) {
            this.force_tensile += Math.abs(this.normal_force)
        }
        else {
            this.force_compression += Math.abs(this.normal_force)
        }

        // height of the sections
        var dh = this.cross_section.y_val[1];

        //cross section
        var crs_btm = this.cross_section.y_val[0];
        var crs_top = this.cross_section.y_val[this.cross_section.y_val.length - 1];

        // iterate over the y-axis of the master cross section and determine the stresses.
        // y-axis starts at bottom.
        for (var i = 0; i < this.cross_section.y_val.length; i++) {

            // interpolate the strain at this y-value
            var strain_y = std.interpolate(crs_btm, strain_btm,
                crs_top, strain_top, this.cross_section.y_val[i]);


            // Send the strain value as parameter in the stress strain diagram
            if (strain_y < 0) {
                stress = -this.compressive_diagram.det_stress(Math.abs(strain_y));
                this.force_compression -= stress * this.cross_section.width_array[i] * dh

            }

            else {
                stress = this.tensile_diagram.det_stress(strain_y);
                this.force_tensile += stress* this.cross_section.width_array[i] * dh
            }
            this.stress.push(stress)
        }


        // determine reinforcement forces
        this.rebar_force = [];
        for (i = 0; i < this.rebar_As.length; i++) {
            var strain = std.interpolate(crs_btm, strain_btm, crs_top, strain_top, this.rebar_z[i]);
            this.rebar_strain.push(strain + this.d_strain[i]);

            var stress = this.rebar_diagram[i].det_stress(Math.abs(strain));

            // absolute value
            var force = this.rebar_As[i] * stress;

            var stress_reduct;
            if (strain < 0 && this.prestress[i] == 0) {
                this.force_compression += force;
                this.rebar_force.push(-force);

                if (reduce_rebar) {
                    // Subtract reinforcement area from master element
                    stress_reduct = this.compressive_diagram.det_stress(Math.abs(strain));
                    this.force_compression -= this.rebar_As[i] * stress_reduct
                }
            }
            else {
                this.force_tensile += force;
                this.rebar_force.push(force);

                if (reduce_rebar) {
                    // Subtract reinforcement area from master element
                    stress_reduct = this.tensile_diagram.det_stress(strain);
                    this.force_tensile -= this.rebar_As[i] * stress_reduct
                }
            }
        }

    };

    MomentKappa.prototype.axial_force_resistance = function () {
        var F_rebar = 0;
        for (var i = 0; i < this.rebar_As.length; i++) {
            F_rebar += this.rebar_As[i] * this.rebar_diagram[i].stress[this.rebar_diagram[i].stress.length -1]
        }
        return this.cross_section.area() *
            this.compressive_diagram.strain[this.compressive_diagram.strain.length - 1] + F_rebar

    };
    MomentKappa.prototype.iterator_top_constant = function (btm_str, top_str) {
        /**
         * @param btm_str: (float) strain to start
         * @param top_str: (float) strain to start
         */

            // If the reinforcement is above the zero line, there will sometimes be no tensile force
            // Find the index of the highest reinforcement layer.
        var top_reinf = Math.min.apply(null, this.rebar_z);
        for (var i = 0; i < this.rebar_As.length; i++) {
            if (this.rebar_z[i] === top_reinf) {
                var rbr_index = i
            }
        }

        var div = this.div;
        var fHistoryHigh = 1e12;
        var fHistoryLow = -1e12;
        var count = 0;
        var n = 0;
        if (this.axial_force_resistance() / 5 < -this.normal_force) {
            var offset = this.compressive_diagram.strain[this.compressive_diagram.strain.length - 1];
        }
        else {
            offset = 0
        }

        // iterate until the convergence criteria is met
        while (1) {
            if (std.convergence_conditions(this.force_compression, this.force_tensile)) {
                this.solution = true;
                if (window.DEBUG) {
                    console.log("convergence after %s iterations".replace("%s", count))
                }

                return [0, count]; // [success, count]
            }

            // Extrapolate the strain from the first significant rebar strain point, to the bottom strain.
            // Needed when the rebar is above the neutral line.
            else if (isNaN(this.force_tensile) || this.force_tensile === 0) {
                btm_str = std.interpolate(this.cross_section.top, top_str, top_reinf, this.rebar_diagram[rbr_index].strain[1], this.cross_section.bottom)
                    + offset

            }

            else if (this.force_tensile > 0) {
                var factor = std.convergence(this.force_tensile, this.force_compression, div);
                btm_str = btm_str * factor;
            }

            this.det_force_distribution(top_str, btm_str - offset);
            if (count > this.iterations) {
                if (window.DEBUG) {
                    console.log("no convergence found after %s iterations".replace("%s", count))
                    console.log("offset:", offset)
                }
                return [1, count];

            }
            count += 1;

            // Adaptive convergence divider
            // Change the division based on the factor history
            if (factor > 1) {
                if (factor > fHistoryHigh) {
                    n++;
                    if (n % 2 === 0) {
                        div++
                    }
                }
                fHistoryHigh = factor;
            }
            else {
                if (factor < fHistoryLow) {
                    n++;
                    if (n % 2 === 0) {
                        div++
                    }
                }
                fHistoryLow = factor
            }
        }
    };

    MomentKappa.prototype.iterator_btm_constant = function (btm_str, top_str) {
        /**
         * @param btm_str: (float) strain to start
         * @param top_str: (float) strain to start
         */
        var div = this.div;
        var fHistoryHigh = 1e12;
        var fHistoryLow = -1e12;
        var count = 0;
        var offset;
        if (btm_str < 0) {
            offset = 0;
        }
        else {
            offset = this.compressive_diagram.strain[this.compressive_diagram.strain.length - 1];
        }

        // iterate until the convergence criteria is met
        while (1) {
            if (std.convergence_conditions(this.force_compression, this.force_tensile)) {
                this.solution = true;

                if (window.DEBUG) {
                    console.log("convergence after %s iterations".replace("%s", count))
                }
                return [0, count]
            }

            var factor = std.convergence(this.force_compression, this.force_tensile, this.div);
            if (top_str < 0) {
                top_str = top_str * factor;
            }
            else {
                top_str = top_str / factor
            }

            this.det_force_distribution(top_str - offset, btm_str);

            if (count > this.iterations) {
                if (window.DEBUG) {
                    console.log("no convergence found after %s iterations".replace("%s", count))
                }
                return [1, count]
            }
            count += 1;

            // Adaptive convergence divider
            // Change the division based on the factor history
            if (factor > 1) {
                if (factor > fHistoryHigh) {
                    div++
                }
                fHistoryHigh = factor;
            }
            else {
                if (factor < fHistoryLow) {
                    div++
                }
                fHistoryLow = factor
            }
        }
    };

    MomentKappa.prototype.solver = function (strain_top, strain, inverse) {
        /**
         * Return the .det_stress method several times and adapt the input until the convergence criteria is met.
         *
         * @param strain_top: (bool) Constant strain at the top. If true, the strain at the top will remain constant
         *                      and the strain at the bottom will be iterated over. If false vice versa for strain_bottom.
         * @param strain: (float) Constant strain at the top or bottom.
         * @param inverse: (bool) inverse the rotation. This can occur with pre-stressed beams
         */

        // default parameter
        strain_top = (typeof strain_top !== "undefined") ? strain_top : true;
        inverse = (typeof inverse !== "undefined") ? inverse : false;
        var btm_str;
        var top_str;
        if (inverse) {
            btm_str = -strain;
            top_str = strain;
            strain_top = false
        }
        else {
            btm_str = strain;
            top_str = -strain;
        }

        this.solution = false;
        var total_iter = 0;

        // first iteration
        this.det_force_distribution(top_str, btm_str);

        if (strain_top) {  // top strain remains constant
            var sol = this.iterator_top_constant(btm_str, top_str);
            if (sol[0] === 0) {
                return {iterations: sol[1], solver: "top strain"}
            }
            else {
                total_iter += sol[1]
            }
        }
        else { // bottom strain remains constant
            sol = this.iterator_btm_constant(btm_str, top_str);
            if (sol[0] === 0) {
                return {iterations: sol[1], solver: "bottom strain"}
            }
            else {
                total_iter += sol[1]
            }
        }

        return total_iter
    };

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
        this.kappa = (-this.strain_top + this.strain_btm) / (this.cross_section.top - this.cross_section.bottom);
        this.moment = this.mp;
        var offset = this.cross_section.y_val[1] * 0.5;

        // height of the sections
        var dh = this.cross_section.y_val[1];

        for (var i = 0; i < this.cross_section.y_val.length; i++) {
            var arm = this.cross_section.y_val[i] + offset;
            var force = this.stress[i] * this.cross_section.width_array[i] * dh;

            this.moment += arm * force;
        }

        // N normal force share
        this.moment -= this.normal_force * this.cross_section.zero_line();

        // rebar share
        for (i = 0; i < this.rebar_As.length; i++) {
            this.moment += this.rebar_force[i] * this.rebar_z[i];

            // reduction of master cross section at place of rebar
            if (this.reduce_rebar) {
                if (this.rebar_force[i] > 0) {  // tensile stress
                    var stress_reduct = this.tensile_diagram.det_stress(this.rebar_strain[i]);
                    //this.moment -= stress_reduct * this.rebar_As[i] * this.rebar_z[i]
                }
                else {  // compression stress
                    stress_reduct = -this.compressive_diagram.det_stress(Math.abs(this.rebar_strain[i]));
                    //this.moment -= stress_reduct * this.rebar_As[i] * this.rebar_z[i]
                }
            }
        }

        this.moment *= -1;
        // zero line
        this.zero_line = std.interpolate(this.strain_btm, this.cross_section.bottom, this.strain_top, this.cross_section.top, 0);
        this.xu = this.cross_section.top - this.zero_line
    };

    MomentKappa.prototype.validity = function (inverse) {
        /**
         * Check if the found equilibrium solution could be regarded as valid.
         *
         * @type {boolean}
         */
        var valid = true;
        inverse = (typeof inverse !== "undefined") ? inverse : false;
        var strain;

        if (inverse) {
            strain = this.strain_btm
        }
        else {
            strain = this.strain_top
        }

        if (std.is_number(this.moment)
            && std.is_number(this.kappa)
            && this.solution
            && strain >= -this.compressive_diagram.strain[this.compressive_diagram.strain.length - 1]
            && strain < 0
        ) {
            for (var i in this.rebar_strain) {
                if (Math.abs(this.rebar_strain[i]) > Math.max.apply(null, this.rebar_diagram[i].strain)) {
                    valid = false;
                }
            }

            if (std.is_close(this.strain_btm, 0, 0.01, 0.01)) {
                if (this.xu >= (this.cross_section.top - this.cross_section.bottom)) {
                    return false
                }
            }
        }

        else {
            valid = false;
        }
        return valid
    };


    MomentKappa.prototype.soft_validity = function(inverse) {
        var valid = true;
        inverse = (typeof inverse !== "undefined") ? inverse : false;
        var strain;

        if (inverse) {
            strain = this.strain_btm
        }
        else {
            strain = this.strain_top
        }

        if (std.is_number(this.moment)
            && std.is_number(this.kappa)
            && this.solution
            && strain >= -this.compressive_diagram.strain[this.compressive_diagram.strain.length - 1] !== inverse
            && strain < 0 !== inverse
        ) {

            if (std.is_close(this.strain_btm, 0, 0.01, 0.01)) {
                if (this.xu >= (this.cross_section.top - this.cross_section.bottom)) {
                    return false
                }
            }
        }

        else {
            valid = false;
        }
        return valid
    };


    MomentKappa.prototype.instantiate_standard_reinforcement = function(As, rebar_z, rebar_diagram) {
        /**
         * Instantiate standard moment kappa solver. Because of the extra options regarding phased moments, prestress
         * etc. some extra parameters need to be instantiated.
         *
         * @param As: {Array} Area of the reinforcement per layer.
         * @param rebar_z: {Array} Height of the reinforcement layer with respect to the bottom of the cross section.
         * @param rebar_diagram: {StressStrain} Diagram object.
         */

        this.rebar_z = rebar_z;
        this.rebar_As = As;

        this.prestress = this.m0 = this.d_stress = this.d_strain =
            Array.apply(null, Array(As.length)).map(Number.prototype.valueOf, 0);

        this.rebar_diagram = Array.apply(null, Array(As.length)).map(function () {
            return rebar_diagram
        });

    };



    function StressStrain(strain, stress) {
        /**
         * Class for creating stress strain diagrams.
         *
         * @param strain: (array) Strain values of the diagram.
         * @param stress: (array) Stress values of the diagram.
         */

        this.strain = strain;
        this.stress = stress
    }


    StressStrain.prototype.det_stress = function (strain) {
        /**
         * @param strain: (float) Strain for which the stress needs to be determined.
         * Iterate through the strain array until iterated value exceeds the requested strain.
         * At that the point the two values will interpolated.
         */

        for (var i = 0; i < this.strain.length; i++) {
            if (strain > this.strain[this.strain.length - 1]) {
                return 0;
            }
            else if (this.strain[i] === strain) {
                return this.stress[i]
            }
            else if (this.strain[i] > strain) {
                return std.interpolate(this.strain[i - 1], this.stress[i - 1],
                    this.strain[i], this.stress[i], strain);
            }
        }
    };

    StressStrain.prototype.det_strain = function (stress) {
        /**
         * @param stress: (float) Strain for which the stress needs to be determined.
         * Iterate through the stress array until iterated value exceeds the requested strain.
         * At that the point the two values will interpolated.
         */
        for (var i = 0; i < this.stress.length; i++) {
            if (stress > this.stress[this.stress.length - 1]) {
                return 0;
            }
            else if (this.stress[i] === stress) {
                return this.strain[i]
            }
            else if (this.stress[i] > stress) {
                return std.interpolate(this.stress[i - 1], this.strain[i - 1],
                    this.stress[i], this.strain[i], stress);
            }
        }
    };

    function calcHookup (reduction, mkap, top) {
        /**
         * Reduction factor (float)
         *
         * Starts the calculation with the latest point of the compression material and reduces it until a solution is found.
         * Returns the strain that resulted in a valid solution.
         *
         * @param reduction: {float} the reduction factor of the strain.
         * @param mkap: {object} from the MomentKappa class.
         * @param top: {bool} Depends if the hookup is sought for the top or the bottom of the cross section.
         */
        top = (typeof top !== "undefined") ? top : true;
        var strain;
        if (top) {
            strain = mkap.compressive_diagram.strain[mkap.compressive_diagram.strain.length - 1];
        }
        else {
            strain = mkap.tensile_diagram.strain[mkap.tensile_diagram.strain.length - 1];
        }

        var sol = mkap.solver(top, strain);
        mkap.det_m_kappa();

        var count = 0;
        var iter;
        while (!mkap.soft_validity() && count < (4 / reduction)) {
            iter = mkap.solver(top, strain);
            mkap.det_m_kappa();
            strain *= (1 - reduction);
            count += 1;

            if (mkap.soft_validity()) {
                return {strain: strain, solver: sol.solver}
            }
        }

        if (mkap.soft_validity()) {
            return {strain: strain, solver: sol.solver}
        }
        else {
            console.log("Calchookup non valid. Results may be inaccurate");
            return {strain: strain, solver: sol.solver}
        }

    }


    return {    MomentKappa: MomentKappa,
        StressStrain: StressStrain,
        calcHookup: calcHookup
    }

})();  // mkap namespace


