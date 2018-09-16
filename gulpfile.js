var gulp        = require("gulp"),
    browserify  = require("browserify"),
    source      = require("vinyl-source-stream"),
    buffer      = require("vinyl-buffer"),
    tslint      = require("gulp-tslint"),
    tsc         = require("gulp-typescript"),
    sourcemaps  = require("gulp-sourcemaps"),
    uglify      = require("gulp-uglify"),
    runSequence = require("run-sequence"),
    mocha       = require("gulp-mocha"),
    istanbul    = require("gulp-istanbul"),
    sourceMaps = require("gulp-sourcemaps"),
    browserSync = require("browser-sync").create();

gulp.task("tslint", () =>
    gulp.src("common.ts")
        .pipe(tslint({
            formatter: "verbose"
        }))
        .pipe(tslint.report())
);

var tsProject = tsc.createProject("tsconfig.json");
gulp.task("build-app", function() {
    var tsResult = tsProject.src()
                            .pipe(sourceMaps.init())
                            .pipe(tsProject())
                            .pipe(sourceMaps.write("."))
                            .pipe(gulp.dest("."));
});
