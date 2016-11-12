﻿/**
Note to self:
    The plotter also adds the objects uses for calculations to the sessions
*/

"use strict";
var DEBUG = true;

$(document).ready(function () {

    $('[data-toggle="tooltip"]').tooltip();

    // General collapse panel logic
    $(".collapse_glyph").click(function () {
        $(this).closest(".panel").children(".collapse").toggle();
        $(this).toggleClass('glyphicon-triangle-top glyphicon-triangle-bottom')
    });

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

    $(".panel").on("click", ".remove_row", function () {
        remove_row($(this))
    });



    var $slct = $('#pg_body');
    //Call polygon draw function if row is removed
    $slct.on("click", ".remove_row", function () {
        $(this).closest('.custom_row').remove()
        trigger_polygon();
    });

    //Call polygon draw function if row is removed
    $slct.on("change", "input", function () {
        trigger_polygon();
    });

    //Call polygon draw function if row is removed
    $slct.on("change", "input", function () {
        trigger_polygon();
    });

    function rotate_pg(rotation, x, y) {

        for (var i = 0; i < x.length; i++) {
            var p = new vector.Point(x[i], y[i]);
            p = p.rotate_origin(rotation / 360 * 2 * Math.PI);
            x[i] = p.x;
            y[i] = p.y;
        }
        return {
            x: x,
            y: y
        }
    }

    // create polygon
    function trigger_polygon() {
        // plotter draws polygon and returns the polygons Points (Point class) in a list.
        var $slct = $("#pg_rotation");
        var rotation = (isNaN(parseFloat($slct.val()))) ? 0 : parseFloat($slct.val());
        var choice = $("#cross_section_type").val();
        if (choice == "custom") {
            x = document.getElementsByClassName("xval");
            y = document.getElementsByClassName("yval");
            x = plt.input_strings_to_floats(x);
            y = plt.input_strings_to_floats(y);
            x.unshift(0);
            y.unshift(0);
            var rotation_pg = rotate_pg(rotation, x, y);
            x = rotation_pg.x;
            y = rotation_pg.y;
            point_list = plt.draw_polygon(x, y, session);
            // add polygon to session
            $("#area").html("area: " + session.mkap.cross_section.area())
        }
        else if (choice == "rectangle") {
            var width = parseFloat(document.getElementById("width").value);
            var height = parseFloat(document.getElementById("height").value);
            x = [0, width, width, 0];
            y = [0, 0, height, height];

            rotation_pg = rotate_pg(rotation, x, y);
            x = rotation_pg.x;
            y = rotation_pg.y;

            if (width > 0 && height > 0) {
                point_list = plt.draw_polygon(x, y, session);
                //session.mkap.cross_section = new crsn.PolyGon(point_list)
                $("#area").html("Area: " + session.mkap.cross_section.area())
            }
        }
        else if (choice == "T-beam" || choice == "I-beam") {
            /**
            w_w = width of the web
            h_f = height of the flange
            etc.
            */
            var w_w = parseFloat(document.getElementById("T-beam_width_w").value);
            var w_f = parseFloat(document.getElementById("T-beam_width_f").value);
            var h_w = parseFloat(document.getElementById("T-beam_height_w").value);
            var h_f = parseFloat(document.getElementById("T-beam_height_f").value);

            if (choice == "T-beam") {
                var x = [0.5 * w_w, 0.5 * w_w, 0.5 * w_f, 0.5 * w_f, -0.5 * w_f, -0.5 * w_f, -0.5 * w_w, -0.5 * w_w];
                var y = [0, h_w, h_w, h_f + h_w, h_f + h_w, h_w, h_w, 0];
            }
            else if (choice == "I-beam") {
                var x = [0.5 * w_f, 0.5 * w_f, 0.5 * w_w, 0.5 * w_w, 0.5 * w_f, 0.5 * w_f, -0.5 * w_f, -0.5 * w_f, -0.5 * w_w, -0.5 * w_w, -0.5 * w_f, -0.5 * w_f];
                var y = [0, h_f, h_f, h_w + h_f, h_w + h_f, 2 * h_f + h_w, 2 * h_f + h_w, h_w + h_f, h_w + h_f, h_f, h_f, 0];
            }

            rotation_pg = rotate_pg(rotation, x, y);
            x = rotation_pg.x;
            y = rotation_pg.y;

            if (w_w > 0 && w_f > 0 && h_w > 0 && h_f > 0) {
                var point_list = plt.draw_polygon(x, y, session);
                //session.mkap.cross_section = new crsn.PolyGon(point_list)
                $("#area").html("Area: " + session.mkap.cross_section.area())
            }
        }
        else if (choice == "circle") {
            var radius = parseFloat(document.getElementById("circle_radius").value);
            session.mkap.cross_section = new crsn.Circle(radius);
            plt.draw_polygon(session.mkap.cross_section.point_list, "notused", session, false);
            $("#area").html("Area: " + session.mkap.cross_section.area())
        }
    }

    
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

    function trigger_normal_force() {
        var N = parseFloat($("#normal_force").val()) * 1e3;
        if (isNaN(N)) {
            N = 0
        }
        session.mkap.normal_force = N
    }

    $("#normal_force").change(function () {
        trigger_normal_force()
    });
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
    }

    $('#tens_curve_body').on('change', 'input', function () {
        trigger_tens_strain();
    });

    $('#tens_curve_body').on('click', '.remove_row', function () {
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

    $slct = $('#rebar_curves')
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

    // add extra rebar curves (stress strain diagrams)
    var n_rebar_curves = 1;
    $("#add_rbr_diagram").click(function () {
        n_rebar_curves += 1;
        $slct = $(".rebar_curve")
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
 
    // rebar area
    function trigger_rebar_input() {
        // reset
        session.mkap.rebar_As = [];
        session.mkap.rebar_z = [];
        session.mkap.rebar_diagram = [];

        var As = document.getElementsByClassName("rebar_As");
        var d = document.getElementsByClassName("rebar_d");
        var rebar_diagram = document.getElementsByClassName("rebar_material_select");
        $slct = $("#option_rebar_results");
        $slct.empty();

        As = extract_floats(As);
        d = extract_floats(d);
        
        var height = session.mkap.cross_section.top;
        
        for (var i = 0; i < As.length; i++) {
            var z = height - d[i];
            
            // The corresponding rebar material
            var no_of_diagram = rebar_diagram[i].value[rebar_diagram[i].value.length - 1];

            // add the rebar in the correct order to the mkap
            session.mkap.rebar_As[i] = As[i];
            session.mkap.rebar_z[i] = z;
            session.mkap.rebar_diagram[i] = session.rebar_diagrams[no_of_diagram - 1];

            // set the rebar options in the results table
            $slct.append("<option>rebar row #%s</option>".replace("%s", i + 1))
        }
        trigger_polygon();
    }
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



    var calculate_mkappa = function () {
        trigger_rebar_input();
        trigger_comp_strain();

        // remove old svg
        $('.mkappa_svg').find('svg').remove();
        // add new svg
        var svg = plt.add_svg('.mkappa_svg', "curvature", "bending moment  [*10^6]");


        var sol = session.calculate_significant_points();
        var moment = sol.moment;
        var kappa = sol.kappa;
        
        moment.unshift(0);
        kappa.unshift(0);

        plt.draw_lines(svg, kappa, moment.map(function (i) {
            return i / 1e6
        }), true);

        var html_moment = Math.round(Math.max.apply(null, moment) / Math.pow(10, 6) * 100) / 100;
        var $MRD = $("#MRd");
        $MRD.removeClass("hidden");
        $MRD.html("maximum moment: %s * 10<sup>6</sup>".replace("%s", html_moment));
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
            $slct .last().find(".significant_moment").html(Math.round(session.moment_compression[i] / 1e4) / 100);
            $slct .last().find(".signifcant_row_no").last().html(i + 1);
            $slct .last().find(".significant_kappa").last().html(Math.round(session.kappa_compression[i] * 1000) / 1000);
            $slct .last().find(".significant_stress").last().html(Math.round(session.sign_stress_comp[i] * 100) / 100);
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
    };

    $('#calculate').click(function () {
        calculate_mkappa()
    });

    //-- Set rebar result table

    function update_rebar_results(index) {
        $slct = $(".results_table_rebar_diagram")
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
        var class_name = $($rows[index])[0].className;
        if (class_name == "results_table_row_comp"){
            mkap = session.sign_compression_mkap[index]
        }
        else if (class_name == "results_table_body_rbr") {
            mkap = session.sign_rebar_mkap[index]
        }
        else if (class_name == "results_table_body_tens") {
            mkap = session.sign_tensile_mkap[index]
        }

        $("#myModal").modal();
        $("#modal-svg").find("svg").remove();
        plt.cross_section_view("#modal-svg", mkap)

    });

    // Material library

    // compression material
    $("#compression_material").on("change", function () {
        if (this.value !== "custom") {
            // get the value between 'C' and '/' in for instance C20/25
            var end_index = this.value.indexOf('/');
            var fc = this.value.substring(1, end_index);

            // 3 input rows are needed. Two for the material. 1 hidden.
            var n = document.getElementsByClassName("comp_strain").length;

            for (n; n < 3; n++) {
                add_row($("#compression_add_row"));

            }
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
    //$(".rebar_material").change(function () {
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

            };
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
    

    // cross-section type
    $("#cross_section_type").change(function () {
        if (this.value == "rectangle") {
            $(".cross_section_type").addClass("hidden")
            $("#rectangle_rows").removeClass("hidden")
        }
        else if (this.value == "custom") {
            $(".cross_section_type").addClass("hidden")
            $("#polygon_rows").removeClass("hidden")
        }
        else if (this.value == "T-beam" || this.value == "I-beam") {
            $(".cross_section_type").addClass("hidden")
            $("#T-beam_rows").removeClass("hidden")
        }
        else if (this.value == "circle") {
            $(".cross_section_type").addClass("hidden")
            $("#circle_rows").removeClass("hidden")
        }
        trigger_polygon()
    });



    // setting up the presettings
    $("#compression_material").val("C20/25")
    $("#compression_material").trigger("change")
    $(".rebar_material")[1].value = "B500"
    $(".rebar_material").last().trigger("change")
    $("#cross_section_type").val("rectangle")
    $("#cross_section_type").trigger("change")
    
    trigger_tens_strain()

    $("#width").val(400)
    $("#height").val(500)
    trigger_polygon()
    $(".rebar_As").trigger("change")
   
    // Logic for collapsing the input divs
    $("#collapse_polygon").collapse("show");
    $("#comp_curve").find(".panel-collapse").collapse("show");
    $("#tens_curve").find(".panel-collapse").collapse("show");
    $("#rebar_input").find(".panel-collapse").collapse("show");
    $("#rebar_curve_1").closest(".panel-collapse").collapse("show");
    $(".cstm_right_column").find(".panel-collapse").collapse("show");

       

});


