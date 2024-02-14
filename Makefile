.DEFAULT_GOAL := test

.PHONY: sass
.PHONY: test
.PHONY: debug

format:
	find html/javascript -name "*.js" -exec npx eslint --fix {} +
# 	find test            -name "*.js" -exec npx eslint --fix {} +
	sass --no-source-map sass/themes:html/css

build: format

test: build
# 	npm test

build-all: test

debug: format
	npm run debug

run: build
#	python3 -m http.server 9000 --directory ./html
	python3 httpd.py

sass: 
	find sass -name "*.scss" | entr sass --no-source-map sass/themes:html/css

release:
	rm -rf dist/html
	mkdir -p dist/html/css
	mkdir -p dist/html/fonts
	mkdir -p dist/html/images
	mkdir -p dist/html/javascript
	mkdir -p dist/html/midi
	cp    html/index.html  dist/html
	cp    html/favicon.ico dist/html
	cp -r html/css         dist/html
	cp -r html/fonts       dist/html
	cp -r html/images      dist/html
	cp -r html/javascript  dist/html
	cp -r html/midi        dist/html
# 	npx rollup --config snyth.config.js
# 	npx rollup --config components.config.js
# 	sed -i '' 's#snyth\.js#bundle\.js#'                     dist/html/index.html
# 	sed -i '' 's#components/components\.js#components\.js#' dist/html/index.html
# 	sed -i '' 's#/worklets/wavetable\.js#/wavetable\.js#'   dist/html/javascript/bundle.js
# 	sed -i '' 's#/worklets/dds\.js#/dds\.js#'               dist/html/javascript/bundle.js
# 	sed -i '' 's#/worklets/lfo\.js#/lfo\.js#'               dist/html/javascript/bundle.js

