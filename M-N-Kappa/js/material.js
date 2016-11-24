// Material library

// compression material
var $compression_material = $("#compression_material");
$compression_material.on("change", function () {
    if (this.value !== "custom") {
        // get the value between 'C' and '/' in for instance C20/25
        var end_index = this.value.indexOf('/');
        var fc = this.value.substring(1, end_index);

        // 3 input rows are needed. Two for the material. 1 hidden.
        var n = document.getElementsByClassName("comp_strain").length;

        for (n; n < 3; n++) {
            add_row($("#compression_add_row"));

        }
        $slct = $("#comp_curve_body");
        for (n; n > 3; n--) {
            var row = $slct.children(".custom_row").last();
            remove_row(row);
        }

        $slct.find(".comp_strain")[1].value = 1.75;
        $slct.find(".comp_strain")[2].value = 3.5;
        $slct.find(".comp_stress")[1].value = fc;
        $slct.find(".comp_stress")[2].value = fc;
        trigger_comp_strain()
    }
});

// rebar material
$("#rebar_curves").on("change", ".rebar_material", function () {
    if (this.value !== "custom") {
        var fact = 1.15;
        $(parent).find(".rebar_material_factor").val(fact);

        // get the value between after 'B' in for instance 'B500'

        var fy = this.value.substring(1, 4);

        // 3 input rows are needed. Two for the material. 1 hidden.
        var parent = $(this).closest(".rebar_curve");
        var n = $(parent).find(".rebar_strain").length;


        for (n; n < 3; n++) {
            add_row($(parent).find(".add_row_rbr_curves"));

        }
        for (n; n > 3; n--) {
            var row = $(parent).children(".custom_row").last();
            remove_row(row);
        }
        $(parent).find(".rebar_strain")[1].value = Math.round(parseFloat(fy) / 200 / fact * 1000) / 1000;
        $(parent).find(".rebar_strain")[2].value = 50;
        $(parent).find(".rebar_stress")[1].value = fy;
        $(parent).find(".rebar_stress")[2].value = fy;
        trigger_rebar_strain(parent)
    }
});

// compression stress strain
var trigger_comp_strain = function () {
    var strain = document.getElementsByClassName("comp_strain");
    var stress = document.getElementsByClassName("comp_stress");
    // remove old svg
    $("#comp_strain_svg_div").find('svg').remove();
    var svg = plt.add_svg("#comp_strain_svg_div", "strain", "stress");
    plt.draw_lines(svg, strain, stress);

    strain = extract_floats(strain);
    stress = extract_floats(stress);
    strain.unshift(0);
    stress.unshift(0);

    // reduce with the material factor
    for (var i = 0; i < stress.length; i++) {
        stress[i] /= parseFloat($("#comp_material_factor").val())
    }
    session.mkap.compressive_diagram = new mkap.StressStrain(strain, stress);
};

// tensile stress strain
var trigger_tens_strain = function () {
    var strain = document.getElementsByClassName("tens_strain");
    var stress = document.getElementsByClassName("tens_stress");

    // remove old svg
    $('#tens_strain_svg_div').find('svg').remove();

    var svg = plt.add_svg("#tens_strain_svg_div", "strain", "stress");
    plt.draw_lines(svg, strain, stress);

    strain = extract_floats(strain);
    stress = extract_floats(stress);
    strain.unshift(0);
    stress.unshift(0);

    // reduce with the material factor
    for (var i = 0; i < stress.length; i++) {
        stress[i] /= parseFloat($("#tens_material_factor").val())
    }

    session.mkap.tensile_diagram = new mkap.StressStrain(strain, stress)
};
$slct = $('#tens_curve_body');
$slct.on('change', 'input', function () {
    trigger_tens_strain();
});

$slct.on('click', '.remove_row', function () {
    $(this).closest('.custom_row').remove();
    trigger_tens_strain();
});


/** rebar stress strain
 There can be more than one rebar stress strain diagram
 */

var trigger_rebar_strain = function (parent) {

    // find the panel that send the request.
    var id = parent.attr('id');
    $slct = $('#' + id);
    var strain = $slct.find('.rebar_strain');
    var stress = $slct.find('.rebar_stress');

    // remove old svg
    $slct.find('svg').remove();
    // add new svg

    var svg = plt.add_svg('#rebar_svg_' + id[id.length - 1], "strain", "stress");
    plt.draw_lines(svg, strain, stress);

    strain = extract_floats(strain);
    stress = extract_floats(stress);
    strain.unshift(0);
    stress.unshift(0);

    var fact = parseFloat($(parent).find(".rebar_material_factor").val());
    // reduce with the material factor
    for (var i = 0; i < stress.length; i++) {
        stress[i] /= fact
    }
    var rebar_number = id[id.length - 1];
    session.rebar_diagrams[rebar_number - 1] = new mkap.StressStrain(strain, stress)
};

$slct = $('#rebar_curves');
$slct.on('click', '.remove_row', function () {
    var parent = $(this).closest('.rebar_curve');
    $(this).closest('.custom_row').remove();
    trigger_rebar_strain(parent);
    $(parent).find(".rebar_material").val("custom")
});

$slct.on('click', '.add_row_rbr_curves', function () {
    var $row = $(this).closest(".rebar_curve").find(".custom_row").last();
    var $clone = $row.clone();
    $clone.removeClass('hidden');
    $row.after($clone);
});

$slct.on('change', 'input', function () {
    var parent = $(this).closest('.rebar_curve');
    trigger_rebar_strain(parent);
    $(parent).find(".rebar_material").val("custom")
});

$slct.on("change", ".prestress_checkbox", function () {
    if ($(this).is(":checked")) {
        $(this).closest(".checkbox").find(".prestress_input").removeAttr("disabled")
    }
    else {
        $(this).closest(".checkbox").find(".prestress_input").prop("disabled", true)
    }
});



// add extra rebar curves (stress strain diagrams)
var n_rebar_curves = 1;
$("#add_rbr_diagram").click(function () {
    n_rebar_curves += 1;
    $slct = $(".rebar_curve");
    var clone = $slct.last().clone().removeClass("hidden");
    clone.attr("id", "rebar_curve_" + n_rebar_curves);
    var svg = clone.find(".rebar_strain_svg_div");
    svg.attr("id", "rebar_svg_" + n_rebar_curves);
    $slct.last().after(clone);
    $(".diagram_header").last().html("Diagram #" + n_rebar_curves);
    trigger_rebar_strain(clone);

    // Append the diagram options at the rebar input fields
    $(".rebar_material_select").append("<option>diagram #%d</option>".replace("%d", n_rebar_curves));
});



// Watch on #rebar_curves to add rows for every new diagram.
// Do not forget to change the numbering of the id's when making a clone.


$slct = $('.rebar_input');
$slct.on('click', '.remove_row', function () {
    $(this).closest('.custom_row').remove();
    trigger_rebar_input();
});

$slct.on('change', 'input', function () {
    trigger_rebar_input();
});

$slct.on('click', '.add_row', function () {
    trigger_rebar_input();
});


$(document).ready();
{
// setting up the presettings
    $compression_material.val("C20/25");
    $compression_material.trigger("change");
    $slct = $(".rebar_material");
    $slct[1].value = "B500";
    $slct.last().trigger("change");
    $slct = $("#cross_section_type");
    $slct.val("rectangle");
    $slct.trigger("change");

    trigger_tens_strain();
    trigger_polygon();
    $(".rebar_d").trigger("change");
}