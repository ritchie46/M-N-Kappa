
$("#save").click(function () {
    var save_loc = prompt("The cross section will be saved in your browser memory\n" +
        "Under which name should it be saved? : ", "name");

    var input = [];
    var all = $("#polygon_input").find("input").toArray();
    all = all.concat($("#polygon_input").find("select").toArray());
    for (var i = 0; i < all.length; i++) {
        if (!$(all[i]).hasClass("hidden")){
            if (all[i].value == undefined) {
                input.push("na")
            }
            else {
                input.push($(all[i]).val())
            }
        }

    }

    var a = {pg: $("#polygon_input").html(),
            pg_val: input};
    localStorage.setItem(save_loc, JSON.stringify(a))
});

$("#load").click(function () {
    var save_loc = prompt("Enter the name of your saved cross section : ", "name");
    var a = JSON.parse(localStorage.getItem(save_loc));
    console.log(a)

    $("#polygon_input").html(a.pg);

    var all = $("#polygon_input").find("input").toArray();
    all = all.concat($("#polygon_input").find("select").toArray());

    for (var i = 0; i < all.length; i++) {
        if (!$(all[i]).hasClass("hidden")){
            if (a.pg_val[i] !== "na") {
                $(all[i]).val(a.pg_val[i]);

            }
        }
    }
    watch();
    trigger_polygon()
    trigger_rebar_input()
});