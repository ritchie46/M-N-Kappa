var gulp = require('gulp');
var rename = require("gulp-rename")
var concat = require('gulp-concat-util');
var uglify = require('gulp-uglify');
var util = require("gulp-util");
var htmlmin = require('gulp-htmlmin');

gulp.task('concatenate', function () {
    gulp.src(["M-N-Kappa/js/std.js",
           "M-N-Kappa/js/vector.js",
        "M-N-Kappa/js/cross_section.js",
        "M-N-Kappa/js/moment_kappa.js",
        "M-N-Kappa/js/plotter.js",
        "M-N-Kappa/js/main.js"])
    .pipe(concat('mkap_bundle.js'))
    .pipe(gulp.dest('dist'));
});


gulp.task("uglifyjs", function () {
    gulp.src(["M-N-Kappa/js/std.js",
        "M-N-Kappa/js/vector.js",
        "M-N-Kappa/js/cross_section.js",
        "M-N-Kappa/js/moment_kappa.js",
        "M-N-Kappa/js/plotter.js",
        "M-N-Kappa/js/main.js"])
    .pipe(uglify().on("error", util.log))
    .pipe(concat('mkap_bundle.min.js'))
     .pipe(gulp.dest('dist'));
});

gulp.task('minify', function () {
    return gulp.src('src/*.html')
      .pipe(htmlmin({ collapseWhitespace: true }))
      .pipe(gulp.dest('dist'));
});


gulp.task('default', ["concatenate", "uglifyjs"]);
