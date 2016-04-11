var packageJson = require(process.cwd() + '/package.json');

module.exports = function (callback) {
    var dashboard = {};
    var report = {};

    var locations = packageJson.staticCodeAnalysis.locations;

    Object.keys(locations).forEach(function (location) {
        try {
            var analysis = require('./../parsers/' + location)(locations[location]);

            // Reset the different coverage parsers to just 'coverage' on the object
            if (location === 'karma-coverage') {
                location = 'coverage';
            }

            dashboard[location] = analysis.dashboard;
            report[location] = analysis.report;
        } catch (e) {
            console.error('Parser not found for ' + location + '! Make sure to create one inside "/parsers"');
            console.error(e);
        }
    });
    
    callback({
        dashboard: dashboard,
        report: report
    });
};
