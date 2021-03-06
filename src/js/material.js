// Material library
// compression material
var $compression_material = $("#compression_material");

watch_material = function () {

    $("#compression_material").on("change", function () {
        // Count the amount of input rows.
        var n = $(".comp_strain").length;

        if (this.value != "custom") {
            var material = lib.concrete[this.value];

            // Add or remove rows if needed.
            for (n; n <= material.stress.length; n++) {
                add_row($("#compression_add_row"));
            }
            $slct = $("#comp_curve_body");
            for (n; n > material.stress.length + 1; n--) {
                var row = $slct.find(".custom_row").last();
                remove_row(row);
            }

            for (var j = 0; j < material.stress.length; j++) {
                $(".comp_strain")[j + 1].value = Math.round(material.strain[j] * 1000) / 1000;
                $(".comp_stress")[j + 1].value = Math.round(material.stress[j] * 100) / 100;
            }
            $("#comp_material_factor").value = material.gamma;
        }
        else {
            for (var i = 0; i < n - 2; i++) {
                var row = $("#comp_curve_body").find(".custom_row").last();
                remove_row(row)
            }
        }
        trigger_comp_strain();

    });

// reinforcement material diagram
    $("#rebar_curves").on("change", ".rebar_material", function () {

        if (this.value != "custom") {
            var material = lib.reinforcement[this.value];
            // Count the amount of input rows.
            var parent = $(this).closest(".rebar_curve");
            var n = $(parent).find(".rebar_strain").length;

            // Add or remove rows if needed.
            for (n; n <= material.stress.length; n++) {
                add_row($(parent).find(".add_row_rbr_curves"));
            }
            for (n; n > material.stress.length + 1; n--) {
                var row = $(parent).children(".custom_row").last();
                remove_row(row);
            }

            for (var j = 0; j < material.stress.length; j++) {
                $(parent).find(".rebar_strain")[j + 1].value = Math.round(material.strain[j] * 1000) / 1000;
                $(parent).find(".rebar_stress")[j + 1].value = material.stress[j]
            }
            $(parent).find(".rebar_material_factor")[0].value = material.gamma

        }
        trigger_rebar_strain()
    });

    $slct = $('#tens_curve_body');
    $slct.on('change', 'input', function () {
        trigger_tens_strain();
    });

    $slct.on('click', '.remove_row', function () {
        $(this).closest('.custom_row').remove();
        trigger_tens_strain();
    });

    $slct = $('#rebar_curves');
    $slct.on('click', '.remove_row', function () {
        var parent = $(this).closest('.rebar_curve');
        $(this).closest('.custom_row').remove();
        trigger_rebar_strain();
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
        trigger_rebar_strain();
        $(parent).find(".rebar_material").val("custom")
    });

    $slct.on("change", ".prestress_checkbox", function () {
        if ($(this).is(":checked")) {
            $(this).closest(".checkbox").find(".prestress_input").removeAttr("disabled")
        }
        else {
            $(this).closest(".checkbox").find(".prestress_input").prop("disabled", true)
        }
        toggle_phased();
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
        toggle_phased()
    });

    $slct.on('click', '.add_row', function () {
        trigger_rebar_input();
        toggle_phased()
    });

    $slct.on('change', ".rebar_material_select", function () {
        toggle_phased()
    });



};

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


/** rebar stress strain
 There can be more than one reinforcement stress strain diagram
 */

var trigger_rebar_strain = function () {
    for (var i = 1; i < $(".rebar_curve").length; i++) {
        var id = $($(".rebar_curve")[i]).attr('id');
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

        var fact = parseFloat($($(".rebar_curve")[i]).find(".rebar_material_factor").val());
        // reduce with the material factor
        for (var j = 0; j < stress.length; j++) {
            stress[j] /= fact;
            strain[j] /= fact
        }
        var rebar_number = id[id.length - 1];
        session.rebar_diagrams[rebar_number - 1] = new mkap.StressStrain(strain, stress);
    }
};



// Make sure that pre-stressed rebar is not phased!
function toggle_phased() {
    $(".rebar_M0").removeAttr("disabled");
    for (i = 0; i < $(".rebar_curve").length; i++) {
        var prestress = $($(".rebar_curve")[i]).find(".prestress_container").find(".prestress_checkbox").is(":checked");
        var n = parseInt($($(".rebar_curve")[i]).attr("id")[$($(".rebar_curve")[i]).attr("id").length -1]);

        if (prestress) {
            for (var j = 0; j < $(".rebar_material_select").length; j++) {

                var el = $(".rebar_material_select")[j];
                var n_2 = parseInt($(el).val()[$(el).val().length - 1]);

                if (n == n_2) {
                    var M0_input = $(el).closest(".rebar_row").find(".rebar_M0");
                    $(M0_input).prop("disabled", true);
                    $(M0_input).val(0);
                }
            }
        }
    }
}



