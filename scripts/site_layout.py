"""Shared Swiss red navigation and document shell for the static website."""
from html import escape
import re

SITE = 'https://nipunbatra.github.io/'
VERSION = '20261004-swiss'
NAVIGATION = [
    ('index.html', 'Home'),
    ('https://sustainability-lab.github.io/papers/', 'Publications'),
    ('teaching.html', 'Teaching'),
    ('projects.html', 'Open source'),
    ('https://sustainability-lab.github.io/', 'Research group'),
    (SITE + 'cv/cv.pdf', 'CV'),
    (SITE + 'blog/', 'Blog'),
]

def navigation(active):
    links = ''.join(f'<a href="{escape(url, quote=True)}"' + (' aria-current="page"' if url == active else '') + f'>{label}</a>' for url, label in NAVIGATION)
    return '''<header class="site-header"><a class="site-name" href="index.html" aria-label="Nipun Batra · Home"><span class="brand-name">Nipun Batra</span><span class="institution">IIT<br>GANDHINAGAR</span></a>
<nav class="site-nav" aria-label="Primary navigation">''' + links + '''</nav>
<label class="appearance-control" for="appearance"><span>Appearance</span><select id="appearance" aria-label="Color theme"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label></header>'''

def footer():
    return '<footer class="site-footer"><span>Nipun Batra · IIT Gandhinagar</span><a href="mailto:nipun.batra@iitgn.ac.in">Email</a></footer>'

def render_page(main, *, title, description, filename, body_class, active, styles=(), scripts=(), extra_head='', after_main=''):
    canonical = SITE + ('' if filename == 'index.html' else filename)
    styles_html = ''.join(f'<link rel="stylesheet" href="{name}?v={VERSION}">' for name in styles)
    scripts_html = ''.join(f'<script src="{name}?v={VERSION}" defer></script>' for name in scripts)
    # Rebuilding an existing page replaces its shared footer without touching content.
    main = re.sub(r'<footer class="site-footer">.*?</footer>', '', main, flags=re.S)
    main = main.replace('</main>', footer() + '</main>')
    social_meta = '' if 'og:title' in extra_head else f'''<meta property="og:title" content="{escape(title, quote=True)}"><meta property="og:description" content="{escape(description, quote=True)}"><meta property="og:type" content="website"><meta property="og:site_name" content="Nipun Batra"><meta property="og:url" content="{canonical}"><meta property="og:image" content="{SITE}images/nipun.jpg"><meta name="twitter:card" content="summary_large_image">'''
    social_meta = '\n'.join(re.findall(r'<meta[^>]*>', social_meta))
    metadata = '\n'.join(part.strip() for part in [social_meta, extra_head] if part.strip())
    return f'''<!doctype html>
<html lang="en" data-design="swiss" data-mode="light" data-theme="light">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="theme-color" content="#fffefa"><meta name="author" content="Nipun Batra">
<title>{escape(title)}</title><meta name="description" content="{escape(description, quote=True)}"><link rel="canonical" href="{canonical}">
<link rel="icon" href="images/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet">
<script src="site.js?v={VERSION}"></script>{styles_html}<link rel="stylesheet" href="site.css?v={VERSION}">{scripts_html}
{metadata}</head>
<body class="{body_class}"><a class="skip-link" href="#main">Skip to content</a><div class="site-frame">{navigation(active)}
{main}</div>{after_main}</body></html>
'''
