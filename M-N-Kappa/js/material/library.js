var lib = (function () {
    var reinforcement = {
        "Y1860": {
            stress: [1675, 1675],
            strain: [1675 / (1.1 * 195), 35],
            gamma: 1.1
        },

        "Y1770": {
            stress: [1595, 1595],
            strain: [1595 / (1.1 * 195), 35],
            gamma: 1.1
        },

        "Y1670": {
            stress: [1505, 1505],
            strain: [1505 / (1.1 * 195), 35],
            gamma: 1.1
        },

        "B500": {
            stress: [500, 540],
            strain: [500 / (1.15 * 200), 50],
            gamma: 1.15
        },

        "B400": {
            stress: [400, 430],
            strain: [400 / (1.15 * 200), 50],
            gamma: 1.15
        },
        "FRP": {
            stress: [825],
            strain: [5],
            gamma: 1
        }

    };

    return {
        reinforcement: reinforcement
    }
})();

