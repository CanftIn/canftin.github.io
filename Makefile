build:
	hugo --contentDir=content --gc --minify

dev:
	hugo server --contentDir=content --disableFastRender
