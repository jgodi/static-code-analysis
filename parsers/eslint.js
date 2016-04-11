module.exports = function (fileLocation) {
    // Grab the ESLint json file (created via using the eslint node module with the packaged formatter)
    var eslintJson = require((process.cwd() + fileLocation));
    return {
        dashboard: {
            warnings: eslintJson.warnings,
            errors: eslintJson.errors
        },
        report: eslintJson
    }
};