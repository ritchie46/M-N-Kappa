﻿'use strict';

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

        /** 
        rebar
        */
        this.rebar_As = [];
        // distance rebar from the bottom of the master cross section
        this.rebar_z = [];
        // objects from the StressStrain class
        this.rebar_diagram = [];
        // phased rebar
        this.m0 = [];
        this.rebar_strain0 = [];
        this.rebar_diam = null;  // for the plotter

        // Applied at t=0. 'werkvoorspanning'
        this.prestress = [];

        // Stress and strain in the reinforcement after Mp has been applied and the deformation is zero.
        this.d_stress = [];
        this.d_strain = [];
        this.mp = 0;
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

        // solver settings
        this.iterations = 120;
        this.div = 4;
        this.reduce_rebar = false

    }

    MomentKappa.prototype.det_force_distribution = function (strain_top, strain_btm, reduce_rebar) {
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
            this.rebar_strain.push(strain);

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

    MomentKappa.prototype.solver = function (strain_top, strain, print) {
        /**
        Return the .det_stress method several times and adapt the input untill the convergence criteria is met.
    
        /// <param name="strain_top" type="bool">constant strain</param>
        If the strain_top == true, the strain at the top will remain constant and the strain at the bottom will be iterated
        over. If false vice versa for strain_bottom.
        */
        // default parameter
        strain_top = (typeof strain_top !== "undefined") ? strain_top : true;
        print = (typeof print !== "undefined") ? print : true;

        this.solution = false;

        if (this.normal_force != 0) {
            this.div = 10;
            this.iterations = 150
        }
        else {
            this.div = 4;
            this.iterations = 120
        }

        // first iteration
        var btm_str = strain;
        var top_str = -strain;

        this.det_force_distribution(top_str, btm_str);
        var count = 0;
        var factor;
        if (strain_top) {  // top strain remains constant
            // iterate untill the convergence criteria is met
            while (1) {
                if (std.convergence_conditions(this.force_compression, this.force_tensile)) {
                    this.solution = true;
                    if (print) {
                        if (window.DEBUG) {
                            console.log("convergence after %s iterations".replace("%s", count))
                        }
                    }
                    break
                }
                
                // if the rebar is above the zero line, there will sometimes be no tensile force
                var low = Math.min.apply(null, this.rebar_z);
                for (var i = 0; i < this.rebar_As.length; i++) {
                    if (this.rebar_z[i] == low) {
                        var str_rbr = this.rebar_strain[i];
                        var rbr_index = i
                        }
                    }


                if (this.force_tensile === 0 && str_rbr <= 0) {
                    // Extrapolate the from the first significant rebar strain point, to the bottom strain.
                    // Needed when the rebar is above the neutral line.
                    btm_str = std.interpolate(this.cross_section.top, top_str, low, this.rebar_diagram[rbr_index].strain[1], this.cross_section.bottom)
                         
                }
                else if (isNaN(this.force_tensile)) {
                    btm_str = std.interpolate(this.cross_section.top, top_str, low, this.rebar_diagram[rbr_index].strain[1], this.cross_section.bottom)
                }
                else {

                    factor = std.convergence(this.force_tensile, this.force_compression, this.div);
                    btm_str = btm_str * factor;
                }
                
                this.det_force_distribution(top_str, btm_str);
                if (count > this.iterations) {
                    if (print) {
                        if (window.DEBUG) {
                            console.log("no convergence found after %s iterations".replace("%s", count))
                        }
                    }
                    break

                }
                count += 1
            }
        }
        else { // bottom strain remains constant
            // iterate untill the convergence criteria is met
            while (1) {
                if (std.convergence_conditions(this.force_compression, this.force_tensile)) {
                    this.solution = true;
                    if (print) {
                        if (window.DEBUG) {
                            console.log("convergence after %s iterations".replace("%s", count))
                        }
                    }
                    break
                }

                factor = std.convergence(this.force_compression, this.force_tensile, this.div);
                top_str = top_str * factor;
     
                this.det_force_distribution(top_str, btm_str);

                if (count > this.iterations) {
                    if (print) {
                        if (window.DEBUG) {
                            console.log("no convergence found after %s iterations".replace("%s", count))
                        }
                    }
                    break
                }
                count += 1
            }
        }

        this.zero_line = std.interpolate(this.strain_top, this.cross_section.top, this.strain_btm,
            this.cross_section.bottom, 0);
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
        this.kappa = (-this.strain_top + this.strain_btm) / (this.cross_section.top - this.cross_section.bottom);  //this.strain_btm / (this.zero_line - this.cross_section.bottom)
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
        this.moment -= this.normal_force * (this.cross_section.top - this.cross_section.bottom) * 0.5;

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

        // zero line
        this.zero_line = std.interpolate(this.strain_btm, this.cross_section.bottom, this.strain_top, this.cross_section.top, 0);
        this.xu = this.cross_section.top - this.zero_line
    };

    MomentKappa.prototype.validity = function () {
        if (std.is_number(this.moment)
            && std.is_number(this.kappa)
            && this.solution
            && this.strain_top >= -this.compressive_diagram.strain[this.compressive_diagram.strain.length - 1]
            && this.strain_top < 0
            ) {
            var valid = true;

            for (var i in this.rebar_strain) {
                if (this.rebar_strain[i] > Math.max.apply(null, this.rebar_diagram[i].strain)) {
                    valid = false;
                }
            }
            if (valid) {
                return true
            }
            else {
                return false
            }
        }
        else {
            return false
        }
    };



    //end class


    //class
    function StressStrain(strain, stress) {
        /**
        Class for creating stress strain diagrams.
        */
        /// <param name="strain" type="array">Contains strain values corresponding with this.stress</param>
        /// <param name="stress" type="array">Contains stress values corresponding with this.strain</param>

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
            else if (this.strain[i] == strain) {
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
            else if (this.stress[i] == stress) {
                return this.strain[i]
            }
            else if (this.stress[i] > stress) {
                return std.interpolate(this.stress[i - 1], this.strain[i - 1],
                    this.stress[i], this.strain[i], stress);
            }
        }
    };
    //end class

    return {    MomentKappa: MomentKappa,
                StressStrain: StressStrain
    }

})();  // mkap namespace