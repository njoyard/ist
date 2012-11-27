BEGIN {
	state = "start";
}

{
	if ($0 ~ /^#/) {	
		if (state != "start" && state != "search") {
			print "</section>";
			print "</section>";
		}
	
		state = "search";
	}

	if ($0 ~ /^[^#`]/) {
		if (state == "search") {
			print "<section class=\"doc-item\">";
			print "<section class=\"doc-desc\">";
			state = "para";
		}
	}

	if ($0 ~ /^```/) {
		if (state == "para") {
			print "</section>";
			print "<section class=\"doc-code\">";
			state = "code";
		} else if (state == "code") {
			state = "code-end";
		}
	}
	
	print $0;

	if ($0 ~ /^```/) {
		if (state == "code-end") {
			print "</section>";
			print "</section>";
			state = "search";
		}
	}
}

END {
	if (state != "start" && state != "search") {
		print "</section>";
		print "</section>";
		print "";
	}
}

