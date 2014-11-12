var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var docco = require('gulp-docco');
var del = require('del');

gulp.task('docs-api', function () {
    del(['./docs/api'], function() {
        gulp.src('telegram.link.js')
            .pipe(docco({'layout': 'linear'}))
            .pipe(gulp.dest('./docs/api'))
    });
});

gulp.task('quality-lib', function () {
    return gulp.src('node_modules/lib/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
});
gulp.task('quality-api', function () {
    return gulp.src('telegram.link.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
});

gulp.task('test-lib', function () {
    return gulp.src('./test/lib/**/*.js')
        .pipe(mocha({reporter: 'tap', timeout: '10s'}));
});
gulp.task('test-api', function () {
    return gulp.src('./test/*.js')
        .pipe(mocha({reporter: 'tap', timeout: '10s'}));
});

gulp.task('cov-test-lib', function () {
    return gulp.src('./test/lib/**/*.js')
        .pipe(mocha({reporter: 'mocha-lcov-reporter', timeout: '120s'}));
});
gulp.task('cov-test-api', function () {
    return gulp.src('./test/*.js')
        .pipe(mocha({reporter: 'mocha-lcov-reporter', timeout: '120s'}));
});

gulp.task('default', ['quality', 'test-lib']);
gulp.task('quality', ['quality-lib', 'quality-api']);
gulp.task('test', ['quality', 'test-lib', 'test-api']);
gulp.task('cover', ['cov-test-lib', 'cov-test-api']);
