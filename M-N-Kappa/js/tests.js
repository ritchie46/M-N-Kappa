
t_mkap = function (loc, comp_strain, comp_stress, tens_strain, tens_stress, As, rebar_z, normal_force, top, promille) {
    // cross section
    for (i = 0; i < loc.length; i++) {
        loc[i] = new vector.Point(loc[i][0], loc[i][1])
    }

    cs = new crsn.PolyGon(loc)

    var concrete_comp = new mkap.StressStrain(comp_strain, comp_stress)
    var concrete_tensile = new mkap.StressStrain(tens_strain, tens_stress)

    var run = new mkap.MomentKappa(cs, concrete_comp, concrete_tensile)
    run.normal_force = normal_force
    run.rebar_As = As
    run.rebar_z = rebar_z

    for (i = 0; i < run.rebar_As.length; i++) {
        run.rebar_diagram.push(new mkap.StressStrain([0, 2.175 * 0.001, 10], [0, 435, 435]))
    }

    run.solver(top, promille * 1e-3)
    run.det_m_kappa()

    return [run.moment / 1e6, run.kappa]
    //console.log(run.moment / 1e6)
    //console.log(run.kappa);
};

t_1 = function () {
    loc = [[0, 0], [500, 0], [500, 800], [0, 800], [0, 0]]
    comp_strain = [0, 1.75 * 0.001, 3.5 * 0.001]
    comp_stress = [0, 13.3, 13.3]
    tens_strain = [0, 0.291 * 0.001]
    tens_stress = [0, 2.21]
    As = [4021, 4021]
    rebar_z = [80, 720]
    normal_force = -2e6
    output = t_mkap(loc, comp_strain, comp_stress, tens_strain, tens_stress, As, rebar_z, normal_force, true, 3.5)
    console.log(output[0] == -1609.477047738069 && output[1] == 0.000008675806475328787)     
}

t_2 = function () {
    loc = [[0, 0], [500, 0], [500, 800], [0, 800], [0, 0]]
    comp_strain = [0, 1.75 * 0.001, 3.5 * 0.001]
    comp_stress = [0, 13.3, 13.3]
    tens_strain = [0, 0.291 * 0.001]
    tens_stress = [0, 2.21]
    As = [4021, 4021]
    rebar_z = [80, 720]
    normal_force = -2e6
    output = t_mkap(loc, comp_strain, comp_stress, tens_strain, tens_stress, As, rebar_z, normal_force, false, 0.291)
    console.log(output[0] == -588.8121002447566 && output[1] == 0.000001800858769298804)
}

t_3 = function () {
    loc = [[0, 0], [1000, 0], [1000, 200], [0, 200], [0, 0]]
    comp_strain = [0, 1.75 * 0.001, 3.5 * 0.001]
    comp_stress = [0, 13.3, 13.3]
    tens_strain = [0, 0.291 * 0.001]
    tens_stress = [0, 2.21]
    As = [300]
    rebar_z = [150]
    normal_force = 0
    output = t_mkap(loc, comp_strain, comp_stress, tens_strain, tens_stress, As, rebar_z, normal_force, true, 1.75)
    console.log(output)
    console.log(output[0] == -588.8121002447566 && output[1] == 0.000001800858769298804)
}

t_1()
t_2()
t_3()