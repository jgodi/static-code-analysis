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

function getText(current, last, percentage) {
    var message = current;
    if (percentage) message += '%';

    if (current !== last) {
        message += '\t-\t';
        if (current > last) message += ':arrow_up:';
        if (current < last) message += ':arrow_down:';
        message += ' from ';
        message += last;
        if (percentage) message += '%';
    }

    return message;
}

// Format a slack message
module.exports = function (current, last) {
    var messages = [];

    // Coverage
    messages.push({
        pretext: 'New results for project: ' + packageJson.name.toUpperCase(),
        color: getColor(current.coverage.lines, last.coverage.lines),
        fields: [
            {
                title: 'Code Coverage',
                value: getText(current.coverage.lines, last.coverage.lines, true)
            }
        ]
    });
    // Linting
    messages.push({
        color: getColor(last.eslint.errors, current.eslint.errors),
        fields: [
            {
                title: 'Lint Errors',
                value: getText(current.eslint.errors, last.eslint.errors, false)
            }
        ]
    });
    return messages;
};
