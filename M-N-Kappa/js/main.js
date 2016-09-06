/**
Note to self:
    The plotter also adds the objects uses for calculations to the sessions
*/

"use strict"


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
    $(".add_row").click(function () {
        var $row = $(this).closest(".panel-body").children(".custom_row").last();
        var $clone = $row.clone()
        $clone.removeClass('hidden')
        $row.after($clone);
    })

    // General remove panel row logic
    $(".panel").on("click", ".remove_row", function () {
        $(this).closest('.custom_row').remove()
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
        session.mkap.cross_section.return_x_on_axis()
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
        session.mkap.compressive_diagram = new mkap.StressStrain(strain, stress)
    }


    $('#comp_curve_body').on('change', 'input', function () {
        trigger_comp_strain();
    });

    $('#comp_curve_body').on('click', '.remove_row', function () {
        $(this).closest('.custom_row').remove()
        trigger_comp_strain();
    });

    // tensile stress strain
    var trigger_tens_strain = function () {
        var strain = document.getElementsByClassName("tens_strain")
        var stress = document.getElementsByClassName("tens_stress")
        plt.draw_lines(plt.svg_tens, strain, stress)

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

    var trigger_rebar_strain = function ($location) {
        // find the panel that send the request.
        var id = $location.closest('.rebar_curve').attr('id');
        var strain = $('#' + id).find('.rebar_strain');
        var stress = $('#' + id).find('.rebar_stress');
        
        // remove old svg
        $('#' + id).find('svg').remove()
        // add new svg
        var svg = plt.set_stress_strain_svg('#rebar_svg_' + id[id.length - 1])
        plt.draw_lines(svg, strain, stress)

        strain = extract_floats(strain)
        stress = extract_floats(stress)
        strain.unshift(0)
        stress.unshift(0)

        var rebar_number = id[id.length - 1]
        session.mkap.rebar_diagram[rebar_number - 1] = new mkap.StressStrain(strain, stress)

    }

    $('.rebar_curve').on('click', '.remove_row', function () {
        var $location = $(this)
        $(this).closest('.custom_row').remove();
        trigger_rebar_strain($location);
    })

    $('.rebar_curve').on('change', 'input', function () {
        var $location = $(this)
        trigger_rebar_strain($location);
    });

 

});


//class
function Session() {
    this.mkap = null

}
// end class

var session = new Session()
session.mkap = new mkap.MomentKappa()


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