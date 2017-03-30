"use strict";

var compute_moment = function (moment, mkap, top) {
    /**
     * @param moment: Query moment
     * @param mkap: Object from the MomentKappa class
     * @param top: (bool) Depends if the hookup is sought for the top or the bottom of the cross section.
     */
    top = (typeof top !== "undefined") ? top : true;
    var strain = session.calc_hookup(0.05, mkap, top);

    if (window.DEBUG) {
        console.log("In compute moment")
    }

    var count = 0;
    var factor;
    while (1) {
        if (std.convergence_conditions(mkap.moment, moment, 1.001, 0.999)) {
            if (window.DEBUG) {
                console.log("moment convergence after %s iterations".replace("%s", count) + "moment :" + (moment));
                console.log("validity " + (mkap.validity()), "straintop ", mkap.strain_top, "mkap",mkap.kappa,
                "strainbtm", mkap.strain_btm, mkap.force_compression, mkap.force_tensile)
            }
            if (mkap.validity()) {
                return 0
            }
            break
        }
        mkap.det_m_kappa();
        factor = std.convergence(Math.abs(mkap.moment), moment, 2.5);
        strain *= factor;

        mkap.solver(top, strain, false);

        if (count > 80) {
            if (window.DEBUG) {
                console.log("no moment convergence found after %s iterations".replace("%s", count));
                console.log("validity " + (mkap.validity()), "straintop ", mkap.strain_top, "mkap",mkap.kappa,
                    "strainbtm", mkap.strain_btm, mkap.force_compression, mkap.force_tensile)
            }
            return 1
        }
        count += 1;
    }
};


//class
function Session() {
    this.mkap = null;
    // significant points compression diagram
    this.moment_compression = [];
    this.kappa_compression = [];
    this.sign_stress_comp = [];
    this.sign_strain_comp = [];

    this.moment_tensile = [];
    this.kappa_tensile = [];
    this.sign_stress_tens = [];
    this.sign_strain_tens = [];

    // the diagrams in order
    this.rebar_diagrams = [];
    this.moment_rebar = [];
    this.kappa_rebar = [];
    this.sign_stress_rbr = [];
    this.sign_strain_rbr = [];

    // session objects
    this.sign_tensile_mkap = [];
    this.sign_compression_mkap = [];
    this.sign_rebar_mkap = [];
    this.all_computed_mkap = [];

    // pre-stress options
    this.compute_prestress = false;
    // backup
    this.rebar_diagram = [];
}

Session.prototype.apply_m0 = function () {
        this.mkap.rebar_strain0_plt = Array.apply(null, Array(25)).map(Number.prototype.valueOf, 0);
        var original_diagram;

    if (window.DEBUG) {
    }

        for (var i = 0; i < this.mkap.m0.length; i++) {
            if (this.mkap.m0[i] > 0) {
                original_diagram = this.mkap.rebar_diagram[i];
                this.mkap.rebar_diagram[i] = new mkap.StressStrain([0, 0], [0, 0]);
                this.compute_moment(-this.mkap.m0[i]);

                if (this.mkap.rebar_strain[i] < 0) {
                    this.mkap.d_strain[i] = -this.mkap.rebar_strain[i];
                    this.mkap.rebar_strain0_plt[i] = 0;
                }
                else {
                    this.mkap.rebar_strain0_plt[i] = this.mkap.rebar_strain[i];
                }
                this.mkap.rebar_diagram[i] = jQuery.extend(true, {}, original_diagram); // deep copy
                this.mkap.rebar_diagram[i].strain.splice(1, 0, this.mkap.rebar_strain[i]);  // js version of insert
                this.mkap.rebar_diagram[i].stress.splice(1, 0, 0);

                /**
                 * Translate all values of the diagram
                 *
                 */
                for (var j = 2; j < this.mkap.rebar_diagram[i].strain.length; j ++) {
                    this.mkap.rebar_diagram[i].strain[j] += this.mkap.rebar_strain[i]
                }

                if (Math.abs(this.mkap.m0[i]) < Math.abs(this.mkap.mp)) {
                    window.alert("Moment at placement only works if there is tensile stress in the cross section " +
                        "during application. Check your input.");
                    return 1
                }
            }
        }
};

Session.prototype.pre_prestress= function () {

    /**
     * this.mkap is the original.
     *  mkap is a copy. As will be adapted to mimic the pre-stress conditions
     */

    // copy mkap
    var mkap = jQuery.extend(true, {}, this.mkap); // deep copy

    for (var i in mkap.rebar_As) {

        /** Set the reinforcement As equal to 0. We are going to compute the strain due to mp with a zero stiffness.
         * The forces due to pre-stress can be represented as outer loads, thus no stiffness.
         * Afterwards the Moment due to pre-stress must be determined. As the zero stiffness of the pre-stress
         * reinforcement has influence on the zero line.
         */
        if (mkap.prestress[i] > 0) {
            mkap.rebar_As[i] = 0;
        }

        if (Math.max.apply(null, this.mkap.rebar_diagram[i].stress) < this.mkap.prestress[i]) {
            window.alert("The initial stress is higher than the stress capacity of the reinforcement\n" +
                "Check you reinforcement material diagrams");
            return 1
        }

        this.mkap.original_rebar_diagrams[i] = jQuery.extend(true, {}, mkap.rebar_diagram[i]);
    }

    /**
     * Now the stiffness of the pre-stress reinforcement is zero, the zero line and thus the pre-stress moment can be
     * determined.
     */

    var z0 = mkap.cross_section.zero_line();
    var N = 0;
    var mp = 0;

    for (i in mkap.rebar_As) {
        // determine the pre-stress moment
             // these still has get As
        mp += this.mkap.rebar_As[i] * this.mkap.prestress[i] * (mkap.rebar_z[i] - z0);
        N -= this.mkap.rebar_As[i] * this.mkap.prestress[i];
    }


    /**
     * Translate the reinforcement diagrams for the reinforcement layers that are pre-stressed. The translation will be:
     * For all values in the stress strain diagram:
     *
     *      CASE 1. (pre-stress - dstrain)
     *      original stress diagram value - (pre-stress - strain_due_to_mp * E)
     *      thus:
     *      original stress diagram value - (pre-stress - stress_due_to_mp)
     *
     *      It is (pre-stress - stress_due_to_mp) as long as the pre-stress reinforcement  will extend. (Normal case)
     *
     *      CASE 2. (pre-stress + dstrain)
     *      If the pre-stress reinforcement will relax when bending back in the loaded direction
     *      original stress diagram value - (pre-stress + stress_due_to_mp)
     *      This is only the case with multiple layers of pre-stress reinforcement.
     *
     *      In the solver the pre-stress reinforcement should only be activated when extension takes place
     *
     *
     *      Eventually the m-kappa diagram will be translated over y in mp.
     */
    for (i in mkap.rebar_As) {
        if (this.mkap.prestress[i] > 0) {

            /**
             * Underneath strain_mp is the more correct version, but than the material diagrams should be entered correctly
             * for now it is off.
             *
             */
            //var strain_mp = mkap.rebar_strain[i];
            var strain_mp = 0;

            var pre_strain = mkap.rebar_diagram[i].det_strain(mkap.prestress[i]);
            var d_strain = pre_strain + strain_mp; // the sign +- is correct. See case 1 and case 2

            if (d_strain < 0) {
                console.log("Hmm.. this should not happen. Negative pre-stress. Very low pre-stress input?")
            }
            var d_stress = mkap.rebar_diagram[i].det_stress(d_strain);
            this.mkap.d_strain[i] = d_strain;
            this.mkap.d_stress[i] = d_stress;

            // Insert the stress and strains
            // clone diagram
            mkap.rebar_diagram[i] = jQuery.extend(true, {}, mkap.rebar_diagram[i]);
            for (var j in mkap.rebar_diagram[i].strain) {
                if (mkap.rebar_diagram[i].strain[j] < d_strain) {
                    mkap.rebar_diagram[i].strain.shift();
                    mkap.rebar_diagram[i].stress.shift();
                }
                else {
                    mkap.rebar_diagram[i].strain.unshift(d_strain);
                    mkap.rebar_diagram[i].stress.unshift(d_stress);
                    break
                }
            }
            // Translate the diagram
            for (j in mkap.rebar_diagram[i].strain) {

                mkap.rebar_diagram[i].strain[j] -= d_strain;
                mkap.rebar_diagram[i].stress[j] -= d_stress
            }

            // Replace the original diagram
            this.mkap.rebar_diagram[i] = mkap.rebar_diagram[i];
        }
    }
    this.mkap.mp = mp;
    this.mkap.normal_force += N;
};

Session.prototype.calc_hookup = function (reduction) {
    return mkap.calcHookup(reduction, this.mkap).strain
};

Session.prototype.compute_n_points = function (n) {
    this.all_computed_mkap = [];
    if (this.apply_m0() !== 1) {
        var strain = this.calc_hookup(0.05);
        var d_str = strain / n;
        var moment = [];
        var kappa = [];
        while (strain > 0) {
            this.mkap.solver(true, strain);
            this.mkap.det_m_kappa();
            if (this.mkap.validity() && this.mkap.kappa > 0 && this.mkap.moment > 0) {
                moment.push(this.mkap.moment);
                kappa.push(this.mkap.kappa);
                this.all_computed_mkap.push(JSON.parse(JSON.stringify(this.mkap)));
            }
            strain -= d_str;
        }

        return {
            moment: moment, //moment.reverse(),
            kappa: kappa //kappa.reverse()
        }
    }
};

Session.prototype.compute_moment = function (moment, top) {
    /**
     * @param top: (bool) Depends if the hookup is sought for the top or the bottom of the cross section.
     */
    top = (typeof top !== "undefined") ? top : true;
    if (compute_moment(moment, this.mkap, top) !== 0) {
        return compute_moment(moment, this.mkap, !top)
    }
    else {
        return 0
    }

};

Session.prototype.calculate_significant_points = function () {
    /** 
    determines the moment and kappa points for the given significant strain points in the compression stress strain diagram
    */
    var moment = [];
    var kappa = [];
    this.moment_compression = [];
    this.kappa_compression = [];
    this.moment_tensile = [];
    this.kappa_tensile = [];
    // in these are array representing the significant points of different layers of rebar
    this.moment_rebar = [];
    this.kappa_rebar = [];

    // the values of calculated at the significant points. Should match the diagrams by a few promille
    this.sign_stress_comp = [];
    this.sign_strain_comp = [];
    this.sign_stress_tens = [];
    this.sign_strain_tens = [];
    this.sign_stress_rbr = [];
    this.sign_strain_rbr = [];
    this.sign_tensile_mkap = [];
    this.sign_compression_mkap = [];
    this.sign_rebar_mkap = [];

    // check for phased analysis
    if (this.apply_m0() !== 1) {

        // Solve for significant points in compression diagram
        for (var i = 1; i < this.mkap.compressive_diagram.strain.length; i++) {
            strain = this.mkap.compressive_diagram.strain[i];

            this.mkap.solver(true, strain);
            this.mkap.det_m_kappa();

            if (this.mkap.validity()) {
                moment.push(Math.abs(this.mkap.moment));
                kappa.push(Math.abs(this.mkap.kappa));
                this.moment_compression.push(this.mkap.moment);
                this.kappa_compression.push(Math.abs(this.mkap.kappa));
                this.sign_strain_comp.push(this.mkap.strain_top);

                // make sure you get -3.5 promille instead of a value of zero
                if (this.mkap.stress[this.mkap.stress.length - 1] < 0) {
                    this.sign_stress_comp.push(this.mkap.stress[this.mkap.stress.length - 1])
                }
                else {
                    this.sign_stress_comp.push(this.mkap.stress[this.mkap.stress.length - 2])
                }
                this.sign_compression_mkap.push(JSON.parse(JSON.stringify(this.mkap)));
            }
        }


        // Solve for significant points in tensile diagram
        for (i = 1; i < this.mkap.tensile_diagram.strain.length; i++) {
            var strain = this.mkap.tensile_diagram.strain[i];

            this.mkap.solver(false, strain);
            this.mkap.det_m_kappa();

            if (this.mkap.validity()) {
                moment.push(Math.abs(this.mkap.moment));
                kappa.push(Math.abs(this.mkap.kappa));
                this.moment_tensile.push(Math.abs(this.mkap.moment));
                this.kappa_tensile.push(Math.abs(this.mkap.kappa));
                this.sign_stress_tens.push(this.mkap.stress[0]);
                this.sign_strain_tens.push(this.mkap.strain_btm);
                this.sign_tensile_mkap.push(JSON.parse(JSON.stringify(this.mkap))); // Copies the object

            }
        }

        // Solve for significant in the rebars material diagram.
        //Loop for the variable number of rebar inputs
        for (i = 0; i < this.mkap.rebar_As.length; i++) {
            this.moment_rebar[i] = [];
            this.kappa_rebar[i] = [];
            this.sign_stress_rbr[i] = [];
            this.sign_strain_rbr[i] = [];
            this.sign_rebar_mkap[i] = [];

            // Loop for the significant points in the rebars material stress strain diagram.
            for (var a = 1; a < this.mkap.rebar_diagram[i].strain.length; a++) {
                var sign_strain = this.mkap.rebar_diagram[i].strain[a]; // siginificant point

                top_str = sign_strain * 0.5;  // start the iteration at the half of the rebar strain.
                // looper rebar
                this.mkap.solver(true, top_str, false);

                // iterate until the convergence criteria is met
                var count = 0;
                while (1) {
                    if (std.convergence_conditions(Math.abs(this.mkap.rebar_strain[i]), sign_strain, 1.001, 0.999)) {
                        if (window.DEBUG) {
                            console.log("rebar convergence after %s iterations".replace("%s", count))
                        }
                        this.mkap.det_m_kappa();
                        if (this.mkap.validity()) {

                            moment.push(Math.abs(this.mkap.moment));
                            kappa.push(Math.abs(this.mkap.kappa));
                            this.moment_rebar[i].push(Math.abs(this.mkap.moment));
                            this.kappa_rebar[i].push(Math.abs(this.mkap.kappa));
                            this.sign_stress_rbr[i].push(this.mkap.rebar_force[i] / this.mkap.rebar_As[i]);
                            this.sign_strain_rbr[i].push(this.mkap.rebar_strain[i]);
                            this.sign_rebar_mkap[i].push(JSON.parse(JSON.stringify(this.mkap)));

                        }
                        break
                    }

                    var factor = std.convergence(Math.abs(this.mkap.rebar_strain[i]), sign_strain, 5);
                    var top_str = top_str * factor;

                    this.mkap.solver(true, top_str, false);

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
        a = [];

        // first combine them in array a
        for (i in kappa) {
            a.push(
                {m: moment[i], k: kappa[i]}
            )
        }

        // sort them
        a.sort(function (b, c) {
            return ((b.k < c.k) ? -1 : ((b.k < c.k) ? 0 : 1));
        });

        for (i = 0; i < a.length; i++) {
            moment[i] = a[i].m;
            kappa[i] = a[i].k;
        }

        if (DEBUG) {
            console.log(moment);
            console.log(kappa);
        }

        this.all_computed_mkap = this.sign_compression_mkap.concat(this.sign_rebar_mkap, this.sign_tensile_mkap);

        return {
            moment: moment,
            kappa: kappa
        }
    }

};

Session.prototype.axial_moment_diagram = function () {

    var moment = [];
    var axial = [];
    var n = 50;
    // The maximum possible concrete resistance force
    var max_N = Math.max.apply(null, this.mkap.compressive_diagram.stress) * this.mkap.cross_section.area();

    // The maximum possible reinforcement resistance force
    for (var i = 0; i < this.mkap.rebar_As.length; i++) {
        max_N += Math.max.apply(null, this.mkap.rebar_diagram[i].stress) * this.mkap.rebar_As[i]
    }

    var dN = max_N / n;

    var fail_count = 0;
    this.mkap.normal_force = 0;

    for (i = 0; i < n; i++) {
        this.calc_hookup(0.05);
        if (this.mkap.validity()) {
            axial.push(-this.mkap.normal_force);
            moment.push(this.mkap.moment);
        }
        else {
            fail_count++;
            if (fail_count > 2) {
                i = n; // break
            }
        }
        this.mkap.normal_force -= dN;
    }


    return {
        moment: moment,
        axial: axial
    }

};
// end class

var session = new Session();
session.mkap = new mkap.MomentKappa();
session.mkap.tensile_diagram = new mkap.StressStrain([0], [0]);


var extract_floats = function (arr) {
    /// <param name="arr" type="array">DOM input fields array</param>
    /**
    Casts the strings to floats and pops invalid data from the array.
    */

    var data = [];

    for (var i = 0; i < arr.length; i++) {
        if (arr[i].value.length > 0) { // input field is filled
            var val = parseFloat(arr[i].value);
            data.push(val)
        }
    }
    return data
};