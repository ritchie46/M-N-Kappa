$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();


    pg_row_count = 3
    $(".remove_pg_row").hide()
    // Adding polygon input row
    $('button[id="add_coordinate"]').click(function (e) {

        var $row = $('div[class="row pg_row"]').last();
        var $clone = $row.clone();
        $row.after($clone);
        pg_row_count++

        if (pg_row_count > 3) {
            $(".remove_pg_row").show()
        }

    })

    // Removing polygon input row
    $('#polygon_input').on("click", ".remove", function (event) {
        $(this).closest('div[class="row pg_row"]').remove();

        pg_row_count--
        if (pg_row_count <= 3) {
            $(".remove_pg_row").hide()
        }
    });



    // Logic for collapsing the polygon input div
    $("#collapse_polygon").collapse("show");
    $("#polygon_collapse_glyph").attr("class", "glyphicon glyphicon-triangle-top")
    var open = true
    $("#polygon_collapse_glyph").click(function () {
        if (open) {
            $("#collapse_polygon").collapse("hide");
            $("#polygon_collapse_glyph").attr("class", "glyphicon glyphicon-triangle-bottom");
            open = false
        }
        else {

            $("#collapse_polygon").collapse("show");
            $("#polygon_collapse_glyph").attr("class", "glyphicon glyphicon-triangle-top")
            open = true
        }
    })
    

});


//class
function Session() {
    this.cross_section = null
}

session = new Session()
