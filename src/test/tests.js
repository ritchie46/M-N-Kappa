﻿QUnit.test("interpolation", function (assert) {
    // simple interpolation
    assert.close(std.interpolate(0, 1, 10, 8, 7), 5.9, 0.01);
    // negative interpolation
    assert.close(std.interpolate(-3, -25, 3, 30, -2), -15.833, 0.01);
    assert.close(std.interpolate(0, -3.5, 250, 3.5, 25), -2.8, 0.01);
    // extrapolation
    assert.close(std.interpolate(0, 1, 15, 20, 25), 32.667, 0.01)

});

QUnit.test("Moment Kappa outcome", function (assert) {
    assert.close(t_1(), 1591, 5)
});

QUnit.test("Instantiate standard M-Kappa", function (assert) {
    var run = new mkap.MomentKappa();
    var a = new mkap.StressStrain([0], [0]);
    run.instantiate_standard_reinforcement([100, 200], [20, 80], a);
    assert.equal(run.rebar_diagram[0], a);
    assert.equal(run.rebar_diagram[1], a);
    assert.equal(run.prestress[1], 0);
    assert.equal(run.d_stress[1], 0);
    assert.equal(run.m0[1], 0);

});

QUnit.test("Benchmark", function (assert) {

    for (var i = 0; i < 100; i++) {
        t_3()
    }
    assert.equal(1, 1)
});


t_mkap = function (loc, comp_strain, comp_stress, tens_strain, tens_stress, As, rebar_z, normal_force, top, promille,
prestress) {
    // cross section
    for (var i = 0; i < loc.length; i++) {
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
    run.solver(top, promille);
    run.det_m_kappa();
    console.log(run.moment);
    return [run.moment / 1e6, run.validity()];
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

    if (output[1]) {
        return output[0]
    }
    else {
        return output
    }
};

t_2 = function () {
    // Sweet spot of no singular convergence due to iterating to zero. Note that this is only the case without the
    //offset
    b = 400; h = 500;
    loc = [[0, 0], [b, 0], [b, h], [0, h], [0, 0]];
    comp_strain = [0, 1.75, 3.5];
    comp_stress = [0, 20, 20];
    tens_strain = [0, 0.291];
    tens_stress = [0, 2.21];
    As = [1205];
    rebar_z = [50];
    normal_force = -2e6;
    prestress = [0];
    output = t_mkap(loc, comp_strain, comp_stress, tens_strain, tens_stress, As, rebar_z, normal_force, false,
        2.0, prestress);

    if (output[1]) {
        return output[0]
    }
    else {
        return 1
    }
};


t_3 = function () {
    loc = [[0, 0], [500, 0], [500, 800], [0, 800], [0, 0]];
    comp_strain = [0, 1.75, 3.5];
    comp_stress = [0, 13.3, 13.3];
    tens_strain = [0, 0.291];
    tens_stress = [0, 2.21];
    As = [4021, 4021];
    rebar_z = [80, 720];
    normal_force = -4e6;
    prestress = [0, 0];
    output = t_mkap(loc, comp_strain, comp_stress, tens_strain, tens_stress, As, rebar_z, normal_force, true,
        1.6, prestress);

    if (output[1]) {
        return output[0]
    }
    else {
        return 1
    }
};2