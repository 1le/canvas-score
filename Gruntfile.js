module.exports = function (grunt) {
    grunt.initConfig({

        browserify: {
            dist: {
                options: {
                    transform: [["babelify", { "presets": ["es2015", "stage-2"] }]],
                    browserifyOptions : {
                        debug : true
                    }
                },
                files: {
                    "./build/benchmark.js": ["./main.js"]
                }

            }
        },
        watch: {
            scripts: {
                files: ["./main.js", "./index.html", "./src/*.*", "./src/**/*.*"],
                tasks: ["browserify"]
            }
        }
    });

    grunt.loadNpmTasks("grunt-browserify");
    grunt.loadNpmTasks("grunt-contrib-watch");

    grunt.registerTask("default", ["watch"]);
    grunt.registerTask("build", ["browserify"]);
};