var request = require('request');
var Table = require('easy-table');
var jsonfile = require('jsonfile');

var FirebaseURL = process.argv[2];
var SlackHookURL = process.argv[3];
var SlackChannel = process.argv[4];

var LAST_RUN_FILE = 'last-run.json';

// Check for Firebase URL
if (!FirebaseURL) {
    console.error('Must supply the firebaseUrl.');
}

function formatPercent(val, width) {
    var str = val.toFixed(2) + '%';
    return width ? str : Table.padLeft(str, width);
}

function leftAlign(val, width) {
    return Table.padLeft(val, width);
}

function leftAlignPercent(val, width) {
    return Table.padLeft(val + '%', width);
}

function getProjectTable(projects) {
    var table = new Table();

    projects.forEach(function (project) {
        table.cell('Project', project.name.replace('novo-', '').toUpperCase());
        table.cell('Unit Test Coverage', Number(project.coverage.lines), leftAlignPercent);
        table.cell('Delta', project.coverageTrend || '0.00', leftAlignPercent);
        table.cell('Linting', project.eslint.warnings + project.eslint.errors, leftAlign);
        table.newRow()
    });

    table.total('Unit Test Coverage', {
        printer: Table.aggr.printer('Avg: ', formatPercent),
        reduce: Table.aggr.avg,
        init: 0
    });

    table.total('Linting', {
        printer: Table.aggr.printer('', leftAlign),
        reduce: Table.aggr.total,
        init: 0
    });

    table.sort(['Unit Test Coverage|des']);
    return '```' + table.toString() + '```';
}

function getMessage(projects) {
    var message = '*<http://metrics:9002|Daily Galaxy Report>*\n';
    message += getProjectTable(projects);
    message += '\n_Want your project on here, contact <@jgodi> to learn how!_';
    return message;
}

// Get all the dashboards and make a status report to slack
request('https://' + FirebaseURL + '/dashboard.json', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        var projects = JSON.parse(body);
        var lastRun;

        try {
            lastRun = jsonfile.readFileSync(LAST_RUN_FILE);
        } catch (e) {
            // no op
        }

        // Get trends
        if (lastRun) {
            for (var key in lastRun) {
                if (lastRun.hasOwnProperty(key)) {
                    if (projects[key]) {
                        var lastCoverage = lastRun[key].coverage.lines;
                        var newCoverage = projects[key].coverage.lines;
                        if (lastCoverage > newCoverage) {
                            projects[key].coverageTrend = '-' + (lastCoverage - newCoverage).toFixed(2);
                        } else if (newCoverage > lastCoverage) {
                            projects[key].coverageTrend = '+' + (newCoverage - lastCoverage).toFixed(2);
                        } else {
                            projects[key].coverageTrend = '0.00';
                        }
                    }
                }
            }
        }

        // Convert to an array
        var projectArray = [];
        for (var key in projects) {
            if (projects.hasOwnProperty(key)) {
                projects[key].name = key;
                projectArray.push(projects[key]);
            }
        }

        // If a slack hook/channel was supplied, send a message based on trend/stats only if we have a last run
        if (SlackHookURL && SlackChannel) {
            // Create a slack message based on the results
            var message = {
                text: getMessage(projectArray),
                channel: SlackChannel,
                username: 'Galaxy',
                icon_url: 'https://67.media.tumblr.com/avatar_975d849db99f_128.png'
            };
            request.post('https://hooks.slack.com/services/' + SlackHookURL, { json: message });
        }

        // Save the results to get trends
        jsonfile.writeFileSync(LAST_RUN_FILE, projects, { spaces: 2 });
    } else {
        console.error('[Daily Report] Error:', error);
    }
});