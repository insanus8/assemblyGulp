let project_folder = require("path").basename(__dirname),
    source_folder = "#src",
    path = {
        build: {
            html: project_folder + "/",
            css: project_folder + "/css/",
            js: project_folder + "/js/",
            img: project_folder + "/img/",
            fonts: project_folder + "/fonts/",
        },
        src: {
            html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
            css: source_folder + "/scss/style.scss",
            js: source_folder + "/js/script.js",
            img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp,mp4}",
            fonts: source_folder + "/fonts/*.ttf",
        },
        watch: {
            html: source_folder + "/**/*.html",
            css: source_folder + "/scss/**/*.scss",
            js: source_folder + "/js/**/*.js",
            img: source_folder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
        },
        clean: "./" + project_folder + "/",
    };

let fs = require('fs');

let { src, dest, parallel, series } = require('gulp'),
    gulp = require('gulp'),
    browsersync = require('browser-sync').create(),
    fileinclude = require('gulp-file-include'),
    del = require('del'),
    autoprefixer = require('gulp-autoprefixer'),
    scss = require('gulp-sass'),
    gulpGroupCssMediaQueries = require('gulp-group-css-media-queries'),
    rename = require('gulp-rename'),
    imagemin = require('gulp-imagemin'),
    csso = require('gulp-csso'),
    svgSprite = require('gulp-svg-sprite'),
    ttf2woff = require('gulp-ttf2woff'),
    ttf2woff2 = require('gulp-ttf2woff2'),
    fonter = require('gulp-fonter'),
    gulpif = require('gulp-if'),
    webp = require('gulp-webp'),
    webpHTML = require('gulp-webp-html'),
    webpcss = require("gulp-webpcss"),
    uglify = require('gulp-uglify-es').default;

let web = true;

function browserSync(params) {
    browsersync.init({
        server: {
            baseDir: "./" + project_folder + "/",
        },
        port: 3000,
        notify: false,
    })
}

function fonts() {
    src(path.src.fonts)
        .pipe(ttf2woff())
        .pipe(dest(path.build.fonts))
    return src(path.src.fonts)
        .pipe(ttf2woff2())
        .pipe(dest(path.build.fonts))
}

gulp.task('otf2ttf', function () {
    return gulp.src([source_folder + '/fonts/*.otf'])
        .pipe(fonter({
            formats: ['ttf']
        }))
        .pipe(dest(source_folder + '/fonts/'))
})


function html() {
    return src(path.src.html)
        .pipe(fileinclude())
        .pipe(gulpif(web, webpHTML()))
        .pipe(dest(path.build.html))
        .pipe(browsersync.stream())
}

function css() {
    return src(path.src.css)
        .pipe(scss({ outputStyle: 'compressed' }))
        .pipe(autoprefixer({
            grid: true,
            overrideBrowserslist: ["last 5 versions"],
            cascade: true
        }))
        .pipe(gulpGroupCssMediaQueries())
        .pipe(gulpif(web, webpcss()))
        .pipe(dest(path.build.css))
        .pipe(csso({
            restructure: false,
            sourceMap: true,
            debug: true
        }))
        .pipe(rename({ extname: ".min.css" }))
        .pipe(dest(path.build.css))
        .pipe(browsersync.stream())
}

function js() {
    return src(path.src.js)
        .pipe(fileinclude())
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(rename({ extname: ".min.js" }))
        .pipe(dest(path.build.js))
        .pipe(browsersync.stream())
}

function images() {
    return src(path.src.img)
        .pipe(gulpif(web, webp({ quality: 70 })))
        .pipe(gulpif(web, dest(path.build.img)))
        .pipe(gulpif(web, src(path.src.img)))
        .pipe(
            imagemin({
                progressive: true,
                svgoPlugins: [
                    {
                        removeViewBox: false
                    }
                ],
                interlaced: true,
                optimizationLevel: 3,
            })
        )
        .pipe(dest(path.build.img))
        .pipe(browsersync.stream())
}

gulp.task('svgSprite', function () {
    return gulp.src([source_folder + '/iconsprite/*.svg'])
        .pipe(svgSprite({
            mode: {
                stack: {
                    sprite: '../icons/icons.svg',
                    example: true,
                }
            }
        }))
        .pipe(dest(path.build.img))
})

gulp.task('json', function () {
    return gulp.src([source_folder + '/json/*.json'])
        .pipe(dest(path.build.js))
})


gulp.task('libry', function () {
    return gulp.src([source_folder + '/libry/**/*'])
        .pipe(dest(path.build.html))
})

function libry() {
    return src(path.src.libry)
        .pipe(dest(path.build.libry))
        .pipe(browsersync.stream())
}

function watchFiles() {
    gulp.watch([path.watch.html], html)
    gulp.watch([path.watch.css], css)
    gulp.watch([path.watch.js], js)
    gulp.watch([path.watch.img], images)
}

function clean(params) {
    return del(path.clean)
}

function fontsStyle() {
    let file_content = fs.readFileSync(source_folder + '/scss/_fonts.scss');
    if (file_content == '') {
        fs.writeFile(source_folder + '/scss/_fonts.scss', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                    fontname = fontname[0];
                    if (c_fontname != fontname) {
                        fs.appendFile(source_folder + '/scss/_fonts.scss', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                    }
                    c_fontname = fontname;
                }
            }
        })
    }
}

function cb() {

}

let build = series(clean, parallel(images, js, css, html, fonts), fontsStyle),
    watch = parallel(build, watchFiles, browserSync);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;