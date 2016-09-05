$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();



    // Logic for collapsing the polygon input div
    $("#collapse_polygon").collapse("show");
    //$("#polygon_collapse_glyph").toggleClass('glyphicon-triangle-top glyphicon-triangle-bottom')




    // General collapse panel logic
    $(".collapse_glyph").click(function () {
        $(this).closest(".panel").children(".collapse").toggle()
        $(this).toggleClass('glyphicon-triangle-top glyphicon-triangle-bottom')
    });

    // General add row logic
    $(".add_row").click(function () {
        $row = $(this).closest(".panel-body").children(".row").last();
        $clone = $row.clone()
        $clone.removeClass('hidden')
        $row.after($clone);
    })

    // General remove panel row logic
    $(".panel").on("click", ".remove_row", function () {
        $(this).closest('.row').remove()
    })

    

});


//class
function Session() {
    this.cross_section = null
}

session = new Session()
