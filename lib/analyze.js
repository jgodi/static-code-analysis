var request = require('request');

var packageJson = require(process.cwd() + '/package.json');
var parse = require('./parse');
var formatSlackMessage = require('./format-slack');
var lastCommit = require('./last-commit');

var FirebaseURL = process.argv[2];
var SlackHookURL = process.argv[3];
var SlackChannel = process.argv[4];
var ReportThreshold = process.argv[5] || .10;

// Check for Firebase URL
if (!FirebaseURL) {
    console.error('Must supply the firebaseUrl, "sca myfirebase.com"');
}

/**
 * Make sure the current and the last are different before we post a slack message
 */
function passesThreshold(current, last) {
    if (!last) {
        console.log('[Galaxy] - No previous results, skipping slack message');
        return false;
    }

    // Make sure the coverage changes by at least 0.01%
    var diff = Math.abs(current.coverage.lines - last.coverage.lines);
    console.log('[Galaxy] - Results differ by ' + diff + '%' + (diff >= ReportThreshold ? ', posting slack message' : ', skipping slack message'));
    return diff >= ReportThreshold;
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
        lastCommit(packageJson.name, function (lastCommit) {
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
                if (passesThreshold(parsedReport.dashboard, lastRun) && SlackHookURL && SlackChannel) {
                    // Create a slack message based on the results
                    var message = {
                        text: 'New results for <http://metrics:9002/#/project/' + packageJson.name + '|' + packageJson.name.toUpperCase().replace('novo-', '') + '>, triggered by *' + parsedReport.dashboard.commit.author_name + '*',
                        channel: SlackChannel,
                        username: 'Galaxy',
                        attachments: formatSlackMessage(parsedReport.dashboard, lastRun),
                        icon_url: 'https://67.media.tumblr.com/avatar_975d849db99f_128.png'
                    };
                    request.post('https://hooks.slack.com/services/' + SlackHookURL, { json: message });
                }
            });
        });
    });
};