var fs = require('fs');

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
            console.error('Invalid Index', index);
    }
}

module.exports = function (fileLocation) {
    var coverageArray = fs.readFileSync(process.cwd() + fileLocation).toString().split('\n');

    var files = [];
    var unformattedFiles = [];
    var summary = {};

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
            unformattedFiles.push(coverage);
        } else if (coverage.file === 'All files') {
            summary = coverage;
        }
    }

    var formattedFile = {};
    var folderName = '';
    for (u in unformattedFiles) {
        var result = unformattedFiles[u];

        if (result.file.endsWith('/')) {
            folderName = result.file;
        } else {
            formattedFile.file = folderName + result.file;
            formattedFile.statements = result.statements;
            formattedFile.branches = result.branches;
            formattedFile.functions = result.functions;
            formattedFile.lines = result.lines;
            files.push(formattedFile);
            formattedFile = {};
        }
    }
    return {
        dashboard: summary,
        report: {
            summary: summary,
            files: files
        }
    }
};