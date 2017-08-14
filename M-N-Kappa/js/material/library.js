var lib = (function () {
    var reinforcement = {
        "Y1860": {
            stress: [1675, 1675],
            strain: [1675 / 195, 35],
            gamma: 1.1
        },

        "Y1770": {
            stress: [1595, 1595],
            strain: [1595 / 195, 35],
            gamma: 1.1
        },

        "Y1670": {
            stress: [1505, 1505],
            strain: [1505 / 195, 35],
            gamma: 1.1
        },

        "B500": {
            stress: [500, 540],
            strain: [500 / 200, 50],
            gamma: 1.15
        },

        "B400": {
            stress: [400, 430],
            strain: [400 / 200, 50],
            gamma: 1.15
        },
        "FRP": {
            stress: [825],
            strain: [5],
            gamma: 1
        }

    };

    function parabo_rect(fc, strain2, strain2u) {
        // strain at which the maximum stress is reached for concrete < C50 = 2 promille. 2 - 3 promille is constant.
        var strain = std.linspace(0.01, strain2, 10);
        var stress = strain.map(function (i) {
            return fc * (1 - Math.pow((1 - i / strain2), 2))
        });
        strain.push(strain2u);
        stress.push(fc);

        return {strain: strain,
                stress: stress}
    }

    var concrete = {
        "C12/15 parabolic-rectangular": {
            stress: parabo_rect(12, 2, 3.5).stress,
            strain: parabo_rect(12, 2, 3.5).strain,
            gamma: 1.5
        },
        "C12/15 bi-linear": {
            stress: [12, 12],
            strain: [1.75, 3.5],
            gamma: 1.5
        },
        "C16/20 parabolic-rectangular": {
            stress: parabo_rect(16, 2, 3.5).stress,
            strain: parabo_rect(16, 2, 3.5).strain,
            gamma: 1.5
        },
        "C16/20 bi-linear": {
            stress: [16, 16],
            strain: [1.75, 3.5],
            gamma: 1.5
        },
        "C20/25 parabolic-rectangular": {
            stress: parabo_rect(20, 2, 3.5).stress,
            strain: parabo_rect(20, 2, 3.5).strain,
            gamma: 1.5
        },
        "C20/25 bi-linear": {
            stress: [20, 20],
            strain: [1.75, 3.5],
            gamma: 1.5
        },
        "C25/30 parabolic-rectangular": {
            stress: parabo_rect(25, 2, 3.5).stress,
            strain: parabo_rect(25, 2, 3.5).strain,
            gamma: 1.5
        },
        "C25/30 bi-linear": {
            stress: [25, 25],
            strain: [1.75, 3.5],
            gamma: 1.5
        },
        "C30/37 parabolic-rectangular": {
            stress: parabo_rect(30, 2, 3.5).stress,
            strain: parabo_rect(30, 2, 3.5).strain,
            gamma: 1.5
        },
        "C30/37 bi-linear": {
            stress: [30, 30],
            strain: [1.75, 3.5],
            gamma: 1.5
        },
        "C35/45 parabolic-rectangular": {
            stress: parabo_rect(35, 2, 3.5).stress,
            strain: parabo_rect(35, 2, 3.5).strain,
            gamma: 1.5
        },
        "C35/45 bi-linear": {
            stress: [35, 35],
            strain: [1.75, 3.5],
            gamma: 1.5
        }
    };


    return {
        reinforcement: reinforcement,
        concrete: concrete
    }
})();

