'use strict'

//class
function MomentKappa(cross_section, compressive_diagram, tensile_diagram) {
    this.cross_section = cross_section
    this.stress = []
    this.compressive_diagram = compressive_diagram
    this.tensile_diagram = tensile_diagram
    // sum of the forces in the cross section
    this.force_tensile = 0
    this.force_compression = 0

    /** rebar
    */
    this.rebar_As = []
    // distance rebar from the bottom of the master cross section
    this.rebar_z = []
    // objects from the StressStrain class
    this.rebar_diagram = []

}

MomentKappa.prototype.det_force_distribution = function (strain_top, strain_btm) {
    this.force_compression = 0
    this.force_tensile = 0
    this.stress = []

    // master = master cross section
    var mstr_btm = this.cross_section.y_val[0]
    var mstr_top = this.cross_section.y_val[this.cross_section.y_val.length - 1]

    // iterate over the y-axis of the master cross section and determine the stresses.
    // y-axis starts at bottom.
    for (var i = 0; i < this.cross_section.y_val.length; i++) {

        // interpolate the strain at this y-value
        var strain_y = std.interpolate(mstr_btm, strain_btm,
            mstr_top, strain_top, this.cross_section.y_val[i])
        

        // Send the strain value as parameter in the stress strain diagram
        var stress
        if (strain_y < 0) {
            stress = this.compressive_diagram.det_stress(Math.abs(strain_y))
            this.force_compression += stress * this.cross_section.width_array[i]

        }

        else {
            stress = this.tensile_diagram.det_stress(strain_y)
            this.force_tensile += stress* this.cross_section.width_array[i]
        }
        this.stress.push(stress)
    }

    
    // determine rebar forces
    for (var i = 0; i < this.rebar_As.length; i++) {
        var strain = std.interpolate(mstr_btm, strain_btm, mstr_top, strain_top,
            this.rebar_z[i])
        var stress = this.rebar_diagram[i].det_stress(Math.abs(strain));

        // absolute value
        var force = this.rebar_As[i] * stress
        
        var stress_reduct
        if (strain < 0) {
            this.force_compression += force
            
            // reduce rebar area from master element
            stress_reduct = this.compressive_diagram.det_stress(Math.abs(strain))
            this.force_compression -= this.rebar_As[i] * stress_reduct

        }
        else {
            this.force_tensile += force

            // reduce rebar area from master element
            stress_reduct = this.tensile_diagram.det_stress(strain)
            this.force_tensile -= this.rebar_As[i] * stress_reduct
        }
    }

}

MomentKappa.prototype.solver = function (strain_top, strain) {
    /**
    Return the .det_stress method several times and adapt the input untill the convergence criteria is met.

    /// <param name="strain_top" type="bool">constant strain</param>
    If the strain_top == true, the strain at the top will remain constant and the strain at the bottom will be iterated
    over. If false vice versa for strain_bottom.
    */
    // default parameter
    var strain_top = (typeof strain_top !== "undefined") ? strain_top : true;

    // first iteration
    var btm_str = strain
    var top_str = -strain

    this.det_force_distribution(top_str, btm_str)    

    if (strain_top) {

        
        // iterate untill the convergence criteria is met
        var count = 0
        while (1) {
            if (std.convergence_conditions(this.force_compression, this.force_tensile)) {
                console.log("convergence after $s iterations".replace("$s", count))
                break
            }
            
            var factor = std.convergence(this.force_tensile, this.force_compression)
            var btm_str = btm_str * factor
            this.det_force_distribution(top_str, btm_str)

            if (count > 100) {
                console.log("no convergence found")
                break
            }
            
            count += 1
        }
    }

}

//end class


//class
function StressStrain(strain, stress) {
    /**
    Class for creating stress strain diagrams.
    */
    /// <param name="strain" type="array">Contains strain values corresponding with this.stress</param>
    /// <param name="stress" type="array">Contains stress values corresponding with this.strain</param>

    this.strain = strain
    this.stress = stress
}


StressStrain.prototype.det_stress = function (strain) {
    /// <param name="strain" type="flt">strain for wich the stress needs to be determined</param>

    // iterate through the strain array untill iterated value exceeds the requested strain.
    // At that the point the two values will interpolated.
    for (var i = 0; i < this.strain.length; i++) {
        if (strain > this.strain[this.strain.length - 1]) {
            return 0;
        }
        else if (this.strain[i] == strain) {
            return this.stress[i]
        }
        else if (this.strain[i] > strain) {
            return std.interpolate(this.strain[i - 1], this.stress[i - 1],
                this.strain[i], this.stress[i], strain);
        };

    };
}
//end class



var concrete_comp = new StressStrain([0, 1.75 * 0.001, 3.5 * 0.001], [0, 20, 20])
var concrete_tensile = new StressStrain([0], [0])  // fictional for testing

var run = new MomentKappa(cs, concrete_comp, concrete_tensile)
run.rebar_As.push(800)
run.rebar_z.push(1)
run.rebar_diagram.push(new StressStrain([0, 2.175 * 0.001, 10], [0, 500, 500]))


run.solver(true, 3.5e-3)
