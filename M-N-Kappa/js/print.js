"use strict";

function print() {
    var page = window.open('', "Print", 'height=400,width=600');
    page.document.write('<html><head><title>' + document.title  + '</title>');
    page.document.write('<link href="css/default.css" rel="stylesheet" type="text/css" />');
    page.document.write('<link href="bootstrap-3.3.7-dist/css/bootstrap.css" rel="stylesheet" />');
    page.document.write('</head><body style="overflow:visible">');

    page.document.write('<h1>Moment curvature</h1> <div class="col-xs-12">');
    page.document.write("<h1>Geometry</h1>");
    page.document.write(document.getElementById("pg_svg").innerHTML + " &nbsp&nbsp;");
    page.document.write(document.getElementById("geometry_column").innerHTML);
    page.document.write("<div class='pagebreak'><h1>Reinforcement</h1>&nbsp;");
    page.document.write(document.getElementById("rebar_column").innerHTML);
    page.document.write("</div>");
    page.document.write("<div class='pagebreak'><h1>Results</h1>&nbsp;");
    page.document.write(document.getElementById("results_column").innerHTML);
    page.document.write("</div>");
    page.document.write('</div></body></html>');

    page.document.close(); // necessary for IE >= 10
    page.focus(); // necessary for IE >= 10*/

    $(page.document).ready(function () {
        page.print();
        page.close();
    });

    return true;
}