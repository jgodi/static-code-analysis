var packageJson = require(process.cwd() + '/package.json');

var COLORS = {
    down: '#c00',
    up: '#004c00',
    same: '#ccc'
};

function getColor(current, last) {
    if (current > last) return COLORS.up;
    if (current < last) return COLORS.down;
    return COLORS.same;
}

function getText(current, last, coverage) {
    var goal = packageJson.staticCodeAnalysis.goal || 80;
    var message = current;
    if (coverage) message += '%';

    var difference = (current - last).toFixed(2);
    if (difference < 0) difference *= -1;

    if (current !== last) {
        message += '\t-\t';
        if (current > last) message += ':arrow_up: ';
        if (current < last) message += ':arrow_down: ';
        message += difference;
        if (coverage) {
            message += '%';
            if (current < goal) {
                message += '\t-\t:warning: ';
                message += (goal - current).toFixed(2);
                message += '%';
                message += ' left to goal (' + goal + '%) :warning:'
            }
        }
    }

    return message;
}

// Format a slack message
module.exports = function (current, last) {
    var messages = [];

    // Coverage
    messages.push({
        color: getColor(current.coverage.lines, last.coverage.lines),
        fields: [
            {
                title: 'Unit Test Coverage',
                value: getText(current.coverage.lines, last.coverage.lines, true)
            }
        ]
    });
    // Linting
    messages.push({
        color: getColor(last.eslint.errors + last.eslint.warnings, current.eslint.errors + current.eslint.warnings),
        fields: [
            {
                title: 'Lint Warnings/Errors',
                value: getText(current.eslint.errors + current.eslint.warnings, last.eslint.errors + last.eslint.warnings, false)
            }
        ]
    });
    return messages;
};
