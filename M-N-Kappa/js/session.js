//class
function Session() {
    this.mkap = null
    // significant points compression diagram
    this.moment_compression = []
    this.kappa_compression = []
    this.moment_tensile = []
    this.kappa_tensile = []
    // the diagrams in order
    this.rebar_diagrams = []
    this.moment_rebar = []
    this.kappa_rebar = []

}


Session.prototype.calculate_significant_points = function () {

    /** 
    determines the moment and kappa points for the given significant strain points in the compression stress strain diagram
    */
    var moment = []
    var kappa = []
    this.moment_compression = []
    this.kappa_compression = []
    this.moment_tensile = []
    this.kappa_tensile = []
    // in these are array representing the significant points of different layers of rebar
    this.moment_rebar = []
    this.kappa_rebar = []

    // Solve for significant points in compression diagram
    for (var i = 1; i < this.mkap.compressive_diagram.strain.length; i++) {
        var strain = this.mkap.compressive_diagram.strain[i]

        this.mkap.solver(true, strain)
        this.mkap.det_m_kappa()

        if (this.mkap.validity()) {
            moment.push(Math.abs(this.mkap.moment))
            kappa.push(Math.abs(this.mkap.kappa))
            this.moment_compression.push(Math.abs(this.mkap.moment))
            this.kappa_compression.push(Math.abs(this.mkap.kappa))
        }
    }


    // Solve for significant points in tensile diagram
    for (var i = 1; i < this.mkap.tensile_diagram.strain.length; i++) {
        var strain = this.mkap.tensile_diagram.strain[i]

        this.mkap.solver(false, strain)
        this.mkap.det_m_kappa()

        if (this.mkap.validity()) {
            moment.push(Math.abs(this.mkap.moment))
            kappa.push(Math.abs(this.mkap.kappa))
            this.moment_tensile.push(Math.abs(this.mkap.moment))
            this.kappa_tensile.push(Math.abs(this.mkap.kappa))
        }
    }


    // Solve for significant in the rebars material diagram. 
    //Loop for the variable number of rebar inputs
    for (var i = 0; i < this.mkap.rebar_As.length; i++) {
        this.moment_rebar[i] = []
        this.kappa_rebar[i] = []

        // Loop for the siginificant points in the rebars material stress strain diagram.
        for (var a = 1; a < this.mkap.rebar_diagram[i].strain.length; a++) {
            var sign_strain = this.mkap.rebar_diagram[i].strain[a] // siginificant point

            top_str = sign_strain * 0.5  // start the iteration at the half of the rebar strain.
            // looper rebar
            this.mkap.solver(true, top_str, false)

            // iterate untill the convergence criteria is met
            var count = 0
            while (1) {
                if (std.convergence_conditions(Math.abs(this.mkap.rebar_strain[i]), sign_strain, 1.01, 0.99)) {
                    if (window.DEBUG) {
                        console.log("rebar convergence after %s iterations".replace("%s", count))
                    }
                    this.mkap.det_m_kappa()
                    if (this.mkap.validity()) {

                        moment.push(Math.abs(this.mkap.moment))
                        kappa.push(Math.abs(this.mkap.kappa))
                        this.moment_rebar[i].push(Math.abs(this.mkap.moment))
                        this.kappa_rebar[i].push(Math.abs(this.mkap.kappa))

                    }
                    break
                }

                var factor = std.convergence(Math.abs(this.mkap.rebar_strain[i]), sign_strain, 5)

                var top_str = top_str * factor

                this.mkap.solver(true, top_str, false)

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
    var a = []

    // first combine them in array a
    for (var i in kappa) {
        a.push(
            { m: moment[i], k: kappa[i] }
            )
    };

    // sort them
    a.sort(function (b, c) {
        return ((b.k < c.k) ? -1 : ((b.k < c.k) ? 0 : 1));
    });

    for (var i = 0; i < a.length; i++) {
        moment[i] = a[i].m
        kappa[i] = a[i].k
    }

    if (DEBUG) {
        console.log(moment)
        console.log(kappa)
    }

    return {
        moment: moment,
        kappa: kappa
    }



}
// end class

var session = new Session()
session.mkap = new mkap.MomentKappa()
session.mkap.tensile_diagram = new mkap.StressStrain([0], [0])


var extract_floats = function (arr) {
    /// <param name="arr" type="array">DOM input fields array</param>
    /**
    Casts the strings to floats and pops invalid data from the array.
    */

    var data = []

    for (var i = 0; i < arr.length; i++) {
        if (arr[i].value.length > 0) { // input field is filled
            var val = parseFloat(arr[i].value)
            data.push(val)
        }
    }
    return data
}