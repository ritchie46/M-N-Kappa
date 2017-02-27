
$("#save").click(function () {
    // var save_loc = prompt("The cross section will be saved in your browser memory\n" +
    //     "Under which name should it be saved? : ", "name");

    // saves geometry
    var input = [];
    var all = $("#geometry_column").find("input").toArray();
    all = all.concat($("#geometry_column").find("select").toArray());
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
    var a = {geom: $("#geometry_column").html(),
            geom_val: input};


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

    //localStorage.setItem(save_loc, JSON.stringify(a))
    var link = document.createElement("a");
    link.setAttribute("href", "data:text/plain;charset=utf-u, " + encodeURIComponent(JSON.stringify(a)));
    link.setAttribute("download", "save_cs.json");
    document.body.appendChild(link); // this is required for the firefox browser.
    link.click()

});

$("#load").click(function () {
    if (!(window.File && window.FileReader && window.FileList && window.Blob)) {
        alert("Your browser does not support the File APIs. Please update your browser and try again.")
    }
    input = document.getElementById("file_input");
    input.click();

});

$("#file_input").on("change", function () {

    var a = null;
    var file = input.files[0];
    // FileReader is async. An event handler is executed on loadend
    fr = new FileReader();
    fr.onloadend = function () {
        a = JSON.parse(fr.result);
        load(a)
    };
    fr.readAsText(file);
});

function load (data) {
    // loads geometry
    var $slct = $("#geometry_column");
    $slct.html(data.geom);
    var all = $slct.find("input").toArray();
    all = all.concat($slct.find("select").toArray());

    for (var i = 0; i < all.length; i++) {
        if (!$(all[i]).hasClass("hidden")){
            if (data.geom_val[i] !== "na") {
                $(all[i]).val(data.geom_val[i]);

            }
        }
    }

    // loads rebar column
    $slct = $("#rebar_column");
    $slct.html(data.rebar_row);
    all = $slct.find("input").toArray()
        .concat($slct.find("select").toArray());

    for (i = 0; i < all.length; i++) {
        if (!$(all[i]).hasClass("hidden")){
            if (data.geom_val[i] !== "na") {
                $(all[i]).val(data.rebar_row_val[i]);

            }
        }
    }

    watch();
    trigger_polygon();
    trigger_rebar_input();
    trigger_comp_strain();
    trigger_tens_strain()
}
