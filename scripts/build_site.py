"""Refresh the shared Swiss shell around the existing static page content.

Edit content in the root HTML files; this rebuild preserves each <main> and its
metadata. Teaching pages are generated separately from data/teaching.
"""
from pathlib import Path
from html import unescape
import re
import subprocess
import sys
from site_layout import render_page

ROOT = Path(__file__).resolve().parents[1]
SERIES = ['ml-in-1-minute.html', 'dl-in-3-minutes.html', 'psdv-in-1-minute.html', 'python-in-1-minute.html', 'stai-in-1-minute.html']

def refresh(filename):
    source = (ROOT / filename).read_text()
    head = re.search(r'<head\b[^>]*>(.*?)</head>', source, re.S | re.I).group(1)
    main = re.search(r'<main\b[^>]*>.*?</main>', source, re.S).group()
    title = unescape(re.search(r'<title>(.*?)</title>', head, re.S).group(1))
    description = unescape(re.search(r'<meta name="description" content="([^"]*)"', head).group(1))
    # Preserve social cards and any structured data already maintained on a page.
    extra = '\n'.join(re.findall(r'<meta (?:property="og:[^"]*"|name="twitter:[^"]*")[^>]*>', head))
    extra += '\n' + '\n'.join(re.findall(r'<script type="application/ld\+json">.*?</script>', head, re.S))
    if filename == 'index.html':
        body_class, active, styles, scripts = 'home-page', 'index.html', (), ()
    elif filename == 'projects.html':
        body_class, active = 'resource-page projects-page', 'projects.html'
        styles, scripts = ('common.css', 'projects.css'), ('projects.js',)
    else:
        body_class, active = 'resource-page series-page', 'teaching.html'
        styles, scripts = ('common.css', 'series.css'), ('series.js',)
    result = render_page(main, title=title, description=description, filename=filename,
                         body_class=body_class, active=active, styles=styles,
                         scripts=scripts, extra_head=extra)
    (ROOT / filename).write_text(result)
    print('Built', filename)

def main():
    for filename in ['index.html', 'projects.html', *SERIES]:
        refresh(filename)
    subprocess.run([sys.executable, str(ROOT / 'scripts/build_teaching.py')], check=True)

if __name__ == '__main__':
    main()
