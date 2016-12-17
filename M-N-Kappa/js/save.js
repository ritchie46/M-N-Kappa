
$("#save").click(function () {
    var save_loc = prompt("The cross section will be saved in your browser memory\n" +
        "Under which name should it be saved? : ", "name");

    // saves geometry
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


    // saves reinforcement column
    input = [];
    $slct =  $("#rebar_column");
    all = $slct.find("input").toArray()
        .concat($slct.find("select").toArray());
    for (i = 0; i < all.length; i++) {
        if (!$(all[i]).hasClass("hidden")){
            if (all[i].value == undefined) {
                input.push("na")
            }
            else {
                input.push($(all[i]).val())
            }
        }

    }
    a.rebar_row = $slct.html();
    a.rebar_row_val = input;

    localStorage.setItem(save_loc, JSON.stringify(a))


});

$("#load").click(function () {
    var save_loc = prompt("Enter the name of your saved cross section : ", "name");
    var a = JSON.parse(localStorage.getItem(save_loc));

    // loads geometry
    var $slct = $("#polygon_input");
    $slct.html(a.pg);
    var all = $slct.find("input").toArray();
    all = all.concat($slct.find("select").toArray());

    for (var i = 0; i < all.length; i++) {
        if (!$(all[i]).hasClass("hidden")){
            if (a.pg_val[i] !== "na") {
                $(all[i]).val(a.pg_val[i]);

            }
        }
    }

    // loads rebar column
    $slct = $("#rebar_column");
    $slct.html(a.rebar_row);
    all = $slct.find("input").toArray()
        .concat($slct.find("select").toArray());

    for (i = 0; i < all.length; i++) {
        if (!$(all[i]).hasClass("hidden")){
            if (a.pg_val[i] !== "na") {
                $(all[i]).val(a.rebar_row_val[i]);

            }
        }
    }

    watch();
    trigger_polygon();
    trigger_rebar_input()
});