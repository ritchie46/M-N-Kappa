﻿QUnit.test("interpolation", function (assert) {
    assert.close(std.interpolate(0, 1, 10, 8, 7), 5.9, 0.01);
    assert.close(std.interpolate(-3, -25, 3, 30, -2), -15.833, 0.01);
    assert.close(std.interpolate(0, -3.5, 250, 3.5, 25), -2.8, 0.01);
    assert.close(std.interpolate(0, 1, 15, 20, 25), 32.667, 0.01)

});

t_mkap = function (loc, comp_strain, comp_stress, tens_strain, tens_stress, As, rebar_z, normal_force, top, promille,
prestress) {
    // cross section
    for (i = 0; i < loc.length; i++) {
        loc[i] = new vector.Point(loc[i][0], loc[i][1])
    }

    cs = new crsn.PolyGon(loc);

    var concrete_comp = new mkap.StressStrain(comp_strain, comp_stress);
    var concrete_tensile = new mkap.StressStrain(tens_strain, tens_stress);

    var run = new mkap.MomentKappa(cs, concrete_comp, concrete_tensile);
    run.normal_force = normal_force;
    run.rebar_As = As;
    run.rebar_z = rebar_z;
    run.prestress = prestress;
    run.d_strain = [0, 0];
    run.m0 = [0, 0];
    run.d_stress = [0, 0];

    for (i = 0; i < run.rebar_As.length; i++) {
        run.rebar_diagram.push(new mkap.StressStrain([0, 2.175, 50], [0, 435, 435]))
    }

    run.det_m_kappa();
    return [run.moment, run.validity()];
};

t_1 = function () {
    loc = [[0, 0], [500, 0], [500, 800], [0, 800], [0, 0]];
    comp_strain = [0, 1.75, 3.5];
    comp_stress = [0, 13.3, 13.3];
    tens_strain = [0, 0.291];
    tens_stress = [0, 2.21];
    As = [4021, 4021];
    rebar_z = [80, 720];
    normal_force = -2e6;
    prestress = [0, 0];
    output = t_mkap(loc, comp_strain, comp_stress, tens_strain, tens_stress, As, rebar_z, normal_force, true,
        3, prestress);
    console.log(output[0])
    //console.log(output[0] == -1609.477047738069 && output[1] == 0.000008675806475328787)
};

t_2 = function () {
    loc = [[0, 0], [500, 0], [500, 800], [0, 800], [0, 0]];
    comp_strain = [0, 1.75, 3.5];
    comp_stress = [0, 13.3, 13.3];
    tens_strain = [0, 0.291];
    tens_stress = [0, 2.21];
    As = [4021, 4021];
    rebar_z = [80, 720];
    normal_force = -2e6;
    prestress = [0, 0];
    output = t_mkap(loc, comp_strain, comp_stress, tens_strain, tens_stress, As, rebar_z, normal_force, false,
        0.291, prestress);
    console.log(output[0])
    //console.log(output[0] == -588.8121002447566 && output[1] == 0.000001800858769298804)
};

t_3 = function () {
    loc = [[0, 0], [500, 0], [500, 300], [0, 300], [0, 0]];
    comp_strain = [0, 1.75, 3.5];
    comp_stress = [0, 13.3, 13.3];
    tens_strain = [0];
    tens_stress = [0];
    As = [805];
    rebar_z = [170];
    normal_force = 0;
    prestress = [0];
    output = t_mkap(loc, comp_strain, comp_stress, tens_strain, tens_stress, As, rebar_z, normal_force, true,
        3.5, prestress);
    console.log(output[0]);
    //console.log(output[0] == -52.99534062209125 && output[1] == 0.00014066990087225017)
};

// t_1();
// t_2();
t_3();