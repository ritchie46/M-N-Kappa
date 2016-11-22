"use strict";

// rebar area
function trigger_rebar_input() {
    // reset
    session.mkap.rebar_As = [];
    session.mkap.rebar_z = [];
    session.mkap.rebar_diagram = [];
    session.mkap.m0 = [];
    session.mkap.rebar_n = [];
    session.mkap.rebar_diam = [];
    session.prestress = [];
    session.compute_prestress = false;
    var n = document.getElementsByClassName("rebar_n");
    var diam = document.getElementsByClassName("rebar_Ø");
    var d = document.getElementsByClassName("rebar_d");
    var rebar_diagram = $(".rebar_material_select");
    var m0 = document.getElementsByClassName("rebar_M0");
    var prestress = document.getElementsByClassName("prestress_input");
    $slct = $("#option_rebar_results");
    $slct.empty();
    n = extract_floats(n);
    diam = extract_floats(diam);
    prestress = extract_floats(prestress);

    var As = [];
    for (i=0; i < n.length; i++) {
        As.push(0.25 * Math.PI * Math.pow(diam[i], 2) * n[i])
    }
    d = extract_floats(d);
    m0 = extract_floats(m0);
    rebar_diagram = rebar_diagram.slice(1);  // the first is the hidden reserve
    var height = session.mkap.cross_section.top;

    for (var i = 0; i < As.length; i++) {
        // The corresponding rebar material
        var no_of_diagram = rebar_diagram[i].value[rebar_diagram[i].value.length - 1];

        // check if prestress needs to be taken into account.
        if ($("#rebar_curve_" + no_of_diagram).find(".prestress_container").find(".prestress_checkbox").is(":checked")) {
            session.compute_prestress = true;
            session.prestress.push(prestress[i]);
        }
        else {
            session.prestress.push(0)
        }

        // add the rebar in the correct order to the mkap
        session.mkap.rebar_n[i] = n[i];
        session.mkap.rebar_As[i] = As[i];
        session.mkap.rebar_z[i] = height - d[i];
        session.mkap.rebar_diam[i] = diam[i];
        session.mkap.rebar_diagram[i] = session.rebar_diagrams[no_of_diagram - 1];
        session.mkap.m0[i] = m0[i] * Math.pow(10, 6);

        // set the rebar options in the results table
        $slct.append("<option>rebar row #%s</option>".replace("%s", (i + 1).toString()));
    }
    trigger_polygon();
}

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
    var x; var y;
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
        plt.draw_polygon(x, y, session);
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
            plt.draw_polygon(x, y, session);
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
            x = [0.5 * w_w, 0.5 * w_w, 0.5 * w_f, 0.5 * w_f, -0.5 * w_f, -0.5 * w_f, -0.5 * w_w, -0.5 * w_w];
            y = [0, h_w, h_w, h_f + h_w, h_f + h_w, h_w, h_w, 0];
        }
        else if (choice == "I-beam") {
            x = [0.5 * w_f, 0.5 * w_f, 0.5 * w_w, 0.5 * w_w, 0.5 * w_f, 0.5 * w_f, -0.5 * w_f, -0.5 * w_f, -0.5 * w_w, -0.5 * w_w, -0.5 * w_f, -0.5 * w_f];
            y = [0, h_f, h_f, h_w + h_f, h_w + h_f, 2 * h_f + h_w, 2 * h_f + h_w, h_w + h_f, h_w + h_f, h_f, h_f, 0];
        }

        rotation_pg = rotate_pg(rotation, x, y);
        x = rotation_pg.x;
        y = rotation_pg.y;

        if (w_w > 0 && w_f > 0 && h_w > 0 && h_f > 0) {
            plt.draw_polygon(x, y, session);
        }
    }
    else if (choice == "circle") {
        var radius = parseFloat(document.getElementById("circle_radius").value);
        session.mkap.cross_section = new crsn.Circle(radius);
        plt.draw_polygon(session.mkap.cross_section.point_list, "skip_this_param", session, false);
    }
    else if (choice == "tube") {
        radius = parseFloat(document.getElementById("tube_radius").value);
        var thickness = parseFloat(document.getElementById("tube_thickness").value);
        session.mkap.cross_section = new crsn.Tube(radius, radius - thickness);
        plt.draw_polygon(session.mkap.cross_section.point_list, "skip_this_param", session, false, true)
    }
}

// cross-section type
$("#cross_section_type").change(function () {
    if (this.value == "rectangle") {
        $(".cross_section_type").addClass("hidden");
        $("#rectangle_rows").removeClass("hidden")
    }
    else if (this.value == "custom") {
        $(".cross_section_type").addClass("hidden");
        $("#polygon_rows").removeClass("hidden")
    }
    else if (this.value == "T-beam" || this.value == "I-beam") {
        $(".cross_section_type").addClass("hidden");
        $("#T-beam_rows").removeClass("hidden")
    }
    else if (this.value == "circle") {
        $(".cross_section_type").addClass("hidden");
        $("#circle_rows").removeClass("hidden")
    }
    else if (this.value == "tube") {
        $(".cross_section_type").addClass("hidden");
        $("#tube_rows").removeClass("hidden")
    }
    trigger_polygon();
    trigger_rebar_input()
});

var $slct = $('#pg_body');
//Call polygon draw function if row is removed
$slct.on("click", ".remove_row", function () {
    $(this).closest('.custom_row').remove();
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

