var request = require('request');
var Table = require('easy-table')

var FirebaseURL = process.argv[2];
var SlackHookURL = process.argv[3];
var SlackChannel = process.argv[4];

// Check for Firebase URL
if (!FirebaseURL) {
    console.error('Must supply the firebaseUrl.');
}

function formatNumber(val, width) {
    var str = val.toFixed(2);
    return width ? str : Table.padLeft(str, width);
}

function getProjectTable(projects) {
    var table = new Table();

    projects.forEach(function (project) {
        table.cell('Project', project.name.replace('novo-', '').toUpperCase());
        table.cell('Unit Test Coverage (%)', Number(project.coverage.lines), Table.number(2));
        table.cell('Linting', project.eslint.warnings + project.eslint.errors, Table.number(1));
        table.newRow()
    });

    table.total('Unit Test Coverage (%)', {
        printer: Table.aggr.printer('Avg: ', formatNumber),
        reduce: Table.aggr.avg,
        init: 0
    });

    table.total('Linting', {
        printer: Table.aggr.printer('', formatNumber),
        reduce: Table.aggr.total,
        init: 0
    });

    table.sort(['Unit Test Coverage (%)|des']);
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
    } else {
        console.error('[Daily Report] Error:', error);
    }
});