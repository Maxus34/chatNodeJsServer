const gulp = require('gulp');
const ts = require('gulp-typescript');
const nodemon = require('nodemon');

// pull in the project TypeScript config
const tsProject = ts.createProject('tsconfig.json');
//task to be run when the watcher detects changes
gulp.task('scripts', () => {
  const tsResult = tsProject.src()
  .pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('dist'));
}); 
//set up a watcher to watch over changes

gulp.task('watch', ['scripts'], () => {
  	gulp.watch('**/*.ts', ['scripts']);	
});

gulp.task('default', ['watch', 'nodemon']);


gulp.task('nodemon', function (cb) {
	
	var started = false;
	
	return nodemon({
		script: 'dist/server.js'
	}).on('start', function () {
		if (!started) {
			cb();
			started = true; 
		} 
	});
});
