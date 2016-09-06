/**
Note to self:
    The plotter also adds the objects uses for calculations to the sessions
*/


$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();

    // Logic for collapsing the polygon input div
    $("#collapse_polygon").collapse("show");

    // add 3 input elements for the polygon input
    $row = $(".pg_row")
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
        $row = $(this).closest(".panel-body").children(".custom_row").last();
        $clone = $row.clone()
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


    // create polygon
    trigger_polygon = function () {
        // plotter draws polygon and returns the polygons Points (Point class) in a list.
        point_list = plt.draw_polygon();

        // add polygon to session
        session.cross_section = new crsn.PolyGon(point_list)
        session.cross_section.return_x_on_axis()
        $("#area").html("Area: " + session.cross_section.area())
    }

    
    // compression stress strain
    trigger_comp_strain = function () {
        strain = document.getElementsByClassName("comp_strain")
        stress = document.getElementsByClassName("comp_stress")
        plt.draw_lines(plt.svg_comp, strain, stress)

        strain = extract_floats(strain)
        console.log(strain)
    }


    $('#comp_curve_body').on('change', 'input', function () {
        trigger_comp_strain();
    });

    $('#comp_curve_body').on('click', '.remove_row', function () {
        $(this).closest('.custom_row').remove()
        trigger_comp_strain();
    });

    // tensile stress strain
    trigger_tens_strain = function () {
        strain = document.getElementsByClassName("tens_strain")
        stress = document.getElementsByClassName("tens_stress")
        plt.draw_lines(plt.svg_tens, strain, stress)
    }

    $('#tens_curve_body').on('change', 'input', function () {
        trigger_tens_strain();
    });

    $('#tens_curve_body').on('click', '.remove_row', function () {
        $(this).closest('.custom_row').remove()
        trigger_tens_strain();
    });


 

});


//class
function Session() {
    this.cross_section = null
}
// end class

session = new Session()

extract_floats = function (arr) {
    /// <param name="arr" type="array">DOM input fields array</param>
    /**
    Casts the strings to floats and pops invalid data from the array.
    */

    data = []

    for (i = 0; i < arr.length; i++) {
        if (arr[i].value.length > 0) { // input field is filled
            val = parseFloat(arr[i].value)
            data.push(val)
        }
    }
    return data
}