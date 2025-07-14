.PHONY: all clean

# Default target is to compile the full version
all: cv.pdf

# Compile the short version
short: cv-short.pdf

# Compile the full version
cv.pdf: cv.tex
	pdflatex -jobname=cv '\def\shortversion{0} \input{cv.tex}'

# Compile the short version with smaller fonts and margins
cv-short.pdf: cv.tex
	pdflatex -jobname=cv-short '\def\shortversion{1} \input{cv.tex}'

# Clean up auxiliary files
clean:
	rm -f *.aux *.log *.out *.toc *.bbl *.blg *.synctex.gz
