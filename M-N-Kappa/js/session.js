﻿"use strict";

var calc_hookup = function (reduction, mkap, top) {
    /**
     * Reduction factor (float)
     *
     * Starts the calculation with the latest point of the compression material and reduces it until a solution is found.
     * Returns the strain that resulted in a valid solution.
     *
     * @param reduction: (float) the reduction factor of the strain.
     * @param mkap: (object) from the MomentKappa class.
     * @param top: (bool) Depends if the hookup is sought for the top or the bottom of the cross section.
     */
    top = (typeof top !== "undefined") ? top : true;

    if (top) {
        var strain = mkap.compressive_diagram.strain[mkap.compressive_diagram.strain.length - 1];
    }
    else {
        strain = mkap.tensile_diagram.strain[mkap.tensile_diagram.strain.length - 1];
    }

    mkap.solver(top, strain);
    mkap.det_m_kappa();

    var count = 0;
    while (!mkap.validity() && count < 150) {
        mkap.solver(top, strain);
        mkap.det_m_kappa();
        strain *= (1 - reduction);
        count += 1;
    }
    return strain
};

var compute_moment = function (moment, mkap, top) {
    /**
     * @param moment: Query moment
     * @param mkap: Object from the MomentKappa class
     * @param top: (bool) Depends if the hookup is sought for the top or the bottom of the cross section.
     */
    top = (typeof top !== "undefined") ? top : true;
    var strain = calc_hookup(0.05, mkap, top);
    mkap.solver(top, strain);
    mkap.det_m_kappa();
    var count = 0;
    var factor;
    while (1) {
        if (std.convergence_conditions(Math.abs(mkap.moment), moment, 1.001, 0.999)) {
            if (window.DEBUG) {
                console.log("moment convergence after %s iterations".replace("%s", count))
            }
            if (mkap.validity()) {
                return mkap.moment;
            }
            break
        }
        mkap.det_m_kappa();
        factor = std.convergence(Math.abs(mkap.moment), moment, 5);
        strain *= factor;

        mkap.solver(top, strain, false);

        if (count > 80) {
            if (window.DEBUG) {
                console.log("no moment convergence found after %s iterations".replace("%s", count))
            }
            break
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

    // prestress options
    this.compute_prestress = false;
    this.prestress = [];
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

Session.prototype.pre_prestress= function () {

    /**
     * this.mkap is the original.
     *  mkap is a copy. As will be adapted to mimic the pre-stress conditions
     */

    // take the first tensile point to determine the center line under negative moment.
    if (this.mkap.tensile_diagram.stress.length == 1){  // there is no tensile capacity list = [0]
        window.alert("A cross section cannot be pre-stressed if there is no tensile capacity.\n" +
            "Please determine a tensile stress strain diagram.");
        return 1
    }

    // copy mkap
    var mkap = jQuery.extend(true, {}, this.mkap); // deep copy

    for (var i in mkap.rebar_As) {

        /** Set the reinforcement As equal to 0. We are going to compute the strain due to mp with a zero stiffness.
         * The forces due to pre-stress can be represented as outer loads, thus no stiffness.
         * Afterwards the Moment due to pre-stress must be determined. As the zero stiffness of the pre-stress
         * reinforcement has influence on the zero line.
         */
        if (this.prestress[i] > 0) {
            mkap.rebar_As[i] = 0;
        }

        if (Math.max.apply(null, this.mkap.rebar_diagram[i].stress) < this.prestress[i]) {
            window.alert("The initial stress is higher than the stress capacity of the reinforcement\n" +
                "Check you reinforcement material diagrams");
            return 1
        }
    }

    /**
     * Now the stiffness of the pre-stress reinforcement is zero, the zero line and thus the pre-stress moment can be
     * determined.
     */
    // var strain = mkap.tensile_diagram.strain[1];
    // mkap.solver(false, strain);
    // mkap.det_m_kappa();
    // var z0 = mkap.zero_line;

    var z0 = mkap.cross_section.zero_line();

    var mp = 0;
    for (i in mkap.rebar_As) {
        // determine the pre-stress moment
             // these still has get As
        mp += this.mkap.rebar_As[i] * this.prestress[i] * (mkap.rebar_z[i] - z0)
    }


    // Turn the cross section 180 degrees
    var min_x = 1e9; var min_y = 1e9;
    // rotate the polygon
    for (i in mkap.cross_section.point_list) {
        var p = mkap.cross_section.point_list[i];
        mkap.cross_section.point_list[i] = p.rotate_origin(Math.PI);

        // determine the translation vector.
        if (mkap.cross_section.point_list[i].x < min_x){
            min_x = mkap.cross_section.point_list[i].x
        }
        if (mkap.cross_section.point_list[i].y < min_y){
            min_y = mkap.cross_section.point_list[i].y
        }
    }
    // translate back to origin.
    for (i in mkap.cross_section.point_list) {
        mkap.cross_section.point_list[i] = new vector.Point(
            mkap.cross_section.point_list[i].x - min_x,
            mkap.cross_section.point_list[i].y - min_y

        )
    }
    // rotate the reinforcement.
    for (i in mkap.rebar_z) {
        mkap.rebar_z[i] = mkap.cross_section.top - mkap.rebar_z[i]
    }
    // determine the width sections
    mkap.cross_section.instantiate();

    // determine the pre-stress strains
    compute_moment(Math.abs(mp), mkap, false);
    mkap.det_m_kappa();

    if (!mkap.validity()) {
        window.alert("Pre-stress moment is higher than the capacity.\nCheck your input.");
        return 1
    }

    /**
     * Translate the reinforcement diagrams for the reinforcement layers that are pre-stressed. The translation will be:
     * For all values in the stress strain diagram:
     *      original stress diagram value - (pre-stress + strain_due_to_mp * E)
     *      thus:
     *      original stress diagram value - (pre-stress + stress_due_to_mp)
     *
     *      Eventually the m-kappa diagram will be translated over y in mp.
     */
    for (i in mkap.rebar_As) {
        if (this.prestress[i] > 0) {
            var diagram = jQuery.extend(true, {}, mkap.rebar_diagram[i]); // deep copy
            var strain_mp = mkap.rebar_strain[i];
            var stress_mp = diagram.det_stress(strain_mp);

            // find the index where the diagram can be sliced
            var index = std.nearest_index(diagram.strain, strain_mp).low;
            console.log(index)
        }
    }
    // NOTE TO ME! Change moment query. There are two solution if the rebar is in the top of the cross section.
    // I am interested in the first (highest solution)



};

Session.prototype.calc_hookup = function (reduction) {
    return calc_hookup(reduction, this.mkap);
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
    compute_moment(moment, this.mkap);
}

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