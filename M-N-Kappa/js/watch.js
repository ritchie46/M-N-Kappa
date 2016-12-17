"use strict";

var watch = function () {

    $("#btn_sbtrct").click(function () {
        $("#panel_sbtrct").toggleClass("hidden")
    });


    $(".add_row").click(function () {
        add_row($(this))
    });


    $("#print_btn").click(function () {
        print()
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



    $("#calculation_type").on("change", function () {
        $(".calculation_type").addClass("hidden");
        if ($(this).val() == "search moment") {
            $("#calculation_type_moment").removeClass("hidden")
        }
    });

    $('#calculate').click(function () {
        calculate_mkappa()
    });

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

    // geometry
    var $slct = $('#pg_body, #subtract_body');
//Call polygon draw function if row is removed
    $slct.on("click", ".remove_row", function () {
        $(this).closest('.custom_row').remove();
        trigger_polygon();
    });

//Call polygon draw function if row is removed
    $slct.on("change", "input", function () {
        trigger_polygon();
        trigger_rebar_input()
    });

//Call polygon draw function if row is removed
    $slct.on("change", "input", function () {
        trigger_polygon();
    });

    $("#cross_section_type").change(function () {
        cross_section_type_change(this)
    });

    watch_material()
};