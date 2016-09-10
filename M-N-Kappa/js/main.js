/**
Note to self:
    The plotter also adds the objects uses for calculations to the sessions
*/

"use strict"
var DEBUG = true

$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();

    // Logic for collapsing the polygon input div
    $("#collapse_polygon").collapse("show");

    // add 3 input elements for the polygon input
    var $row = $(".pg_row")
    for (var i = 0; i < 3; i++) {
        $row.after($row.clone().removeClass('hidden'))
    }

    // General collapse panel logic
    $(".collapse_glyph").click(function () {
        $(this).closest(".panel").children(".collapse").toggle()
        $(this).toggleClass('glyphicon-triangle-top glyphicon-triangle-bottom')
    });

    // General add row logic
    function add_row(self) {
        var $row = self.closest(".panel-body").children(".custom_row").last();
        var $clone = $row.clone()
        $clone.removeClass('hidden')
        $row.after($clone);
    }
        
    $(".add_row").click(function () {
        add_row($(this))
    })


    // General remove panel row logic
    function remove_row(self) {
        self.closest('.custom_row').remove()
    }

    $(".panel").on("click", ".remove_row", function () {
        remove_row($(this))
    })


    //Call polygon draw function if row is removed
    $('#pg_body').on("click", ".remove_row", function () {
        $(this).closest('.custom_row').remove()
        trigger_polygon();
    })

    //Call polygon draw function if row is removed
    $('#pg_body').on("change", "input", function () {
        trigger_polygon();
    })


    // create polygon
    function trigger_polygon() {
        // plotter draws polygon and returns the polygons Points (Point class) in a list.
        var point_list = plt.draw_polygon();

        // add polygon to session
        session.mkap.cross_section = new crsn.PolyGon(point_list)
        //session.mkap.cross_section.return_x_on_axis()
        $("#area").html("Area: " + session.mkap.cross_section.area())
    }

    
    // compression stress strain
    var trigger_comp_strain = function () {
        var strain = document.getElementsByClassName("comp_strain")
        var stress = document.getElementsByClassName("comp_stress")
        plt.draw_lines(plt.svg_comp, strain, stress)

        strain = extract_floats(strain)
        stress = extract_floats(stress)
        strain.unshift(0)
        stress.unshift(0)
    
        // reduce with the material factor
        for (var i = 0; i < stress.length; i++) {
            stress[i] /= parseFloat($("#comp_material_factor").val())
        }
        session.mkap.compressive_diagram = new mkap.StressStrain(strain, stress)
    }


    $('#comp_curve_body').on('change', 'input', function () {
        $("#compression_material").val('custom')
        trigger_comp_strain();
    });

    $('#comp_curve_body').on('click', '.remove_row', function () {
        $("#compression_material").val('custom')
        $(this).closest('.custom_row').remove()
        trigger_comp_strain();
    });


    // tensile stress strain
    var trigger_tens_strain = function () {
        var strain = document.getElementsByClassName("tens_strain")
        var stress = document.getElementsByClassName("tens_stress")

        // remove old svg
        $('#tens_strain_svg_div').find('svg').remove()

        var svg = plt.add_svg("#tens_strain_svg_div")
        plt.draw_lines(svg, strain, stress)

        strain = extract_floats(strain)
        stress = extract_floats(stress)
        strain.unshift(0)
        stress.unshift(0)
        session.mkap.tensile_diagram = new mkap.StressStrain(strain, stress)
    }

    $('#tens_curve_body').on('change', 'input', function () {
        trigger_tens_strain();
    });

    $('#tens_curve_body').on('click', '.remove_row', function () {
        $(this).closest('.custom_row').remove()
        trigger_tens_strain();
    });

    /** rebar stress strain
    There can be more than one rebar stress strain diagram
    */

    var trigger_rebar_strain = function (parent) {
        // find the panel that send the request.
        var id = parent.attr('id');
        var strain = $('#' + id).find('.rebar_strain');
        var stress = $('#' + id).find('.rebar_stress');
        
        // remove old svg
        $('#' + id).find('svg').remove()
        // add new svg
        
        var svg = plt.add_svg('#rebar_svg_' + id[id.length - 1])
        plt.draw_lines(svg, strain, stress)

        strain = extract_floats(strain)
        stress = extract_floats(stress)
        strain.unshift(0)
        stress.unshift(0)

        var fact = parseFloat($(parent).find(".rebar_material_factor").val())
        // reduce with the material factor
        for (var i = 0; i < stress.length; i++) {
            stress[i] /= fact
            strain[i] /= fact
        }
        var rebar_number = id[id.length - 1]
        session.rebar_diagrams[rebar_number - 1] = new mkap.StressStrain(strain, stress)
    }

    $('.rebar_curve').on('click', '.remove_row', function () {
        var parent = $(this).closest('.rebar_curve');
        $(this).closest('.custom_row').remove();
        trigger_rebar_strain(parent);
        $(parent).find(".rebar_material").val("custom")
    })

    $('.rebar_curve').on('change', 'input', function () {
        var parent = $(this).closest('.rebar_curve')
        trigger_rebar_strain(parent);
        $(parent).find(".rebar_material").val("custom")
    });


    // rebar area
    function trigger_rebar_input() {
        var As = document.getElementsByClassName("rebar_As")
        var d = document.getElementsByClassName("rebar_d")
        var rebar_diagram = document.getElementsByClassName("rebar_material_select")

        As = extract_floats(As)
        d = extract_floats(d)

        var height = session.mkap.cross_section.top
  
        for (var i = 0; i < As.length; i++) {
            var z = height - d[i]
            
            // The corresponding rebar material
            var no_of_diagram = rebar_diagram[i].value[rebar_diagram[i].value.length - 1]

            // add the rebar in the correct order to the mkap
            session.mkap.rebar_As[i] = As[i]
            session.mkap.rebar_z[i] = z
            session.mkap.rebar_diagram[i] = session.rebar_diagrams[no_of_diagram - 1]
        }
    }
    
    $('.rebar_input').on('click', '.remove_row', function () {
        $(this).closest('.custom_row').remove();
        
        trigger_rebar_input();
    })

    $('.rebar_input').on('change', 'input', function () {
        trigger_rebar_input();
    });

    var calculate_mkappa = function () {
        trigger_rebar_input()
        trigger_comp_strain()
        trigger_comp_strain()

        // remove old svg
        $('.mkappa_svg').find('svg').remove()
        // add new svg
        var svg = plt.add_svg('.mkappa_svg')
        //plt.draw_lines(svg, strain, stress)

        var sol = session.calculate_significant_points()
        var moment = sol.moment
        var kappa = sol.kappa

        moment.unshift(0)
        kappa.unshift(0)

        plt.draw_lines(svg, kappa, moment, true)

        var html_moment = Math.round(Math.max.apply(null, moment) / Math.pow(10, 6) * 100) / 100
        $("#MRd").removeClass("hidden")
        $("#MRd").html("Maximum moment: %s * 10^6".replace("%s", html_moment))

    }

    $('#calculate').click(function () {
        calculate_mkappa()
    });


    // Material library

    // compression material
    $("#compression_material").change(function () {
        if (this.value !== "custom") {
            // get the value between 'C' and '/' in for instance C20/25
            var end_index = this.value.indexOf('/')
            var fc = this.value.substring(1, end_index)

            // 3 input rows are needed. Two for the material. 1 hidden.
            var n = document.getElementsByClassName("comp_strain").length;

            for (n; n < 3; n++) {
                add_row($("#compression_add_row"));

            };
            for (n; n > 3; n--) {
                var row = $("#comp_curve_body").children(".custom_row").last();
                remove_row(row);
            }
            $("#comp_curve_body").find(".comp_strain")[1].value = 1.75
            $("#comp_curve_body").find(".comp_strain")[2].value = 3.5
            $("#comp_curve_body").find(".comp_stress")[1].value = fc
            $("#comp_curve_body").find(".comp_stress")[2].value = fc
            trigger_comp_strain()
        }
    })
   
    // rebar material
    $(".rebar_material").change(function () {
        if (this.value !== "custom") {
            // get the value between after 'B' in for instance 'B500'
            
            var fy = this.value.substring(1, 4)

            // 3 input rows are needed. Two for the material. 1 hidden.
            parent = $(this).closest(".rebar_curve");
            var n = $(parent).find(".rebar_strain").length;
          
     
            for (n; n < 3; n++) {
                add_row($(parent).find(".add_row"));

            };
            for (n; n > 3; n--) {
                var row = $(parent).children(".custom_row").last();
                remove_row(row);
            }
            $(parent).find(".rebar_strain")[1].value = parseFloat(fy) / 200
            $(parent).find(".rebar_strain")[2].value = 50
            $(parent).find(".rebar_stress")[1].value = fy
            $(parent).find(".rebar_stress")[2].value = fy
            trigger_rebar_strain(parent)
        }
    })

});


//class
function Session() {
    this.mkap = null
    // the diagrams in order
    this.rebar_diagrams = []
    
}


Session.prototype.calculate_significant_points = function () {
    /**
    session.mkap.cross_section = new crsn.PolyGon(
    [new vector.Point(0, 0),
    new vector.Point(200, 0),
    new vector.Point(200, 200),
    new vector.Point(0, 200),
    new vector.Point(0, 0)
    ]);
    session.mkap.tensile_diagram = new mkap.StressStrain([0], [0])
    session.mkap.compressive_diagram = new mkap.StressStrain([0, 1.75, 3.5], [0, 20, 20])
    session.mkap.rebar_As = [1200]
    session.mkap.rebar_z = [20]
    session.mkap.rebar_diagram = [new mkap.StressStrain([0, 2.175, 100], [0, 435, 435])]

    
    console.log(
        session.mkap.compressive_diagram, 'comp\n',
        session.mkap.tensile_diagram, 'tens\n',
        session.mkap.rebar_As, 'as\n',
        session.mkap.rebar_z, 'z\n',
        session.mkap.rebar_diagram, 'rebar diagram\n',
        session.mkap.cross_section, "cross_section")


    /** 
    determines the moment and kappa points for the given significant strain points in the compression stress strain diagram
    */
    var moment = []
    var kappa = []

    // Solve for significant points in compression diagram
    for (var i = 1; i < this.mkap.compressive_diagram.strain.length; i++) {
        var strain = this.mkap.compressive_diagram.strain[i]

        this.mkap.solver(true, strain)
        this.mkap.det_m_kappa()

        if (std.is_number(this.mkap.moment) && std.is_number(this.mkap.kappa)) {
            moment.push(Math.abs(this.mkap.moment))
            kappa.push(Math.abs(this.mkap.kappa))
        }
    }
    
    
    // Solve for significant points in tensile diagram
    for (var i = 1; i < this.mkap.tensile_diagram.strain.length; i++) {
        var strain = this.mkap.tensile_diagram.strain[i]
        
        this.mkap.solver(false, strain)
        this.mkap.det_m_kappa()

        if (std.is_number(this.mkap.moment) && std.is_number(this.mkap.kappa)) {
            moment.push(Math.abs(this.mkap.moment))
            kappa.push(Math.abs(this.mkap.kappa))
        }
    }

    
    // Solve for significant in the rebars material diagram. 
    //Loop for the variable number of rebar inputs
    for (var i = 0; i < this.mkap.rebar_As.length; i++) {

        // Loop for the siginificant points in the rebars material stress strain diagram.
        for (var a = 1; a < this.mkap.rebar_diagram[i].strain.length; a++) {
            var sign_strain = this.mkap.rebar_diagram[i].strain[a] // siginificant point

            top_str = sign_strain * 0.5  // start the iteration at the half of the rebar strain.
            // looper rebar
            this.mkap.solver(true, top_str, false)

            // iterate untill the convergence criteria is met
            var count = 0
            while (1) {
                if (std.convergence_conditions(sign_strain, this.mkap.rebar_strain[i], 1.01, 0.99)) {
                    if (window.DEBUG) {
                        console.log("rebar convergence after %s iterations".replace("%s", count))
                    }
                    this.mkap.det_m_kappa()

                    if (std.is_number(this.mkap.moment) && std.is_number(this.mkap.kappa)) {

                        moment.push(Math.abs(this.mkap.moment))
                        kappa.push(Math.abs(this.mkap.kappa))
                    }
                    break
                }

                var factor = std.convergence(this.mkap.rebar_strain[i], sign_strain)
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
    }
  
    return {
        moment,
        kappa
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