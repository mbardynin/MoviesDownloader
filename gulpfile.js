var gulp = require('gulp');
var path = require('path');
var zip = require('gulp-zip');
var minimist = require('minimist');
var fs = require('fs');

var knownOptions = {
    string: 'packageName',
    string: 'packagePath',
    default: { packageName: "Package.zip", packagePath: path.join(__dirname, '_package') }
}

var options = minimist(process.argv.slice(2), knownOptions);

gulp.task('default', function () {

    var packagePaths = ['**',
        '!**/_package/**',
        '!**/typings/**',
        '!**/src/**',
        '!**/node_modules/**',
        '!typings',
        '!_package',
        '!src',
        '!node_modules',
        '!gulpfile.js']

    return gulp.src(packagePaths)
        .pipe(zip(options.packageName))
        .pipe(gulp.dest(options.packagePath));
});
