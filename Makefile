build:
	hugo --contentDir=content --gc --minify --cleanDestinationDir

dev:
	hugo server --contentDir=content --disableFastRender
