$(document).ready(function () {
    $('[data-toggle="tooltip"]').tooltip();
});


$('button[title="Remove this row"]').click(function (e) {
    console.log("test")
    $(this).closest('div[id="pg_row"]').remove()
})
