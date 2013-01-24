all: fonts

fonts:
	cd fonts; mkfontdir; make
	find public/fonts -type l -delete
	cd public/fonts/; ln -s ../../fonts/out/*.woff .
	cd public/fonts/; ln -s ../../fonts/out/*.json .
	cd public/fonts/; ln -s ../../fonts/fonts.dir .
