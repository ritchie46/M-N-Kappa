
$("#save").click(function () {
    localStorage.setItem("mkap", $("#polygon_input").html())
});

$("#load").click(function () {
    var b = localStorage.getItem("mkap");
    $("#polygon_input").html(b)
    console.log(b);
    watch()

});