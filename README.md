# static-code-analysis

> Script to analyze the eslint/code coverage/lines of code and upload to firebase (dashboard repo coming later)

## Installation

`npm install --save-dev static-code-analysis`

You can also install the `sloc` module as well, in order to get number of lines of code reported.

## Usage

To use this project you simply have to create an entry in your `package.json` to point to the paths where your eslint/karma/sloc outputs are:

```
"staticCodeAnalysis": {
    "type": "javascript",
    "locations": {
      "eslint": "/coverage/eslint.json",
      "sloc": "/coverage/sloc.json",
      "karma-coverage": "/coverage/coverage.txt"
    }
}
```

The `locations` key directly correlates to the parser that will be used. You will find a parser with the same name under `static-code-analysis/parsers`.

You will then want to add a few NPM scripts to make your life easier:

```
"lint:save": "eslint public server -f node_modules/static-code-analysis/formatters/eslint.js > ./coverage/eslint.json",
"loc": "sloc public/ --format json > ./coverage/sloc.json",
"presca": "npm run lint:save && npm run loc",
"sca": "sca"
```

This will make sure to run the eslint and sloc before calling the `sca` module, which uploads the results to Firebase.

## Configuring the Build

For the build you will require to pass the FIREBASE instance into the run command of `sca`. For example,

`npm run sca MY-FIREBASE-INSTANCE.firebaseio.com`

That is it!!

## Creating a New Parser

In order to create a new parser, you first will want to have whatever tool output into a JSON/TXT/XML/etc file. Then you will create a new `parser` inside the `static-code-analysis/parsers` folder. This parser will read the file and put it in a readable format for Galaxy (follow the other parsers). You then can just supply that new location into your `package.json`.

> You might be required to make changes to the Galaxy UI in order to be able to consume the new metrics.