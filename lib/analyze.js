var https = require('https');

var packageJson = require(process.cwd() + '/package.json');
var parse = require('./parse');
var trends = require('./trends');
var gitLastCommit = require('./../parsers/git-last-commit');

if (process.argv.length == 3) {
    var firebaseUrl = process.argv[2];

    // Get the last dashboard to process trends
    module.exports = function analyze() {
        // Go grab the last run of the report
        https.get('https://' + firebaseUrl + '/dashboard/' + packageJson.name + '.json', function (res) {
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function () {
                // Last run, retrieved via https
                var lastRun = JSON.parse(data);
                // Get last commit info
                gitLastCommit(function (error, lastCommit) {
                    // Parse all reports listed inside the package.json config block
                    parse(function (parsedReport) {
                        // Set last commit info
                        var commit = {
                            hash: lastCommit.hash,
                            author: lastCommit.author
                        };
                        parsedReport.dashboard.commit = commit;
                        parsedReport.report.commit = commit;

                        // Calculate the trends
                        parsedReport.dashboard.trends = trends(lastRun, parsedReport.dashboard);

                        // Send the dashboard to firebase
                        var req = https.request({
                            hostname: firebaseUrl,
                            method: 'PUT',
                            path: '/dashboard/' + packageJson.name + '.json'
                        });
                        req.end(JSON.stringify(data.dashboard));

                        // Send the report to firebase
                        var req = https.request({
                            hostname: firebaseUrl,
                            method: 'POST',
                            path: '/' + packageJson.name + '.json'
                        });
                        req.end(JSON.stringify(data.report));
                    });
                });

            });
        });
    }
} else {
    console.error('Must supply the firebaseUrl, "npm run sca myfirebase.com"');
}