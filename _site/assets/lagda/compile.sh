#!/bin/bash

rm -rf generated

lagdas=$(find *.lagda.md -type f)
mkdir -p generated

agda --html --html-highlight=code --html-dir=./generated index.lagda.md

for lagda in $lagdas
do
	html="./generated/${lagda%%.*}.md"
	echo Working on $html...
	out="${html%.md}.html"
	pandoc --mathjax $html > $out
done

echo Done, processing generated HTML files...

for html in $(find ./generated/*.html -type f)
do
	file=$(cat $html)
	fileName=$(basename $html)
	read -r -d '' fileHead <<EO_FILE_HEAD
---
layout: page
permalink: /lagda/${fileName}
inline_latex: true
agda: true
---
<body>
{% raw %}
EO_FILE_HEAD
	out="${html%.html}.md"
	if [ -f $out ]; then
		echo Literate Agda file $html
		echo "$fileHead$file{% endraw %}</body>" > $html
		rm $out
	else
		echo Regular Agda file $html
		echo "$fileHead<pre class=\"Agda\">$file</pre>{% endraw %}</body>" > $html
	fi
done

rm ./generated/Agda.css
