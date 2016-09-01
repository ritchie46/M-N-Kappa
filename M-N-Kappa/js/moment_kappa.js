'use strict'

//class
function MomentKappa(master_cross_section, compressive_diagram, tensile_diagram) {
    this.master_cross_section = master_cross_section
    this.master_stress = []
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

MomentKappa.prototype.det_stress = function (strain_top, strain_btm) {

    var mstr_btm = this.master_cross_section.y_val[0]
    var mstr_top = this.master_cross_section.y_val[this.master_cross_section.y_val.length - 1]

    // iterate over the y-axis of the master cross section and determine the stresses.
    // y-axis starts at bottom.
    for (var i = 0; i < this.master_cross_section.y_val.length; i++) {

        // interpolate the strain at this y-value
        var strain_y = std.interpolate(mstr_btm, strain_btm,
            mstr_top, strain_top, this.master_cross_section.y_val[i])

        // Send the strain value as parameter in the stress strain diagram
        var stress
        if (strain_y < 0) {
            stress = this.compressive_diagram.det_stress(Math.abs(strain_y))
            this.force_compression += stress * this.master_cross_section.width_array[i]

        }

        else {
            stress = this.tensile_diagram.det_stress(strain_y)
            this.force_tensile += stress* this.master_cross_section.width_array[i]
        }
        this.master_stress.push(stress)
    }
    
    // determine rebar forces
    for (var i = 0; i < this.rebar_As.length; i++) {
        var strain = std.interpolate(mstr_btm, strain_btm, mstr_top, strain_top,
            this.rebar_z[i])
        var stress = this.rebar_diagram[i].det_stress(strain);

        var force = this.rebar_As[i] * stress;

        if (stress < 0) {
            this.force_compression += force
        }
        else {
            this.force_tensile += force
        }
    }

    console.log(this.force_compression)
    console.log(this.force_tensile)
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
var concrete_tensile = new StressStrain([0, 10], [0, 4])  // fictional for testing

var run = new MomentKappa(cs, concrete_comp, concrete_tensile)
run.rebar_As.push(800)
run.rebar_z.push(20)
run.rebar_diagram.push(new StressStrain([0, 2.175 * 0.001, 10], [0, 500, 500]))

run.det_stress(-3 * 0.001, 15 * 0.001)