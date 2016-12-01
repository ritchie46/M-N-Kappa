/**
Note to self:
    The plotter also adds the objects uses for calculations to the sessions
*/

"use strict";
var DEBUG = true;

// General add row logic
function add_row(self) {
    var $row = self.closest(".panel-body").find(".custom_row").last();
    var $clone = $row.clone();
    $clone.removeClass('hidden');
    $row.after($clone);
}

$(".add_row").click(function () {
    add_row($(this))
});

// General remove panel row logic
function remove_row(self) {
    self.closest('.custom_row').remove()
}

$("#print_btn").click(function () {
    print()
});

$(document).ready(function () {

    $('[data-toggle="tooltip"]').tooltip();

    $(".clickable").hover(function() {
        $(this).css('cursor','pointer');
    });

    // General collapse panel logic
    $(".collapse_glyph").click(function () {
        $(this).closest(".panel").children(".collapse").toggle();
        $(this).toggleClass('glyphicon-triangle-top glyphicon-triangle-bottom')
    });


    $(".panel").on("click", ".remove_row", function () {
        remove_row($(this))
    });

    $(".main_navbar").click(function () {
        $(".main_navbar").removeClass("active");
        $(this).addClass("active");
        $(".main_columns").addClass("hidden");

        if (this.id == "rebar_nav"){
            $("#rebar_column").removeClass("hidden")
        }
        else if (this.id == "results_nav"){
            $("#results_column").removeClass("hidden")
        }
        else if (this.id == "geometry_nav"){
            $("#geometry_column").removeClass("hidden")
        }
    });

    $("#calculation_type").on("change", function () {
        $(".calculation_type").addClass("hidden");
        if ($(this).val() == "search moment") {
            $("#calculation_type_moment").removeClass("hidden")
        }
    });


    function trigger_normal_force() {
        var N = parseFloat($("#normal_force").val()) * 1e3;
        if (isNaN(N)) {
            N = 0
        }
        session.mkap.normal_force = N
    }

    $slct = $('#comp_curve_body');
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
            if (session.pre_prestress() == 1) {
                return 1;  // calculation not possible
            }
        }

        // remove old svg
        $('.mkappa_svg').find('svg').remove();
        // add new svg
        var svg = plt.add_svg('.mkappa_svg', "curvature", "bending moment  [*10^6]");

        $(".result_output").addClass("hidden");
        var option = $("#calculation_type").val();

        if (option == "search moment") {
            moment = -parseFloat($("#moment_input").val()) * Math.pow(10, 6);
            session.apply_m0();
            if (session.compute_prestress) {
                var sol = session.compute_moment(moment, false);
            }
            else {
                sol = session.compute_moment(moment, true);
            }
            if (sol == 0) {
                plt.cross_section_view("#modal-svg", session.mkap)
            }
            else {
                window.alert("No solution found.")
            }
        }
        else if (option == "discrete points") {
            $("#moment_kappa_diagram_output").removeClass("hidden");
            sol = session.compute_n_points(50);
            moment = sol.moment;
            kappa = sol.kappa;
            moment.push(-session.mkap.mp);
            kappa.push(0);
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
    };

    $('#calculate').click(function () {
        calculate_mkappa()
    });

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

    $("#result_table_div_rbr").on("change", "#option_rebar_results", function () {
        var index = parseInt($("#option_rebar_results").val().replace("rebar row #", "")) - 1;
        update_rebar_results(index)
    });

    $("#result_table_div_rbr, #result_table_div_tens, #result_table_div_comp").on("click", ".show_section_btn", function () {
        var $tbl_body = $(this).parent().parent().parent();

        var $rows = $tbl_body.children();

        for (var i = 0; i < $rows.length; i++) {
            if ($rows[i].isEqualNode($(this).parent().parent()[0])) {
                var index = i;
                break
            }
        }
        var mkappa;
        var class_name = $($rows[index])[0].className;
        if (class_name == "results_table_row_comp"){
            mkappa = session.sign_compression_mkap[index]
        }
        else if (class_name == "results_table_row_rbr") {
            var j = $("#option_rebar_results")[0].value.slice(-1) - 1;
            mkappa = session.sign_rebar_mkap[j][index]
        }
        else if (class_name == "results_table_row_tens") {
            mkappa = session.sign_tensile_mkap[index]
        }
        plt.cross_section_view("#modal-svg", mkappa)

    });

console.log("version_1-12")
});


