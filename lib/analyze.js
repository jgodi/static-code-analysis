var request = require('request');

var packageJson = require(process.cwd() + '/package.json');
var parse = require('./parse');
var formatSlackMessage = require('./format-slack');
var gitLastCommit = require('./../parsers/git-last-commit');

var FirebaseURL = process.argv[2];
var SlackHookURL = process.argv[3];
var SlackChannel = process.argv[4];

// Check for Firebase URL
if (!FirebaseURL) {
    console.error('Must supply the firebaseUrl, "sca myfirebase.com"');
}

// Get the last dashboard to process trends
module.exports = function () {
    // Go grab the last run of the report
    request('https://' + FirebaseURL + '/dashboard/' + packageJson.name + '.json', function (error, response, body) {
        // Last run, retrieved via https
        var lastRun;
        if (!error && response.statusCode == 200) {
            lastRun = JSON.parse(body);
        }
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

                if (FirebaseURL) {
                    // Send the dashboard to firebase
                    request.put('https://' + FirebaseURL + '/dashboard/' + packageJson.name + '.json', { json: parsedReport.dashboard });
                    // Send the report to firebase
                    request.post('https://' + FirebaseURL + '/' + packageJson.name + '.json', { json: parsedReport.report });
                }

                // If a slack hook/channel was supplied, send a message based on trend/stats only if we have a last run
                if (lastRun && SlackHookURL && SlackChannel) {
                    // Create a slack message based on the results
                    var message = {
                        channel: SlackChannel,
                        username: 'GALAXY',
                        attachments: formatSlackMessage(parsedReport.dashboard, lastRun),
                        icon_url: 'https://67.media.tumblr.com/avatar_975d849db99f_128.png'
                    };
                    request.post('https://hooks.slack.com/services/' + SlackHookURL, { json: message });
                }
            });
        });
    });
};