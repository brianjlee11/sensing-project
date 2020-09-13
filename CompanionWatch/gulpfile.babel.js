import gulp from 'gulp';
import browserify from 'browserify';
import babelify from 'babelify'
import source from 'vinyl-source-stream';
import buffer from "vinyl-buffer";

gulp.task('scripts', async () => {
  browserify(["src/main.js", "node_modules/idb/build/esm/index.js"])
    .transform(babelify, {
      presets: ["@babel/env"]
    })
    .bundle()
    .pipe(source("bundle.js"))
    .pipe(gulp.dest("dist/scripts"))
    .pipe(buffer());
});
