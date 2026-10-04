"""Build homepage design options using the live homepage's complete biography."""
from pathlib import Path
from html import escape, unescape
import json
import re

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
source = (ROOT / 'index.html').read_text()
bio = re.search(r'<div class="bio-copy">(.*?)</div>', source, re.S).group(1).strip()
social = re.search(r'<div class="social-links"[^>]*>(.*?)</div>', source, re.S).group(1).strip()
# Small, consistent profile icons, as in the selected reference boards.
icons = {
    'Email': '<rect x="2" y="4" width="20" height="16" rx="1"/><path d="m2 5 10 8 10-8"/>',
    'Scholar': '<path d="m1 8 11-5 11 5-11 5zM5 10v7c4 4 10 4 14 0v-7M23 8v10"/>',
    'GitHub': '<path d="M9 21c-5 1-5-3-7-3m14 5v-4c0-1-.3-2-1-2 4-.5 7-2 7-7 0-2-.6-3-2-4 .2-1 .2-3-1-4-2 0-3 1-4 2a13 13 0 0 0-6 0C8 3 6 2 5 2 4 3 4 5 4 6c-1 1-2 2-2 4 0 5 3 6.5 7 7-.7.5-1 1.5-1 2v4"/>',
    'X / Twitter': '<path d="M4 3h4l12 18h-4zM20 3 4 21"/>',
    'LinkedIn': '<rect x="2" y="2" width="20" height="20" rx="1"/><path d="M7 10v8M7 6v1M11 18v-8m0 3c0-4 7-4 7 0v5"/>',
    'YouTube': '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 6 3-6 3z"/>',
}
for label, paths in icons.items():
    social = social.replace('>' + label + '</a>', '><svg viewBox="0 0 24 24" aria-hidden="true">' + paths + '</svg><span>' + label + '</span></a>')
content = json.loads((HERE / 'content.json').read_text())
content['bio_html'] = bio
content['bio_paragraphs'] = [unescape(re.sub('<[^>]+>', '', p)) for p in re.findall(r'<p>(.*?)</p>', bio, re.S)]
(HERE / 'content.json').write_text(json.dumps(content, ensure_ascii=False, indent=2) + '\n')
videos = ''.join(f'''<a class="video" href="{escape(v['url'], quote=True)}">
  <div class="video-thumb"><img src="../../../{v['image']}" alt="{escape(v['label'], quote=True)} conversation thumbnail" width="480" height="360" loading="lazy"><span class="play" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="M2 1 11 6 2 11z"/></svg></span></div>
  <h3>{escape(v['label'])}</h3><p class="video-meta">{escape(v['title'])}</p></a>''' for v in content['videos'])
page = '''<!doctype html>
<html lang="en" data-design="swiss" data-mode="light">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><meta name="color-scheme" content="light dark">
<title>Homepage design preview · Nipun Batra</title><meta name="description" content="Four homepage design options with the complete biography and two conversations, in light and dark modes.">
<link rel="icon" href="data:,"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&amp;family=Instrument+Serif:ital@0;1&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="preview.css?v=20261004-shared-swiss"><script src="preview.js" defer></script></head>
<body class="home-page"><a class="skip-link" href="#main">Skip to content</a>
<aside class="preview-tools" aria-label="Preview controls"><div class="preview-title"><strong>Website preview</strong><a href="review.html?v=20261004-shared-swiss">See all previews</a></div>
<div class="design-options" role="group" aria-label="Design"><button type="button" data-design-option="swiss" aria-pressed="true">1 · Swiss red</button><button type="button" data-design-option="editorial" aria-pressed="false">2 · Warm editorial</button><button type="button" data-design-option="index" aria-pressed="false">3 · Scientific index</button><button type="button" data-design-option="forest" aria-pressed="false">4 · Forest notebook</button></div>
<label class="mode-control" for="page">Page<select id="page"><option value="index.html">Home</option><option value="teaching.html">Teaching</option><option value="teaching-videos.html">Video directory</option><option value="projects.html">Open source</option></select></label><label class="mode-control" for="mode">Appearance<select id="mode"><option value="light">Light</option><option value="dark">Dark</option><option value="system" selected>System</option></select></label></aside>
<div class="site-frame"><header class="site-header"><a class="site-name" href="#main"><span class="brand-name">Nipun Batra</span><span class="institution">IIT<br>GANDHINAGAR</span></a><nav class="site-nav" aria-label="Primary navigation"><a href="#main" aria-current="page">Home</a><a href="https://sustainability-lab.github.io/papers/">Publications</a><a href="../../../teaching.html">Teaching</a><a href="../../../projects.html">Open source</a><a href="https://sustainability-lab.github.io/">Research group</a><a href="https://nipunbatra.github.io/cv/cv.pdf">CV</a><a href="https://nipunbatra.github.io/blog/">Blog</a></nav></header>
<main id="main"><div class="overview"><div class="profile">
<figure class="portrait"><img src="../../../images/nipun.jpg" alt="Portrait of Nipun Batra" width="516" height="480"></figure>
<div class="biography"><header class="identity"><h1>Nipun Batra</h1><p class="role">Associate Professor at IIT Gandhinagar · Lead, Sustainability Lab</p></header>
<div class="bio">BIO_PLACEHOLDER</div>
<nav class="social" aria-label="Profiles and contact">SOCIAL_PLACEHOLDER</nav></div></div>
<section class="conversations" aria-labelledby="conversation-title"><h2 class="section-label" id="conversation-title">In conversation</h2><div class="video-pair">VIDEOS_PLACEHOLDER</div></section>
<div class="discovery"><section aria-labelledby="research-title"><h2 class="section-label" id="research-title">Research</h2><ul class="topic-links illustrated-links"><li><a href="https://sustainability-lab.github.io/"><span class="topic-visual visual-buildings" aria-hidden="true"></span><span class="topic-copy">Smart buildings<small>Learning from energy use in buildings.</small></span></a></li><li><a href="https://sustainability-lab.github.io/"><span class="topic-visual visual-air" aria-hidden="true"></span><span class="topic-copy">Air quality<small>Sensing and modelling the air we breathe.</small></span></a></li><li><a href="https://sustainability-lab.github.io/"><span class="topic-visual visual-health" aria-hidden="true"></span><span class="topic-copy">Wearable health<small>Health signals from wearable sensors.</small></span></a></li></ul><div class="minor-links"><a href="https://sustainability-lab.github.io/papers/">Publications</a><a href="https://sustainability-lab.github.io/">Sustainability Lab</a><a href="https://sustainability-lab.github.io/openings.html">Open positions</a></div></section>
<section aria-labelledby="teaching-title"><h2 class="section-label" id="teaching-title">Teaching</h2><ul class="topic-links illustrated-links"><li><a href="../../../teaching.html#courses"><span class="topic-visual visual-neural" aria-hidden="true"></span><span class="topic-copy">Courses by semester<small>Course materials and lecture recordings.</small></span></a></li><li><a href="../../../teaching.html#series"><span class="topic-visual visual-ml" aria-hidden="true"></span><span class="topic-copy">Video playlists<small>Short explanations and full courses.</small></span></a></li><li><a href="../../../teaching.html#cheatsheets"><span class="topic-visual visual-cheatsheets" aria-hidden="true"></span><span class="topic-copy">Cheatsheets<small>Quick references, organised by course.</small></span></a></li></ul><p class="current-course"><a href="https://nipunbatra.github.io/dl-2026/">Deep Learning</a><span>ES 667 · Aug 2026</span></p></section></div></div>
<footer class="site-footer"><span>Nipun Batra · IIT Gandhinagar</span><a href="../../../index.html">Current homepage</a></footer></main></div></body></html>'''
page = page.replace('BIO_PLACEHOLDER', bio).replace('SOCIAL_PLACEHOLDER', social).replace('VIDEOS_PLACEHOLDER', videos)
(HERE / 'index.html').write_text(page)
print('Built four-style preview with all three original bio paragraphs and both conversation videos.')
