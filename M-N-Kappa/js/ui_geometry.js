"use strict";

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
        plt.draw_polygon(session.mkap.cross_section.point_list, "notused", session, false);
    }
    else if (choice == "tube") {
        var radius = parseFloat(document.getElementById("tube_radius").value);
        var thickness = parseFloat(document.getElementById("tube_thickness").value);
        session.mkap.cross_section = new crsn.Tube(radius, radius - thickness);
        plt.draw_polygon(session.mkap.cross_section.point_list, "not_used", session, false)
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
    trigger_polygon()
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

