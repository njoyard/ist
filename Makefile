all: doc2.markdown

src/doc-parsed.markdown: src/doc.markdown
	cat src/doc.markdown \
		| awk -f src/addsections.awk \
		| sed -r \
			-e 's:}}:}_}:g' \
			-e 's:\{\{:{{ opencurly }}:g' \
			-e 's:}_}:{{ closecurly }}:g' \
			-e 's:```(.+):{% highlight \1 %}:' \
			-e 's:```:{% endhighlight %}:' \
			-e 's:(#+) (.*):\1 <a name="\2">\2</a>:' \
		> src/doc-parsed.markdown

src/doc-toc.markdown: src/doc-parsed.markdown
	cat src/doc-parsed.markdown \
		| egrep '^#' \
		| sed -r \
			-e 's:^## (.*)$$:* \1:' \
			-e 's:^### (.*)$$:    * \1:' \
			-e 's:^#### (.*)$$:        * \1:' \
			-e 's:^##### (.*)$$:            * \1:' \
			-e 's:^###### (.*)$$:                * \1:' \
			-e 's:<a name=":<a href="#:' \
		> src/doc-toc.markdown

doc2.markdown: src/doc-head.in src/doc-toc.markdown src/doc-parsed.markdown
	cat src/doc-head.in src/doc-toc.markdown src/doc-parsed.markdown > doc2.markdown
		
clean:
	rm -f doc2.markdown
	rm -f src/doc-toc.markdown
	rm -f src/doc-parsed.markdown

