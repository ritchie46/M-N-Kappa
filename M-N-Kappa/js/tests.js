
t_mkap = function (loc) {
    // cross section
    for (i = 0; i < loc.length; i++) {
        loc[i] = new vector.Point(loc[i][0], loc[i][1])
    }

    cs = new crsn.PolyGon(loc)

    var concrete_comp = new mkap.StressStrain([0, 1.75 * 0.001, 3.5 * 0.001], [0, 20, 20])
    var concrete_tensile = new mkap.StressStrain([0], [0])

    var run = new mkap.MomentKappa(cross_section, concrete_comp, concrete_tensile)
    run.rebar_As.push(800)
    run.rebar_z.push(20)
    run.rebar_diagram.push(new mkap.StressStrain([0, 2.175 * 0.001, 10], [0, 435, 435]))

    run.solver(true, 3.5e-3)
    run.det_m_kappa()
    console.log(run.moment / 1e6)
    console.log(run.kappa);
};

t_1 = function () {
    loc = [[0, 0], [1000, 0], [1000, 200], [0, 200]]



    
}

t_1()