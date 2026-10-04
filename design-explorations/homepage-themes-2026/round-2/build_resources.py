"""Add the published teaching and project pages to the isolated theme preview."""
from pathlib import Path
from html import escape, unescape
from urllib.parse import urlsplit
import json
import re
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
PAGES = {'index.html', 'teaching.html', 'teaching-videos.html', 'projects.html'}

def published(name):
    # Other work may be in progress locally; use the committed site content.
    return subprocess.check_output(['git', 'show', f'HEAD:{name}'], cwd=ROOT, text=True)

def rebase(url):
    value = unescape(url)
    if value.startswith(('#', 'mailto:', 'data:')):
        return value
    if value.startswith('https://nipunbatra.github.io/'):
        relative = value.removeprefix('https://nipunbatra.github.io/')
        if urlsplit(relative).path in PAGES:
            return relative
    if value.startswith(('https:', 'http:', '//')):
        return value
    if urlsplit(value).path in PAGES:
        return value
    return '../../../' + value.lstrip('/')

def rebase_attributes(markup):
    return re.sub(r'(href|src|action)="([^"]*)"', lambda m: m[1] + '="' + escape(rebase(m[2]), quote=True) + '"', markup)

home = (HERE / 'index.html').read_text()
home = home.replace('../../../teaching.html', 'teaching.html').replace('../../../projects.html', 'projects.html')
(HERE / 'index.html').write_text(home)
footer = re.search(r'<footer class="site-footer">.*?</footer>', home, re.S).group()
for name in ['teaching.html', 'teaching-videos.html', 'projects.html']:
    source = published(name)
    main = re.search(r'<main\b[^>]*>.*?</main>', source, re.S).group()
    main = rebase_attributes(main).replace('</main>', footer + '</main>')
    page = re.sub(r'<main\b[^>]*>.*?</main>', lambda _: main, home, count=1, flags=re.S)
    label = {'teaching.html': 'Teaching', 'teaching-videos.html': 'Teaching videos', 'projects.html': 'Open source'}[name]
    page = re.sub(r'<title>.*?</title>', f'<title>{label} · Website preview · Nipun Batra</title>', page)
    page = page.replace('<body class="home-page">', '<body class="resource-page ' + ('projects-preview' if name == 'projects.html' else 'teaching-body') + '">')
    header = re.search(r'<header class="site-header">.*?</header>', page, re.S).group()
    updated = header.replace('href="#main"', 'href="index.html"').replace(' aria-current="page"', '')
    active = 'projects.html' if name == 'projects.html' else 'teaching.html'
    updated = updated.replace(f'href="{active}"', f'href="{active}" aria-current="page"')
    page = page.replace(header, updated)
    styles = '<link rel="stylesheet" href="../../../common.css">'
    scripts = ''
    if name == 'projects.html':
        styles += re.search(r'<style>.*?</style>', source, re.S).group()
        scripts = '<script src="projects-filter.js" defer></script>'
        search = re.search(r"    const searchInput =.*?(?=    function updateThemeControl)", source, re.S).group()
        (HERE / 'projects-filter.js').write_text('(() => {\n' + search + '\nfilterProjects();\n})();\n')
    else:
        styles += '<link rel="stylesheet" href="../../../teaching.css">'
        data = json.loads(re.search(r'<script id="teaching-search-data" type="application/json">(.*?)</script>', source, re.S)[1])
        for item in data:
            item['url'] = rebase(item['url'])
        encoded = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')
        scripts = '<script id="teaching-search-data" type="application/json">' + encoded + '</script><script src="../../../teaching.js" defer></script>'
    page = page.replace('<link rel="stylesheet" href="preview.css?v=20261004-match">', styles + '<link rel="stylesheet" href="preview.css?v=20261004-match"><link rel="stylesheet" href="resources.css?v=20261004-match">')
    page = page.replace('</body>', scripts + '</body>')
    (HERE / name).write_text(page)
    print('Built themed preview:', name)
