"use strict";

function print() {
    var page = window.open('', "Print", 'height=400,width=600');
    page.document.write('<html><head><title>' + document.title  + '</title>');
    page.document.write('<link href="css/default.css" rel="stylesheet" type="text/css" media=\"print\"/>');
    page.document.write('<link href="bootstrap-3.3.7-dist/css/bootstrap.css" rel="stylesheet" media=\"print\"/>');
    page.document.write('</head><body >');

    page.document.write('<h1>' + document.title  + '</h1>');

    // page.document.write(document.getElementById("pg_svg").innerHTML);
    page.document.write(document.getElementById("geometry_column").innerHTML);
    // page.document.write(document.getElementById("rebar_column").innerHTML);
    // page.document.write(document.getElementById("results_column").innerHTML);
    page.document.write('</body></html>');

    page.document.close(); // necessary for IE >= 10
    page.focus(); // necessary for IE >= 10*/

    page.print();
    page.close();

    return true;
}