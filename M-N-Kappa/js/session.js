"use strict";


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
}

Session.prototype.apply_m0 = function () {
        this.mkap.rebar_strain0 = Array.apply(null, Array(25)).map(Number.prototype.valueOf, 0);

        var original_diagram;
        for (var i = 0; i < this.mkap.m0.length; i++) {
            if (this.mkap.m0[i] > 0) {
                original_diagram = this.mkap.rebar_diagram[i];
                this.mkap.rebar_diagram[i] = new mkap.StressStrain([0, 0], [0, 0]);
                this.compute_moment(-this.mkap.m0[i]);
                this.mkap.rebar_strain0[i] = this.mkap.rebar_strain[i];
                this.mkap.rebar_diagram[i] = jQuery.extend(true, {}, original_diagram); // deep copy
                this.mkap.rebar_diagram[i].strain.splice(1, 0, this.mkap.rebar_strain0[i]);  // js version of insert
                this.mkap.rebar_diagram[i].stress.splice(1, 0, 0);
            }
        }
};

Session.prototype.calc_hookup = function (reduction) {
    /**
     * Reduction factor (float)
     *
     * Starts the calculation with the latest point of the compression material and reduces it until a solution is found.
     * Returns the strain that resulted in a valid solution.
    */

    var strain = this.mkap.compressive_diagram.strain[this.mkap.compressive_diagram.strain.length - 1];
    this.mkap.solver(true, strain);
    this.mkap.det_m_kappa();

    var count = 0;
    while (!this.mkap.validity() && count < 150) {
        this.mkap.solver(true, strain);
        this.mkap.det_m_kappa();
        strain *= (1 - reduction);
        count += 1;
    }
    return strain
};

Session.prototype.compute_n_points = function (n) {
    this.all_computed_mkap = [];
    this.apply_m0();
    var strain = this.calc_hookup(0.05);
    var d_str = strain / n;
    var moment = []; var kappa = [];
    while (strain > 0) {
        this.mkap.solver(true, strain);
        this.mkap.det_m_kappa();
        if (this.mkap.validity()) {
            moment.push(Math.abs(this.mkap.moment));
            kappa.push(Math.abs(this.mkap.kappa));
            this.all_computed_mkap.push(JSON.parse(JSON.stringify(this.mkap)));
        }
        strain -= d_str;
    }
    return {
        moment: moment.reverse(),
        kappa: kappa.reverse()
    }
};

Session.prototype.compute_moment = function (moment) {

    var top_str = this.mkap.compressive_diagram.strain[this.mkap.compressive_diagram.strain.length - 1] * 0.5;
    this.mkap.solver(true, top_str);
    this.mkap.det_m_kappa();
    var count = 0;
    var factor;
    while (1) {
        if (std.convergence_conditions(Math.abs(this.mkap.moment), moment, 1.001, 0.999)) {
            if (window.DEBUG) {
                console.log("moment convergence after %s iterations".replace("%s", count))
            }
            if (this.mkap.validity()) {
                return this.mkap.moment;
            }
            break
        }
        this.mkap.det_m_kappa();
        factor = std.convergence(Math.abs(this.mkap.moment), moment, 5);
        top_str *= factor;

        this.mkap.solver(true, top_str, false);

        if (count > 80) {
            if (window.DEBUG) {
                console.log("no moment convergence found after %s iterations".replace("%s", count))
            }
            break
        }
        count += 1;
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
    this.apply_m0();

    // Solve for significant points in compression diagram
    for (var i = 1; i < this.mkap.compressive_diagram.strain.length; i++) {
        strain = this.mkap.compressive_diagram.strain[i];

        this.mkap.solver(true, strain);
        this.mkap.det_m_kappa();

        if (this.mkap.validity()) {
            moment.push(Math.abs(this.mkap.moment));
            kappa.push(Math.abs(this.mkap.kappa));
            this.moment_compression.push(Math.abs(this.mkap.moment));
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
            { m: moment[i], k: kappa[i] }
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