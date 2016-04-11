var packageJson = require(process.cwd() + '/package.json');

module.exports = function (callback) {
    var dashboard = {};
    var report = {};

    var locations = packageJson.staticCodeAnalysis.locations;

    Object.keys(locations).forEach(function (location) {
        try {
            var analysis = require('./../parsers/' + location)(locations[location]);
            dashboard[location] = analysis.dashboard;
            report[location] = analysis.report;
        } catch (e) {
            console.error('Parser not found for ' + location + '! Make sure to create one inside "/parsers"');
            console.error(e);
        }
    });

    // overallCoverage.timestamp = new Date().getTime();
    // overallCoverage.url = packageJson.repository.url;
    //
    // overallCoverage.loc = {
    //     summary: sloc.summary,
    //     byExt: {
    //         js: sloc.byExt.js.summary,
    //         html: sloc.byExt.html.summary,
    //         scss: sloc.byExt.scss.summary
    //     }
    // };
    //
    // overallCoverage.eslint = {
    //     errors: eslint.errors,
    //     warnings: eslint.warnings
    // };
    //
    //
    // var report = {
    //     stats: overallCoverage,
    //     files: formattedResults
    // };
    // report.stats.issues = eslint.messages;

    callback({
        dashboard: dashboard,
        report: report
    });
};
