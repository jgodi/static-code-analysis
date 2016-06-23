var simpleGit = require('simple-git');

module.exports = function (project, callback) {
    // If we are novo, we have to check some other repos
    if (project === 'novo') {
        simpleGit().log(function (err, data) {
            var novo = data.latest;
            novo.project = 'novo';
            simpleGit('record').log(function (err, data) {
                var record = data.latest;
                record.project = 'record';
                simpleGit('mainframe').log(function (err, data) {
                    var mainframe = data.latest;
                    mainframe.project = 'mainframe';
                    simpleGit('find-results').log(function (err, data) {
                        var findResults = data.latest;
                        findResults.project = 'findResults';
                        simpleGit('commons').log(function (err, data) {
                            var commons = data.latest;
                            commons.project = 'commons';

                            // Get latest
                            var latest = [novo, record, mainframe, findResults, commons].sort(function (a, b) {
                                return new Date(b) - new Date(a);
                            })[0];
                            callback(latest);
                        });
                    });
                });
            });
        });
    } else {
        simpleGit().log(function (err, data) {
            callback(data.latest);
        });
    }
};