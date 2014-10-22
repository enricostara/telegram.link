var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');
var docco = require('gulp-docco');

gulp.task('src', function () {
    return gulp.src('lib/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(docco({'layout': 'linear'}))
        .pipe(gulp.dest('./docs/api'));
});

gulp.task('test', function () {
    return gulp.src('./test/**/*.js')
        .pipe(mocha({reporter: 'tap', timeout: '10s'}));
});
gulp.task('integration', function () {
    return gulp.src('./integration/**/*.js')
        .pipe(mocha({reporter: 'tap', timeout: '20s'}));
});

gulp.task('cov-test', function () {
    return gulp.src('./test/**/*.js')
        .pipe(mocha({reporter: 'mocha-lcov-reporter', timeout: '120s'}));
});
gulp.task('cov-integration', function () {
    return gulp.src('./integration/**/*.js')
        .pipe(mocha({reporter: 'mocha-lcov-reporter', timeout: '120s'}));
});

gulp.task('default', ['src', 'test']);
gulp.task('cover', ['cov-test', 'cov-integration']);
