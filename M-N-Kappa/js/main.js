/**
Note to self:
    The plotter also adds the objects uses for calculations to the sessions
*/

"use strict";

// General add row logic
function add_row(self) {
    var $row = self.closest(".panel-body").find(".custom_row").last();
    var $clone = $row.clone();
    $clone.removeClass('hidden');
    $row.after($clone);
}

// General remove panel row logic
function remove_row(self) {
    self.closest('.custom_row').remove()
}

function trigger_normal_force() {
    var N = parseFloat($("#normal_force").val()) * 1e3;
    if (isNaN(N)) {
        N = 0
    }
    session.mkap.normal_force = N
}

var $slct = $('#comp_curve_body');
$slct.on('change', 'input', function () {
    $("#compression_material").val('custom');
    trigger_comp_strain();
});

$slct.on('click', '.remove_row', function () {
    $("#compression_material").val('custom');
    $(this).closest('.custom_row').remove();
    trigger_comp_strain();
});


var calculate_mkappa = function () {
    trigger_rebar_strain();
    trigger_normal_force();
    trigger_rebar_input();
    trigger_comp_strain();
    trigger_tens_strain();

    session.mkap.mp = 0;

    if (session.compute_prestress) {
        if (session.pre_prestress() === 1) {
            return 1;  // calculation not possible
        }
    }

    // remove old svg
    $('.mkappa_svg').find('svg').remove();
    // add new svg
    var svg = plt.add_svg('.mkappa_svg', "curvature", "bending moment  [*10⁶]");

    $(".result_output").addClass("hidden");
    var option = $("#calculation_type").val();

    if (option === "search moment") {
        moment = parseFloat($("#moment_input").val()) * Math.pow(10, 6);
        session.apply_m0();
        if (session.compute_prestress) {
            var sol = session.compute_moment(moment, false);
        }
        else {
            sol = session.compute_moment(moment, true);
        }
        if (sol === 0) {
            plt.cross_section_view("#modal-svg", session.mkap)
        }
        else {
            window.alert("No solution found.")
        }
    }
    else if (option === "discrete points") {
        $("#moment_kappa_diagram_output").removeClass("hidden");
        sol = session.compute_n_points(50);

        moment = sol.moment;
        kappa = sol.kappa;

        plt.moment_kappa(svg, kappa, moment.map(function (i) {
            return i / 1e6
        }), session);


    }
    else {
        $("#moment_kappa_diagram_output").removeClass("hidden");
        $("#significant_results_output").removeClass("hidden");
        sol = session.calculate_significant_points();
        var moment = sol.moment;
        var kappa = sol.kappa;

        moment.unshift(-session.mkap.mp);
        kappa.unshift(0);

        plt.moment_kappa(svg, kappa, moment.map(function (i) {
            return i / 1e6
        }), session);

        //-- display results in result tables --//

        // compression results table
        $slct = $(".results_table_compression_diagram");
        if ($slct.length > 1) {
            $slct.last().remove()
        }

        table = $slct.first().clone().removeClass("hidden");
        $("#result_table_div_comp").append(table);

        for (i = 0; i < session.moment_compression.length; i++) {
            $slct = $(".results_table_row_comp");
            $slct.last().find(".show_section_btn").removeClass("hidden");
            $slct.last().find(".significant_moment").html(Math.round(session.moment_compression[i] / 1e4) / 100);
            $slct.last().find(".signifcant_row_no").last().html(i + 1);
            $slct.last().find(".significant_kappa").last().html(Math.round(session.kappa_compression[i] * 1000) / 1000);
            $slct.last().find(".significant_stress").last().html(Math.round(session.sign_stress_comp[i] * 100) / 100);
            $slct.last().find(".significant_strain").last().html(Math.round(session.sign_strain_comp[i] * 1000) / 1000);
            $slct.first().clone().insertAfter($slct.last());
        }

        // tensile results table
        $slct = $(".results_table_tensile_diagram");
        if ($slct.length > 1) {
            $slct.last().remove()
        }

        var table = $slct.first().clone().removeClass("hidden");
        $("#result_table_div_tens").append(table);

        for (var i = 0; i < session.moment_tensile.length; i++) {
            $slct = $(".results_table_row_tens");
            $slct.last().find(".show_section_btn").removeClass("hidden");
            $slct.last().find(".significant_moment").html(Math.round(session.moment_tensile[i] / 1e4) / 100);
            $slct.last().find(".signifcant_row_no").last().html(i + 1);
            $slct.last().find(".significant_kappa").last().html(Math.round(session.kappa_tensile[i] * 1000) / 1000);
            $slct.last().find(".significant_stress").last().html(Math.round(session.sign_stress_tens[i] * 100) / 100);
            $slct.last().find(".significant_strain").last().html(Math.round(session.sign_strain_tens[i] * 1000) / 1000);
            $slct.first().clone().insertAfter($slct.last())
        }
        // rebar results table
        update_rebar_results(0)
    }

    // Axial force moment diagram
    if ($("#axial_checkbox").is(":checked")) {
        // remove old svg
        $('.axial_moment_svg').find('svg').remove();
        // add new svg
        svg = plt.add_svg('.axial_moment_svg', "bending moment [*10⁶]", "axial force  [*10³]");

        $("#axial_moment_diagram_output").removeClass("hidden");
        sol = session.axial_moment_diagram();
        moment = sol.moment;
        var axial = sol.axial;

        plt.draw_lines(svg, moment.map(function (i) {
            return i / 1e6
        }), axial.map(function (i) {
            return i / 1e3
        }), true, false);
    }
    else {
        $("#axial_moment_diagram_output").addClass("hidden");
    }
};



//-- Set rebar result table

function update_rebar_results(index) {
    $slct = $(".results_table_rebar_diagram");
    if ($slct.length > 1) {
        $slct.last().remove()
    }

    var table = $slct.first().clone().removeClass("hidden");
    $("#result_table_div_rbr").append(table);

    for (var i = 0; i < session.moment_rebar[index].length; i++) {
        $slct = $(".results_table_row_rbr");
        $slct.last().find(".show_section_btn").removeClass("hidden");
        $slct.last().find(".significant_moment").html(Math.round(session.moment_rebar[index][i] / 1e4) / 100);
        $slct.last().find(".signifcant_row_no").last().html(i + 1);
        $slct.last().find(".significant_kappa").last().html(Math.round(session.kappa_rebar[index][i] * 1000) / 1000);
        $slct.last().find(".significant_stress").last().html(Math.round(session.sign_stress_rbr[index][i] * 100) / 100);
        $slct.last().find(".significant_strain").last().html(Math.round(session.sign_strain_rbr[index][i] * 1000) / 1000);
        $slct.first().clone().insertAfter($slct.last())
    }
}







console.log("version_03-08");



