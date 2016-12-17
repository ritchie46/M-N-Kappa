$(document).ready();
{
    watch();
// setting up the presettings
    $compression_material.val("C20/25 parabolic-rectangular");
    $compression_material.trigger("change");
    $slct = $(".rebar_material");
    $slct[1].value = "B500";
    $slct.last().trigger("change");
    $slct = $("#cross_section_type");
    $slct.val("rectangle");
    $slct.trigger("change");

    trigger_tens_strain();
    trigger_polygon();
    $(".rebar_d").trigger("change");
}
