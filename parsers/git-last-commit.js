var process = require('child_process');

function exec(command, callback) {
    process.exec(command, function (err, stdout, stderr) {
        if (stderr) {
            callback(stderr);
            return;
        }
        callback(null, stdout.split('\n').join(','));
    });
}

var command = 'git log -1 --pretty=format:"%h,%H,%s,%f,%b,%at,%ct,%an,%ae,%cn,%ce,%N,"' +
    ' && git rev-parse --abbrev-ref HEAD' +
    ' && git tag --contains HEAD';

module.exports = function (callback) {
    exec(command, function (err, res) {
        if (err) {
            callback(err);
            return;
        }

        var commit = res.split(',');

        var tags = [];
        if (commit[commit.length - 1] !== '') {
            tags = commit.slice(13 - commit.length);
        }

        callback(null, {
            shortHash: commit[0],
            hash: commit[1],
            subject: commit[2],
            sanitizedSubject: commit[3],
            body: commit[4],
            authoredOn: commit[5],
            committedOn: commit[6],
            author: {
                name: commit[7],
                email: commit[8],
            },
            committer: {
                name: commit[9],
                email: commit[10]
            },
            notes: commit[11],
            branch: commit[12],
            tags: tags
        });
    });
};
