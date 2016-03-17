var https = require('https');
var diff = require('deep-diff').diff;

var packageJson = require(process.cwd() + '/package.json');
var gitLastCommit = require('./last-commit.js');
var parseReports = require('./parse-reports.js');

function createNestedTrends(obj, keys, v) {
    if (keys.length === 1) {
        obj[keys[0]] = v;
    } else {
        var key = keys.shift();
        obj[key] = createNestedTrends(typeof obj[key] === 'undefined' ? {} : obj[key], keys, v);
    }

    return obj;
}

function getTrendClass(previous, current) {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'same';
}

function calculateTrends(previous, current) {
    var trends = {};

    if (!previous) {
        return trends;
    }

    var prefilter = function (path, key) {
        return key === 'trends' || key === 'timestamp';
    };
    var differences = diff(previous, current, prefilter);
    differences.forEach(function (dif) {
        if (dif.kind === 'E') {
            createNestedTrends(trends, dif.path, getTrendClass(dif.lhs, dif.rhs));
        }
    });
    return trends;
}

// Get the last dashboard to process trends
module.exports = function analyze() {
    https.get('https://' + packageJson.staticCodeAnalysis.firebase + '/dashboard/' + packageJson.name + '.json', function (res) {
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            var lastRun = JSON.parse(data);
            gitLastCommit(function (error, lastCommit) {
                parseReports(function (data) {
                    data.dashboard.commit = {
                        hash: lastCommit.hash,
                        author: lastCommit.author
                    };

                    data.dashboard.trends = calculateTrends(lastRun, data.dashboard);

                    // Send the dashboard to firebase
                    var req = https.request({
                        hostname: packageJson.staticCodeAnalysis.firebase,
                        method: 'PUT',
                        path: '/dashboard/' + packageJson.name + '.json'
                    });
                    req.end(JSON.stringify(data.dashboard));

                    // Send the report to firebase
                    var req = https.request({
                        hostname: packageJson.staticCodeAnalysis.firebase,
                        method: 'POST',
                        path: '/' + packageJson.name + '.json'
                    });
                    req.end(JSON.stringify(data.report));
                });
            });

        });
    });
}