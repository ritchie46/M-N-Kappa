/**
Note to self:
    The plotter also adds the objects uses for calculations to the sessions
*/

"use strict"
var DEBUG = true

$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();

    // General collapse panel logic
    $(".collapse_glyph").click(function () {
        $(this).closest(".panel").children(".collapse").toggle()
        $(this).toggleClass('glyphicon-triangle-top glyphicon-triangle-bottom')
    });

    // General add row logic
    function add_row(self) {
        var $row = self.closest(".panel-body").find(".custom_row").last();
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

    //Call polygon draw function if row is removed
    $('#pg_body').on("change", "input", function () {
        trigger_polygon();
    });


    // create polygon
    function trigger_polygon() {
        // plotter draws polygon and returns the polygons Points (Point class) in a list.
        var choice = $("#cross_section_type").val()
        if (choice == "custom") {
            var x = document.getElementsByClassName("xval")
            var y = document.getElementsByClassName("yval")
            var point_list = plt.draw_polygon(x, y);
            // add polygon to session
            session.mkap.cross_section = new crsn.PolyGon(point_list)
            //session.mkap.cross_section.return_x_on_axis()
            $("#area").html("Area: " + session.mkap.cross_section.area())
        }
        else if (choice == "rectangle") {
            var width = parseFloat(document.getElementById("width").value);
            var height = parseFloat(document.getElementById("height").value);
            var x = [width, width, 0];
            var y = [0, height, height];
            if (width > 0 && height > 0) {
                var point_list = plt.draw_polygon(x, y);
                session.mkap.cross_section = new crsn.PolyGon(point_list)
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
            };

            if (w_w > 0 && w_f > 0 && h_w > 0 && h_f > 0) {
                var point_list = plt.draw_polygon(x, y);
                session.mkap.cross_section = new crsn.PolyGon(point_list)
                $("#area").html("Area: " + session.mkap.cross_section.area())
            }
        }
          
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

    function trigger_normal_force() {
        var N = parseFloat($("#normal_force").val()) * 1e3
        if (isNaN(N)) {
            N = 0
        }
        session.mkap.normal_force = N
    }

    $("#normal_force").change(function () {
        trigger_normal_force()
    })

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
        // reset
        session.mkap.rebar_As = []
        session.mkap.rebar_z = []
        session.mkap.rebar_diagram = []

        var As = document.getElementsByClassName("rebar_As")
        var d = document.getElementsByClassName("rebar_d")
        var rebar_diagram = document.getElementsByClassName("rebar_material_select")
        $("#option_rebar_results").empty()

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

            // set the rebar options in the results table
            $("#option_rebar_results").append("<option>rebar row #%s</option>".replace("%s", i + 1))
        }
    }
    
    $('.rebar_input').on('click', '.remove_row', function () {
        $(this).closest('.custom_row').remove();
        trigger_rebar_input();
    })

    $('.rebar_input').on('change', 'input', function () {
        trigger_rebar_input();
    });

    $('.rebar_input').on('click', '.add_row', function () {
        trigger_rebar_input();
    });


    //-- Set rebar result table



    function update_rebar_results(index) {

        // tensile results table
        if ($(".results_table_rebar_diagram").length > 1) {
            $(".results_table_rebar_diagram").last().remove()
        }

        var table = $(".results_table_rebar_diagram").first().clone().removeClass("hidden")
        $("#result_table_div_rbr").append(table)

        for (var i = 0; i < session.moment_rebar[index].length; i++) {
            $(".results_table_row_rbr").last().find(".signifcant_moment").html(Math.round(session.moment_rebar[index][i] / 1e4) / 100)
            $(".results_table_row_rbr").last().find(".signifcant_row_no").last().html(i + 1)
            $(".results_table_row_rbr").last().find(".signifcant_kappa").last().html(Math.round(session.kappa_rebar[index][i] * 100) / 100)
            $(".results_table_row_rbr").first().clone().insertAfter($(".results_table_row_rbr").last())
        }
    }
    
    $("#result_table_div_rbr").on("change", "#option_rebar_results", function () {
        var index = parseInt($("#option_rebar_results").val().replace("rebar row #", "")) - 1
        update_rebar_results(index)
    })



    var calculate_mkappa = function () {
        trigger_rebar_input()
        trigger_comp_strain()
        trigger_comp_strain()

        // remove old svg
        $('.mkappa_svg').find('svg').remove()
        // add new svg
        var svg = plt.add_svg('.mkappa_svg')


        var sol = session.calculate_significant_points()
        var moment = sol.moment
        var kappa = sol.kappa

        moment.unshift(0)
        kappa.unshift(0)

        plt.draw_lines(svg, kappa, moment, true)

        var html_moment = Math.round(Math.max.apply(null, moment) / Math.pow(10, 6) * 100) / 100
        $("#MRd").removeClass("hidden")
        $("#MRd").html("Maximum moment: %s * 10<sup>6</sup>".replace("%s", html_moment))

        //-- display results in result tables --//

        // compression results table
        if ($(".results_table_compression_diagram").length > 1) {
            $(".results_table_compression_diagram").last().remove()
        }

        var table = $(".results_table_compression_diagram").first().clone().removeClass("hidden")
        $("#result_table_div_comp").append(table)

        for (var i = 0; i < session.moment_compression.length; i++) {
            $(".results_table_row_comp").last().find(".signifcant_moment").html(Math.round(session.moment_compression[i] / 1e4) / 100)
            $(".results_table_row_comp").last().find(".signifcant_row_no").last().html(i + 1)
            $(".results_table_row_comp").last().find(".signifcant_kappa").last().html(Math.round(session.kappa_compression[i] * 100) / 100)
            $(".results_table_row_comp").first().clone().insertAfter($(".results_table_row_comp").last())
        }

        // tensile results table
        if ($(".results_table_tensile_diagram").length > 1) {
            $(".results_table_tensile_diagram").last().remove()
        }

        var table = $(".results_table_tensile_diagram").first().clone().removeClass("hidden")
        $("#result_table_div_tens").append(table)

        for (var i = 0; i < session.moment_tensile.length; i++) {
            $(".results_table_row_tens").last().find(".signifcant_moment").html(Math.round(session.moment_tensile[i] / 1e4) / 100)
            $(".results_table_row_tens").last().find(".signifcant_row_no").last().html(i + 1)
            $(".results_table_row_tens").last().find(".signifcant_kappa").last().html(Math.round(session.kappa_tensile[i] * 100) / 100)
            $(".results_table_row_tens").first().clone().insertAfter($(".results_table_row_tens").last())
        }

        // rebar results table
        update_rebar_results(0)
    }

    $('#calculate').click(function () {
        calculate_mkappa()
    });


    // Material library

    // compression material
    $("#compression_material").on("change", function () {
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
            var fact = 1.15
            $(parent).find(".rebar_material_factor").val(fact)

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
            $(parent).find(".rebar_strain")[1].value = Math.round(parseFloat(fy) / 200 / fact * 1000) / 1000
            $(parent).find(".rebar_strain")[2].value = 50
            $(parent).find(".rebar_stress")[1].value = fy
            $(parent).find(".rebar_stress")[2].value = fy
            trigger_rebar_strain(parent)
        }
    })
    

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
    });



    // setting up the presettings
    $("#compression_material").val("C20/25")
    $("#compression_material").trigger("change")
    $(".rebar_material").val("B500")
    $(".rebar_material").trigger("change")
    $("#cross_section_type").val("rectangle")
    $("#cross_section_type").trigger("change")
    $("#width").val(500)
    $("#height").val(800)
    trigger_polygon()



    // Logic for collapsing the input divs
    $("#collapse_polygon").collapse("show");
    $("#comp_curve").find(".panel-collapse").collapse("show");
    $("#rebar_input").find(".panel-collapse").collapse("show");
    $("#rebar_curve_1").closest(".panel-collapse").collapse("show");
    $(".cstm_right_column").find(".panel-collapse").collapse("show");

       

});


