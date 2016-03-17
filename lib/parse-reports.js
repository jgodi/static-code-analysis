var fs = require('fs');

var packageJson = require(process.cwd() + '/package.json');
var sloc = require(process.cwd() + packageJson.staticCodeAnalysis.locations.sloc);
var eslint = require(process.cwd() + packageJson.staticCodeAnalysis.locations.eslint);

var karmaConfig = {
    set: function (config) {
        this.config = config;
    }
};
var karma = require(process.cwd() + packageJson.staticCodeAnalysis.locations.karma)(karmaConfig);

function getProperty(index) {
    switch (index) {
        case '0':
            return 'file';
        case '1':
            return 'statements';
        case '2':
            return 'branches';
        case '3':
            return 'functions';
        case '4':
            return 'lines';
        case '5':
            return 'uncovered';
        default:
            console.error('INDEX', index);
            throw new Error('NOOO');
    }
}

module.exports = function (callback) {
    var coverageArray = fs.readFileSync(process.cwd() + packageJson.staticCodeAnalysis.locations.coverage).toString().split('\n');

    var formattedResults = [];
    var uglyResults = [];
    var overallCoverage = {};

    for (i in coverageArray) {
        var lines = coverageArray[i].split('|');
        var coverage = {};
        for (l in lines) {
            var section = lines[l].replace(/-/g, '');
            section = section.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '').trim();
            if (section.length) {
                coverage[getProperty(l)] = section;
            }
        }
        if (coverage.hasOwnProperty('file') && coverage.file !== 'All files' && coverage.file !== 'File') {
            uglyResults.push(coverage);
        } else if (coverage.file === 'All files') {
            overallCoverage = coverage;
        }
    }

    var formattedFile = {};
    var folderName = '';
    for (u in uglyResults) {
        var result = uglyResults[u];

        if (result.file.endsWith('/')) {
            folderName = result.file;
        } else {
            formattedFile.file = folderName + result.file;
            formattedFile.statements = result.stmts;
            formattedFile.branches = result.branches;
            formattedFile.functions = result.funcs;
            formattedFile.lines = result.lines;
            formattedResults.push(formattedFile);
            formattedFile = {};
        }
    }

    overallCoverage.timestamp = new Date().getTime();

    overallCoverage.loc = {
        summary: sloc.summary,
        byExt: {
            js: sloc.byExt.js.summary,
            html: sloc.byExt.html.summary,
            scss: sloc.byExt.scss.summary
        }
    };

    overallCoverage.eslint = {
        errors: eslint.errors,
        warnings: eslint.warnings
    };

    overallCoverage.thresholds = karmaConfig.config.thresholdReporter;

    var report = {
        stats: overallCoverage,
        files: formattedResults
    };
    report.stats.issues = eslint.messages;

    callback({
        dashboard: overallCoverage,
        report: report
    });
};
