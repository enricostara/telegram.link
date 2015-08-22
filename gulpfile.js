var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var docco = require('gulp-docco');
var del = require('del');

gulp.task('doc', function () {
    del(['./doc'], function () {
        gulp.src('./lib/**/*.js')
            .pipe(docco(/*{'layout': 'linear'}*/))
            .pipe(gulp.dest('./doc'));
    });
});
gulp.task('quality', function () {
    return gulp.src('./lib/**')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});
gulp.task('test', function () {
    return gulp.src('./test/**/*test.js')
        .pipe(mocha({reporter: 'mocha-better-spec-reporter', timeout: '20s'}));
});

gulp.task('cover', function () {
    return gulp.src('./test/**/*test.js')
        .pipe(mocha({reporter: 'mocha-lcov-reporter', timeout: '120s'}));
});

gulp.task('default', ['quality', 'test']);