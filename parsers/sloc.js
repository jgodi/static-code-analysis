module.exports = function (fileLocation) {
    // Grab the LOC json file (created via using the sloc node module)
    var locJson = require((process.cwd() + fileLocation));
    var formattedLocJson = {};

    // Just grab the total lines of code
    formattedLocJson.total = locJson.summary.total;

    // Iterate over the byExt keys and just return the total lines for each extension
    formattedLocJson.byExt = {};
    Object.keys(locJson.byExt).forEach(function (key) {
        formattedLocJson.byExt[key] = locJson.byExt[key].summary.total;
    });

    return {
        dashboard: formattedLocJson,
        report: formattedLocJson
    };
}