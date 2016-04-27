var https = require('https');

var packageJson = require(process.cwd() + '/package.json');
var parse = require('./parse');
var gitLastCommit = require('./../parsers/git-last-commit');

if (process.argv.length == 3) {
    var firebaseUrl = process.argv[2];

    // Get the last dashboard to process trends
    module.exports = function analyze() {
        // Get last commit info
        gitLastCommit(function (error, lastCommit) {
            // Parse all reports listed inside the package.json config block
            parse(function (parsedReport) {
                parsedReport.dashboard.commit = lastCommit;
                parsedReport.report.commit = lastCommit;

                // Set the type
                parsedReport.dashboard.type = packageJson.staticCodeAnalysis.type;
                parsedReport.report.type = packageJson.staticCodeAnalysis.type;

                // Set the url
                parsedReport.dashboard.url = packageJson.repository.url;

                // Send the dashboard to firebase
                var dashboardRequest = https.request({
                    hostname: firebaseUrl,
                    method: 'PUT',
                    path: '/dashboard/' + packageJson.name + '.json'
                });
                dashboardRequest.end(JSON.stringify(parsedReport.dashboard));

                // Send the report to firebase
                var reportRequest = https.request({
                    hostname: firebaseUrl,
                    method: 'POST',
                    path: '/' + packageJson.name + '.json'
                });
                reportRequest.end(JSON.stringify(parsedReport.report));
            });
        });
    }
} else {
    console.error('Must supply the firebaseUrl, "npm run sca myfirebase.com"');
}