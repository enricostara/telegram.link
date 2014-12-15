var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var docco = require('gulp-docco');
var del = require('del');

gulp.task('docs', function () {
    del(['./docs'], function() {
        gulp.src('./lib/telegram.link.js')
            .pipe(docco(/*{'layout': 'linear'}*/))
            .pipe(gulp.dest('./docs'));
    });
});
gulp.task('quality', function () {
    return gulp.src('./lib/**')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});
gulp.task('test', function () {
    return gulp.src('./test/telegram.link.test.js')
        .pipe(mocha({reporter: 'mocha-better-spec-reporter', timeout: '20s'}));
});

gulp.task('cover', function () {
    return gulp.src('./test/telegram.link.test.js')
        .pipe(mocha({reporter: 'mocha-lcov-reporter', timeout: '120s'}));
});

gulp.task('default', ['quality', 'test']);