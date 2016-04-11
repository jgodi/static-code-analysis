var diff = require('deep-diff').diff;

/**
 * Creates the nested trend object for the analyzed code. Generic so it will work with any object
 * @param {Object} trends - trend object
 * @param {Object} difference - differences to create the trends off of (using the diff module)
 * @param {String} trendClass - class for the trend
 * @returns {Object} - trend object
 */
function createNestedTrends(trends, difference, trendClass) {
    if (difference.length === 1) {
        trends[difference[0]] = trendClass;
    } else {
        var key = difference.shift();
        trends[key] = createNestedTrends(typeof trends[key] === 'undefined' ? {} : trends[key], difference, trendClass);
    }
    return trends;
}

/**
 * Sets the trend class based on the value
 * @param {Number} previous - previous run value
 * @param {Number} current - current run value
 * @returns {String} - class representing trend
 */
function getTrendClass(previous, current) {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'same';
}

/**
 * Calculates the trends based on the previous analysis and the current one
 * @param {Object} previous - last run
 * @param {Object} current - current run
 * @returns {Object} trend object, containing key -> trendClass for each metric
 */
module.exports = function calculateTrends(previous, current) {
    var trends = {};

    if (!previous) {
        return trends;
    }

    var prefilter = function (path, key) {
        return key === 'trends' || key === 'timestamp';
    };
    var differences = diff(previous, current, prefilter);
    if (differences) {
        differences.forEach(function (dif) {
            if (dif.kind === 'E') {
                createNestedTrends(trends, dif.path, getTrendClass(dif.lhs, dif.rhs));
            }
        });
    }
    return trends;
};