"""Builds the reorganisation mockups from the site's real teaching catalog."""
import json, re, html, os
from collections import OrderedDict

REPO = '/home/claude/nipunbatra.github.io'
OUT = os.path.dirname(os.path.abspath(__file__))
cat = json.load(open(f'{REPO}/data/teaching/catalog.json'))
sheets = json.load(open(f'{REPO}/data/teaching/cheatsheets.json'))
e = lambda s: html.escape(str(s), quote=True)
CUR = ' aria-current="page"'
A = lambda u, t: f'<a href="{e(u)}">{t}</a>'
LEC = '<span class="pill rec">Lectures</span>'
CHS = '<span class="pill">Cheatsheets</span>'
SITE = 'https://nipunbatra.github.io/'
COLS = {c['id']: c for c in cat['collections']}
SHEETS = {g['id']: g for g in sheets['groups']}
COURSES = cat['courses']
NVID = len(cat['videos']); NSHEET = sum(len(g['sheets']) for g in sheets['groups'])

def abs_url(u):
    return u if u.startswith('http') else SITE + u

ATLAS = {0:(1,0),1:(1,1),2:(1,2),3:(1,3),4:(2,0),5:(2,1),7:(2,3),8:(3,0),9:(3,1),10:(3,2),11:(3,3),
         12:(4,0),13:(4,1),14:(4,2),15:(4,3),16:(5,0),17:(5,1),18:(5,2),19:(5,3)}
POS = ['0 0', '100% 0', '0 100%', '100% 100%']
def cover(n, cls='cover'):
    a, p = ATLAS[n]
    return f'<span class="{cls}" style="background-image:url(\'img/cover-atlas-0{a}.webp\');background-position:{POS[p]}" aria-hidden="true"></span>'
def research(p):
    return f'<span class="cover res" style="background-position:{POS[p]}" aria-hidden="true"></span>'

def dur(iso):
    m = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', iso)
    h, mi, s = (int(x or 0) for x in m.groups())
    return f'{h}:{mi:02d}:{s:02d}' if h else f'{mi}:{s:02d}'

def plural(n, w):
    return f'{n} {w}' + ('' if n == 1 else 's')

def year_of(c):
    m = re.search(r'(\d{4})', c['semester']); return m.group(1)

ICONS = {
 'Email': '<rect x="2" y="4" width="20" height="16" rx="1"/><path d="m2 5 10 8 10-8"/>',
 'Scholar': '<path d="m1 8 11-5 11 5-11 5zM5 10v7c4 4 10 4 14 0v-7M23 8v10"/>',
 'GitHub': '<path d="M9 21c-5 1-5-3-7-3m14 5v-4c0-1-.3-2-1-2 4-.5 7-2 7-7 0-2-.6-3-2-4 .2-1 .2-3-1-4-2 0-3 1-4 2a13 13 0 0 0-6 0C8 3 6 2 5 2 4 3 4 5 4 6c-1 1-2 2-2 4 0 5 3 6.5 7 7-.7.5-1 1.5-1 2v4"/>',
 'X / Twitter': '<path d="M4 3h4l12 18h-4zM20 3 4 21"/>',
 'LinkedIn': '<rect x="2" y="2" width="20" height="20" rx="1"/><path d="M7 10v8M7 6v1M11 18v-8m0 3c0-4 7-4 7 0v5"/>',
 'YouTube': '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 6 3-6 3z"/>',
}
SOCIAL = [('Email','mailto:nipun.batra@iitgn.ac.in'),('Scholar','https://scholar.google.co.in/citations?user=rFGzHlIAAAAJ&hl=en'),
          ('GitHub','https://github.com/nipunbatra'),('X / Twitter','https://twitter.com/nipun_batra'),
          ('LinkedIn','https://www.linkedin.com/in/nipunbatra0/'),('YouTube','https://www.youtube.com/@NipunBatra0')]
def social():
    return '<nav class="social" aria-label="Profiles">' + ''.join(
        f'<a href="{e(u)}"><svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[n]}</svg><span>{n}</span></a>' for n,u in SOCIAL) + '</nav>'

BIO1 = ('Nipun Batra is an Associate Professor in <a href="https://cs.iitgn.ac.in/">Computer Science</a> at '
        '<a href="https://iitgn.ac.in/">IIT Gandhinagar</a>, where he leads the <a href="https://sustainability-lab.github.io/">Sustainability Lab</a>. '
        'He previously completed his postdoc at the University of Virginia and his PhD from IIIT Delhi as a TCS PhD fellow.')
BIO2 = ('His group develops AI-powered solutions for critical sustainability challenges including smart buildings, '
        'air quality monitoring, and wearable healthcare technologies.')
BIO3 = ('His work has received several <a href="https://sustainability-lab.github.io/awards.html">awards</a>, including Best Paper Runner-Up at ACM BuildSys 2026, ACM eEnergy Test of Time Award 2025, ACM SIGEnergy Rising Star Award 2025, Excellence in Teaching Award at IITGN 2025, Young Alumni Award from IIIT Delhi 2023, Best PhD Presentation at ACM SenSys 2015, Best Demo at ACM BuildSys 2014, and Best Video Nominee at ACM KDD 2016.')
AWARDS = [('2026','Best Paper Runner-Up','ACM BuildSys'),('2025','Test of Time Award','ACM eEnergy'),
          ('2025','Rising Star Award','ACM SIGEnergy'),('2025','Excellence in Teaching Award','IIT Gandhinagar'),
          ('2023','Young Alumni Award','IIIT Delhi'),('2016','Best Video Nominee','ACM KDD'),
          ('2015','Best PhD Presentation','ACM SenSys'),('2014','Best Demo','ACM BuildSys')]
CONVOS = [('https://youtu.be/_pCP6ZvH1VM','img/iiitd-podcast.jpg','IIIT-Delhi · AlumX Ep. 05','From IIIT-Delhi to AI &amp; sustainability researcher'),
          ('https://www.youtube.com/watch?v=-pyj8cTdUK4','img/tedx-conversation.jpg','TEDxIITGandhinagar · Season 2','Prof. Nipun Batra | TEDxConversations')]
PLAY = '<span class="play" aria-hidden="true"><svg viewBox="0 0 12 12"><path d="M2 1 11 6 2 11z"/></svg></span>'
def convo(u, img, t, m):
    return f'<a class="vcard" href="{u}"><div class="vthumb"><img src="{img}" alt="" loading="lazy">{PLAY}</div><h3>{t}</h3><p>{m}</p></a>'
LAB = 'https://sustainability-lab.github.io/'
RESEARCH = [('Smart buildings','Learning from energy use in buildings.',0),
            ('Air quality','Sensing and modelling the air we breathe.',1),
            ('Wearable health','Health signals from wearable sensors.',2)]
UPDATES = [('Oct 2026','Interactive','How CLIP learns: the contrastive loss, explained with a live figure.', SITE+'interactives/clip-loss/'),
           ('Sep 2026','Videos','Python in 1 minute: all 77 Shorts for ES 112 are now online.', SITE+'python-in-1-minute.html'),
           ('Sep 2026','Videos','Probability &amp; statistics in 1 minute: 53 Shorts.', SITE+'psdv-in-1-minute.html'),
           ('Sep 2026','Open source','Scancat, a webcam document scanner.', SITE+'projects.html'),
           ('Aug 2026','Course','Deep Learning (ES 667) begins, with lectures and cheatsheets.', SITE+'dl-2026/')]
LEARN_PROJECTS = [('LLM from scratch','A six-part series that builds a language model piece by piece.'),
                  ('Autograd playground','An interactive computational-graph explorer for learning backpropagation.'),
                  ('VLM from scratch','Inspectable notebooks for understanding vision-language models.'),
                  ('Interactive articles','Intuition-first articles with live, manipulable visual explanations.'),
                  ('Docker ML demos','Five progressive examples, from hello-world containers to deployable ML apps.'),
                  ('CS Research Methods Bootcamp','Reading, designing and communicating computer-science research.')]

NAV = [('Home','home'),('Publications','https://sustainability-lab.github.io/papers/'),('Teaching','teaching'),
       ('Open source','projects'),('Research group',LAB),('CV',SITE+'cv/cv.pdf'),('Blog',SITE+'blog/')]
DIRS = OrderedDict([('a','A · Refined index'),('b','B · Subject hubs'),('c','C · Library and paths')])

def page(d, which, title, body, extra_head='', fname=None, bar_extra=''):
    nav = ''.join(
        f'<a href="{d if t!="projects" else "a"}-{t}.html"{CUR if t==which else ""}>{n}</a>' if t in ('home','teaching','projects')
        else f'<a href="{e(t)}">{n}</a>' for n,t in NAV)
    bar = ['<strong>Mockup</strong>','<a href="index.html">All proposals</a>','<span class="sep">|</span>']
    for k,v in DIRS.items():
        cur = ' aria-current="page"' if k==d else ''
        bar.append(f'<a href="{k}-home.html"{cur}>{v}</a>')
    bar += ['<span class="sep">|</span>', f'<a href="{d}-home.html"{CUR if which=="home" else ""}>Home</a>',
            f'<a href="{d}-teaching.html"{CUR if which=="teaching" else ""}>Teaching</a>']
    if d == 'a': bar.append(f'<a href="a-projects.html"{CUR if which=="projects" else ""}>Open source</a>')
    doc = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light dark"><title>{title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="mock.css"><link rel="stylesheet" href="palettes.css"><script src="theme.js"></script>{extra_head}</head>
<body><div class="mockbar"><div class="mockbar-in">{"".join(bar)}{bar_extra}</div></div>
<div class="frame"><aside class="rail"><span class="inst">IIT<br>GANDHINAGAR</span><nav aria-label="Primary">{nav}</nav><div class="appearance"><button type="button" class="mode" role="switch" aria-checked="false" aria-label="Dark mode" title="Light or dark appearance"><span class="sky"></span><span class="stars"><b style="left:9px;top:6px"></b><b style="left:15px;top:15px"></b><b style="left:23px;top:8px;opacity:.7"></b></span><span class="knob"></span></button></div></aside>
<main>{body}</main><footer class="foot"><span>Nipun Batra · IIT Gandhinagar</span><span>nipun.batra@iitgn.ac.in</span></footer></div></body></html>'''
    open(f'{OUT}/{fname or (d+"-"+which+".html")}','w').write(doc)

# ---------- course groupings ----------
LINEAGE = [
 ('Machine Learning', 'ES 654 / ES 335', lambda c: c['title']=='Machine Learning'),
 ('Deep Learning', 'ES 667', lambda c: c['code']=='ES667'),
 ('Probabilistic Machine Learning', 'CS 691 / ES 661', lambda c: c['title']=='Probabilistic Machine Learning'),
 ('Probability, Statistics &amp; Data Visualization', 'ES 114', lambda c: c['code']=='ES114'),
 ('Software Tools and Techniques for AI', 'CS 203', lambda c: c['code']=='CS203'),
 ('Principles of AI', 'ES 119', lambda c: c['code']=='ES119'),
 ('AI for Social Good', 'CS 691', lambda c: c['title']=='AI for Social Good'),
 ('Computing', 'ES 112', lambda c: c['code']=='ES112'),
 ('Operating Systems', 'CS 301', lambda c: c['code']=='CS301'),
 ('Graduate Systems', 'CS 612', lambda c: c['code']=='CS612'),
 ('Ubiquitous Computing', 'CS 691', lambda c: c['title']=='Ubiquitous Computing'),
]
assert sum(len([c for c in COURSES if f(c)]) for _,_,f in LINEAGE) == len(COURSES)
def offerings(f):
    return sorted([c for c in COURSES if f(c)], key=lambda c: (year_of(c), c['semester']))
def off_label(c):
    s = c['semester']; return s.replace('Winter','Win')
def chip(c, now=False):
    cls = 'pill now' if now else ('pill rec' if c.get('recordings') else 'pill')
    sheet = ' <span aria-label="cheatsheets">§</span>' if c.get('cheatsheets_url') else ''
    t = f'{off_label(c)}{" · recorded" if c.get("recordings") else ""}{" · cheatsheets" if c.get("cheatsheets_url") else ""}'
    return f'<a class="{cls} num" href="{e(c["url"])}" title="{e(t)}">{off_label(c)}{sheet}</a>'
CURRENT = COURSES[0]

def coll_card(cid, compact=False):
    c = COLS[cid]; n = len(c['video_ids'])
    unit = 'video' if n==1 else 'videos'
    desc = f'<p class="small muted" style="margin:4px 0 0">{e(c["description"])}</p>' if c['description'] and not compact else ''
    return (f'<a class="pcard" href="{e(abs_url(c["url"]))}">{cover(c["cover"])}'
            f'<span class="pt">{e(c["title"])}</span><span class="small muted num">{n} {unit}</span>{desc}</a>')

def latest(n):
    vids = sorted(cat['videos'], key=lambda v: v.get('published_at',''), reverse=True)[:n]
    return [(v, COLS[v['collections'][0]]) for v in vids]

# ======================= Direction A =======================

def mini(u, img, t, m):
    return (f'<a class="mini" href="{u}"><span class="mthumb"><img src="{img}" alt="" loading="lazy">{PLAY}</span>'
            f'<span><b>{t}</b><small>{m}</small></span></a>')
V1 = ('<div class="convo-inline"><span class="label">In conversation</span><div class="minis">'
      + ''.join(mini(*c) for c in CONVOS) + '</div></div>')
V2 = ('<div class="convo-side"><span class="label">In conversation</span>'
      + ''.join(mini(*c) for c in CONVOS) + '</div>')
LINE_ICON = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1 11 6 2 11z"/></svg>'
V3 = ('<div class="convo-line"><span class="label" style="margin:0">In conversation</span>'
      + ''.join(f'<a href="{u}">{LINE_ICON}<span>{t}</span><small>{m}</small></a>' for u,_,t,m in CONVOS) + '</div>')
VCSS = """<style>
.mini { display:grid; grid-template-columns:132px minmax(0,1fr); gap:12px; align-items:center; color:var(--ink); min-width:0; }
.mini .mthumb { position:relative; display:block; aspect-ratio:16/9; overflow:hidden; background:var(--soft); }
.mini .mthumb img { width:100%; height:100%; object-fit:cover; }
.mini .play { width:28px; height:28px; } .mini .play svg { width:11px; height:11px; margin-left:2px; }
.mini b { display:block; font-weight:600; font-size:14px; line-height:1.3; }
.mini small { display:block; color:var(--muted); font-size:12.5px; line-height:1.35; margin-top:2px; }
.mini:hover b { color:var(--accent); }
.convo-inline { margin-top:22px; }
.minis { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
.convo-side { display:grid; gap:14px; margin-top:24px; padding-top:18px; border-top:1px solid var(--rule); }
.convo-side .label { margin:0; }
.convo-side .mini { grid-template-columns:1fr; gap:6px; }
.convo-line { display:flex; flex-wrap:wrap; align-items:baseline; gap:8px 34px; margin-top:34px; padding:16px 0; border-top:1px solid var(--rule); border-bottom:1px solid var(--rule); }
.convo-line a { display:inline-flex; align-items:baseline; gap:8px; color:var(--ink); }
.convo-line a svg { width:10px; height:10px; fill:var(--accent); flex:none; align-self:center; }
.convo-line a span { font-weight:600; font-size:14.5px; }
.convo-line a small { color:var(--muted); font-size:13px; }
.convo-line a:hover span { color:var(--accent); }
@media (max-width:700px) { .minis { grid-template-columns:1fr; } }
</style>"""

def a_home(variant=0):
    awards = ''.join(f'<tr><td class="num muted">{y}</td><td>{t}</td><td class="muted">{v}</td></tr>' for y,t,v in AWARDS)
    res = ''.join(f'<li><a href="{LAB}">{research(p)}<span><b>{t}</b><small>{s}</small></span></a></li>' for t,s,p in RESEARCH)
    teach = [('Courses', f'{len(COURSES)} offerings since 2018, with materials and recordings.', 'a-teaching.html#courses', cover(12)),
             ('Videos', f'{NVID} videos in {len(COLS)} playlists, from one-minute Shorts to full lectures.', 'a-teaching.html#videos', cover(0)),
             ('Cheatsheets', f'{NSHEET} two-page PDFs from five courses.', 'a-teaching.html#cheatsheets', cover(3))]
    tl = ''.join(f'<li><a href="{u}">{cv}<span><b>{t}</b><small>{s}</small></span></a></li>' for t,s,u,cv in teach)
    body = f'''
<style>
.a-top {{ display:grid; grid-template-columns:minmax(0,1fr) 260px; gap:28px 40px; }}
.a-top .bio p {{ max-width:62ch; font-size:17.5px; margin-bottom:14px; }}
.a-top .bio a {{ color:inherit; }}
.a-top .social {{ border-top:1px solid var(--rule); padding-top:16px; margin-top:20px; }}
.now {{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); border-top:2px solid var(--ink); border-bottom:1px solid var(--rule); margin-top:34px; }}
.now > div {{ padding:16px 18px 18px 0; min-width:0; }}
.now > div + div {{ border-left:1px solid var(--rule); padding-left:18px; }}
.now p {{ margin:0; font-size:15px; }}
.now .t {{ font:600 18px/1.3 var(--heading); display:block; margin-bottom:4px; color:var(--ink); }}
.now .links {{ display:flex; gap:12px; flex-wrap:wrap; font-size:13px; margin-top:8px; }}
.two {{ display:grid; grid-template-columns:1fr 1fr; gap:34px; }}
.two > section + section {{ border-left:1px solid var(--rule); padding-left:34px; }}
.rows {{ list-style:none; margin:0; padding:0; display:grid; gap:14px; }}
.rows a {{ display:grid; grid-template-columns:120px minmax(0,1fr); gap:14px; align-items:center; color:var(--ink); }}
.rows b {{ font:600 17px/1.3 var(--heading); display:block; }}
.rows small {{ color:var(--muted); font-size:13.5px; display:block; line-height:1.4; }}
.rows a:hover b {{ text-decoration:underline; text-decoration-color:var(--accent); }}
.minor {{ display:flex; gap:6px 18px; flex-wrap:wrap; font-size:13.5px; margin-top:14px; }}
.lower {{ display:grid; grid-template-columns:minmax(0,1.1fr) minmax(0,1fr); gap:34px; }}
table.aw {{ width:100%; border-collapse:collapse; font-size:14.5px; }}
.aw td {{ padding:7px 10px 7px 0; border-bottom:1px solid var(--rule); vertical-align:top; }}
.aw td:first-child {{ width:52px; }}
.convos {{ display:grid; grid-template-columns:1fr 1fr; gap:22px; max-width:760px; }}
@media (max-width: 1000px) {{ .two, .lower {{ grid-template-columns:1fr; }} .two > section + section {{ border-left:0; padding-left:0; border-top:1px solid var(--rule); padding-top:22px; }} }}
@media (max-width: 700px) {{ .a-top {{ grid-template-columns:1fr; }} .a-top figure {{ max-width:220px; order:-1; }} .now {{ grid-template-columns:1fr; }} .now > div + div {{ border-left:0; padding-left:0; border-top:1px solid var(--rule); }} .rows a {{ grid-template-columns:96px minmax(0,1fr); }} .convos {{ grid-template-columns:1fr; }} }}
</style>
<div class="a-top">
 <div class="bio"><h1 class="h1">Nipun Batra</h1><p class="role" style="margin-bottom:22px">Associate Professor at IIT Gandhinagar · Lead, Sustainability Lab</p>
 <p>{BIO1}</p><p>{BIO2}</p><p>{BIO3}</p>{social()}{V1 if variant==1 else ''}</div>
 <div class="side"><figure style="margin:0"><img src="img/nipun.jpg" alt="Portrait of Nipun Batra" width="516" height="480"></figure>{V2 if variant==2 else ''}</div>
</div>
<div class="two rule-top">
 <section><h2 class="h2">Research</h2><ul class="rows">{res}</ul>
  <div class="minor"><a href="https://sustainability-lab.github.io/papers/">Publications</a><a href="{LAB}">Sustainability Lab</a><a href="https://sustainability-lab.github.io/openings.html">Open positions</a></div></section>
 <section><h2 class="h2">Teaching</h2><ul class="rows">{tl}</ul>
  <div class="minor"><a href="a-teaching.html">All teaching</a><a href="https://www.youtube.com/@NipunBatra0">YouTube channel</a></div></section>
</div>
<div class="rule-top">
 <section><h2 class="h2">In conversation</h2><div class="convos">{''.join(convo(*c) for c in CONVOS)}</div></section>
</div>'''
    page('a','home','Nipun Batra · Mockup A', body)

def a_teaching():
    rows = []
    for name, code, f in LINEAGE:
        offs = offerings(f)
        chips = ' '.join(chip(c, c is CURRENT) for c in offs)
        span = f'{year_of(offs[0])}–{year_of(offs[-1])}' if len(offs)>1 else year_of(offs[0])
        rows.append(f'<tr><th scope="row"><a href="{e(offs[-1]["url"])}">{name}</a><span class="small muted">{code}</span></th>'
                    f'<td class="num muted small">{len(offs)}×</td><td class="num muted small">{span}</td><td><div class="chips">{chips}</div></td></tr>')
    sections = OrderedDict()
    for c in cat['collections']: sections.setdefault(c['section'], []).append(c['id'])
    vids = ''.join(f'<div class="vsec"><h3 class="h3">{e(s)} <span class="small muted num">{sum(len(COLS[i]["video_ids"]) for i in ids)}</span></h3>'
                   f'<div class="pgrid">{"".join(coll_card(i, True) for i in ids)}</div></div>' for s, ids in sections.items())
    sh = ''.join(f'<li><a href="{e(g["library_url"] if g.get("library_url") else g["course_url"])}"><b>{e(g["title"])}</b>'
                 f'<span class="small muted">{e(g["course_code"][:2]+" "+g["course_code"][2:])} · {e(g["semester"])}</span>'
                 f'<span class="small muted">{e(g["description"])}</span><span class="num small" style="color:var(--accent)">{len(g["sheets"])} PDFs</span></a></li>' for g in sheets['groups'])
    body = f'''
<style>
.thead {{ display:flex; flex-wrap:wrap; justify-content:space-between; gap:18px; align-items:end; border-bottom:2px solid var(--ink); padding-bottom:18px; }}
.search {{ display:flex; border-bottom:1px solid var(--ink); min-width:min(320px,100%); }}
.search input {{ flex:1; min-width:0; border:0; background:transparent; font:inherit; font-size:14px; padding:8px 0; color:var(--ink); }}
.search span {{ color:var(--accent); font-size:13px; align-self:center; }}
.jump {{ display:flex; flex-wrap:wrap; gap:6px 22px; font-size:13.5px; padding:12px 0; border-bottom:1px solid var(--rule); }}
.jump a {{ color:var(--ink); }}
.feature {{ display:grid; grid-template-columns:220px minmax(0,1fr); gap:22px; background:var(--soft); padding:20px; margin-top:26px; align-items:center; }}
.feature .acts {{ display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }}
.tablewrap {{ overflow-x:auto; }}
table.lin {{ width:100%; border-collapse:collapse; min-width:640px; }}
.lin th, .lin td {{ text-align:left; padding:12px 12px 12px 0; border-bottom:1px solid var(--rule); vertical-align:top; }}
.lin thead th {{ font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--muted); font-weight:600; border-bottom:1px solid var(--ink); }}
.lin tbody th {{ font-weight:500; width:34%; }}
.lin tbody th a {{ color:var(--ink); display:block; font:600 16px/1.3 var(--heading); }}
.chips {{ display:flex; flex-wrap:wrap; gap:6px; }}
.legend {{ display:flex; flex-wrap:wrap; gap:8px 18px; font-size:12.5px; color:var(--muted); margin-top:12px; align-items:center; }}
.vsec {{ margin-top:22px; }}
.pgrid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:18px; }}
.pcard {{ color:var(--ink); display:flex; flex-direction:column; gap:4px; min-width:0; }}
.pcard .pt {{ font-weight:600; font-size:14.5px; line-height:1.3; margin-top:6px; }}
.pcard:hover .pt {{ text-decoration:underline; text-decoration-color:var(--accent); }}
.sheets {{ list-style:none; padding:0; margin:0; display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:0 22px; }}
.sheets a {{ display:grid; gap:2px; padding:14px 0; border-top:1px solid var(--rule); color:var(--ink); }}
@media (max-width:700px) {{ .feature {{ grid-template-columns:1fr; }} }}
</style>
<div class="thead"><div><span class="label">IIT Gandhinagar</span><h1 class="h1" style="margin:0">Teaching</h1>
 <p class="muted" style="margin:6px 0 0">{len(COURSES)} course offerings, {NVID} videos and {NSHEET} cheatsheets since 2018.</p></div>
 <label class="search"><input id="q-a" placeholder="Search courses, videos and cheatsheets" aria-label="Search teaching"><span>Search</span></label></div>
<nav class="jump" aria-label="On this page"><a href="#now">This semester</a><a href="#courses">Courses</a><a href="#videos">Videos</a><a href="#cheatsheets">Cheatsheets</a><a href="{SITE}teaching-videos.html">All {NVID} videos</a></nav>
<section id="now" class="feature">{cover(1)}<div><span class="label">This semester · Aug 2026</span>
 <h2 class="h2" style="margin-bottom:4px">Deep Learning</h2><p class="muted" style="margin:0">ES 667. Losses, gradients, optimization, regularization and attention.</p>
 <div class="acts"><a class="btn solid" href="{CURRENT['url']}">Course site</a><a class="btn" href="{CURRENT['recording_url']}">Lecture recordings · 7</a><a class="btn" href="#cheatsheets">Cheatsheets · 12</a><a class="btn" href="{SITE}dl-in-3-minutes.html">DL in 3 minutes · 22</a></div></div></section>
<section id="courses" class="rule-top"><h2 class="h2">Courses</h2>
 <p class="muted small" style="max-width:62ch">One row per course. Each chip is one offering and links to that semester's site.</p>
 <div class="tablewrap"><table class="lin"><thead><tr><th>Course</th><th>Taught</th><th>Years</th><th>Offerings</th></tr></thead><tbody>{''.join(rows)}</tbody></table></div>
 <div class="legend"><span class="pill now">Aug 2026</span> current <span class="pill rec">Jan 2024</span> lectures recorded <span class="pill">Jan 2023</span> course site only <span>§ cheatsheets</span></div></section>
<section id="videos" class="rule-top"><h2 class="h2">Videos <span class="small muted num">{NVID} in {len(COLS)} playlists</span></h2>{vids}</section>
<section id="cheatsheets" class="rule-top"><h2 class="h2">Cheatsheets <span class="small muted num">{NSHEET} PDFs</span></h2><ul class="sheets">{sh}</ul></section>'''
    page('a','teaching','Teaching · Mockup A', body)

# ======================= Direction B =======================
HUBS = [
 ('ml','Machine learning','From decision trees to kernels, taught every year since 2019.', 0,
   [l for l in LINEAGE if l[0]=='Machine Learning'], ['seven-ideas-ml','ml-one-minute','ml-three-minutes','ml-2024','ml-2020'], ['ml-2025'], []),
 ('dl','Deep learning','Losses, gradients, optimization and attention, built from scratch.', 1,
   [l for l in LINEAGE if l[0]=='Deep Learning'], ['dl-2026','dl-three-minutes'], ['dl-2026'],
   [('How CLIP learns', SITE+'interactives/clip-loss/', 'Interactive'), ('LLM from scratch', SITE+'projects.html', 'Code'), ('Autograd playground', SITE+'projects.html','Code')]),
 ('pml','Probabilistic machine learning','Bayesian models, sampling, variational inference and uncertainty.', 11,
   [l for l in LINEAGE if l[0].startswith('Probabilistic')], ['pml-2023'], ['pml-2023'], []),
 ('prob','Probability and statistics','Distributions, expectation and data visualization with Python.', 3,
   [l for l in LINEAGE if l[1]=='ES 114'], ['probability-one-minute'], ['psdv-2025'], []),
 ('tools','Programming and software tools','Python, Git, APIs, experiments, deployment and AI agents.', 4,
   [l for l in LINEAGE if l[1] in ('ES 112','CS 203')], ['python-one-minute','tools-one-minute','cs203-2026','python-data-science','agentic-ai','websites'], ['stt-2026'],
   [('Docker ML demos', SITE+'projects.html','Code'), ('Hugging Face Spaces tutorial', SITE+'projects.html','Code')]),
 ('society','AI and society','Principles of AI, AI for social good, and science in everyday life.', 14,
   [l for l in LINEAGE if l[0] in ('Principles of AI','AI for Social Good')], ['aisg-2025','indian-scientists','how-things-work'], [], []),
 ('systems','Systems','Operating systems, graduate systems and ubiquitous computing.', 13,
   [l for l in LINEAGE if l[0] in ('Operating Systems','Graduate Systems','Ubiquitous Computing')], ['os-2018'], [], []),
]
used = set(i for h in HUBS for i in h[5]); assert used == set(COLS), set(COLS)-used

def b_home():
    aw = ', '.join(f'{t}, {v} {y}' for y,t,v in AWARDS[:4])
    starts = [
     ('Students at IIT Gandhinagar', [('Deep Learning · ES 667', CURRENT['url'], 'This semester'), ('Lecture recordings', CURRENT['recording_url'], '7 lectures so far'),
                                      ('Cheatsheets', 'b-teaching.html#dl', '86 two-page PDFs'), ('Past courses', 'b-teaching.html#archive', '25 offerings since 2018')]),
     ('Learning on your own', [('Seven ideas in machine learning', abs_url(COLS['seven-ideas-ml']['url']), '8 visual explanations'), ('Machine learning in 1 minute', abs_url(COLS['ml-one-minute']['url']), '91 Shorts'),
                               ('Teaching by subject', 'b-teaching.html', '7 subjects, 562 videos'), ('How CLIP learns', SITE+'interactives/clip-loss/', 'Interactive')]),
     ('Research and collaboration', [('Sustainability Lab', LAB, 'Group, people and projects'), ('Publications', 'https://sustainability-lab.github.io/papers/', 'Papers and venues'),
                                     ('Open positions', 'https://sustainability-lab.github.io/openings.html', 'PhD, MTech and interns'), ('Google Scholar', SOCIAL[1][1], 'Citations')]),
    ]
    cols = ''.join(f'<section class="door"><h2 class="h3">{t}</h2><ul>' + ''.join(f'<li><a href="{e(u)}"><b>{n}</b><span>{m}</span></a></li>' for n,u,m in items) + '</ul></section>' for t, items in starts)
    res = ''.join(f'<a class="rt" href="{LAB}">{research(p)}<b>{t}</b><span class="small muted">{s}</span></a>' for t,s,p in RESEARCH)
    body = f'''
<style>
.b-hero {{ display:grid; grid-template-columns:200px minmax(0,1fr); gap:30px; align-items:start; }}
.b-hero p.lead {{ font-size:19px; line-height:1.55; max-width:56ch; margin:14px 0 18px; }}
.b-hero p.lead a {{ color:inherit; text-decoration:underline; text-decoration-color:var(--rule); }}
.doors {{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:0; border-top:2px solid var(--ink); margin-top:34px; }}
.door {{ padding:18px 22px 6px 0; min-width:0; }}
.door + .door {{ border-left:1px solid var(--rule); padding-left:22px; }}
.door h2 {{ color:var(--accent); }}
.door ul {{ list-style:none; padding:0; margin:0; }}
.door li a {{ display:grid; padding:10px 0; border-top:1px solid var(--rule); color:var(--ink); }}
.door li b {{ font-weight:600; font-size:15px; }}
.door li span {{ font-size:13px; color:var(--muted); }}
.door li a:hover b {{ color:var(--accent); }}
.rgrid {{ display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:20px; }}
.rt {{ display:grid; gap:4px; color:var(--ink); }}
.rt b {{ font:600 17px/1.3 var(--heading); margin-top:6px; }}
.about {{ display:grid; grid-template-columns:minmax(0,1fr) 300px; gap:34px; }}
.about p {{ max-width:62ch; }}
.convos {{ display:grid; gap:16px; }}
@media (max-width:900px) {{ .doors {{ grid-template-columns:1fr; }} .door + .door {{ border-left:0; padding-left:0; }} .about {{ grid-template-columns:1fr; }} }}
@media (max-width:640px) {{ .b-hero {{ grid-template-columns:1fr; }} .b-hero img {{ max-width:180px; }} .rgrid {{ grid-template-columns:1fr; }} }}
</style>
<div class="b-hero"><img src="img/nipun.jpg" alt="Portrait of Nipun Batra" width="516" height="480">
 <div><h1 class="h1">Nipun Batra</h1><p class="role">Associate Professor at IIT Gandhinagar · Lead, Sustainability Lab</p>
 <p class="lead">I lead the <a href="{LAB}">Sustainability Lab</a>, building AI for smart buildings, air quality and wearable health, and I teach machine learning to students at IIT Gandhinagar and online.</p>{social()}</div></div>
<div class="doors" aria-label="Start here">{cols}</div>
<section class="rule-top"><h2 class="h2">Research</h2><div class="rgrid">{res}</div></section>
<section class="rule-top about"><div><h2 class="h2">About</h2><p>{BIO1}</p><p>{BIO2}</p>
 <p class="muted small">Recent recognition: {aw}. <a href="https://sustainability-lab.github.io/awards.html">All awards</a></p></div>
 <div><h2 class="h3">In conversation</h2><div class="convos">{''.join(convo(*c) for c in CONVOS)}</div></div></section>'''
    page('b','home','Nipun Batra · Mockup B', body)

def b_teaching():
    idx = ''.join(f'<li><a href="#{k}">{t}</a></li>' for k,t,*_ in HUBS)
    hubs = []
    for k, t, blurb, cov, lin, cids, sids, extra in HUBS:
        courses = ''.join(f'<li><b>{name}</b> <span class="muted small">{code}</span><div class="chips">{" ".join(chip(c, c is CURRENT) for c in offerings(f))}</div></li>' for name, code, f in lin)
        vids = ''.join(f'<li><a href="{e(abs_url(COLS[i]["url"]))}">{e(COLS[i]["title"])}</a><span class="num">{len(COLS[i]["video_ids"])}</span></li>' for i in cids)
        nv = sum(len(COLS[i]['video_ids']) for i in cids)
        read = ''.join(f'<li><a href="{e(SHEETS[s].get("library_url") or SHEETS[s]["course_url"])}">Cheatsheets · {e(SHEETS[s]["semester"])}</a><span class="num">{len(SHEETS[s]["sheets"])}</span></li>' for s in sids)
        read += ''.join(f'<li><a href="{e(u)}">{n}</a><span>{kind}</span></li>' for n,u,kind in extra)
        read_col = f'<div><h4>Read and explore</h4><ul class="kv">{read}</ul></div>' if read else '<div><h4>Read and explore</h4><p class="small muted">Materials are on each course site.</p></div>'
        hubs.append(f'''<section class="hub" id="{k}"><div class="hub-head">{cover(cov)}<div><h2 class="h2" style="margin-bottom:4px">{t}</h2><p class="muted" style="margin:0">{blurb}</p>
<p class="small num" style="margin:8px 0 0">{plural(sum(len(offerings(f)) for *_,f in lin), 'offering')} · {nv} videos{f" · {sum(len(SHEETS[s]['sheets']) for s in sids)} cheatsheets" if sids else ""}</p></div></div>
<div class="hub-cols"><div><h4>Courses</h4><ul class="courses">{courses}</ul></div><div><h4>Watch</h4><ul class="kv">{vids}</ul></div>{read_col}</div></section>''')
    # archive by year
    years = OrderedDict()
    for c in COURSES: years.setdefault(c['year'], []).append(c)
    arch = ''.join(f'<div><h4 class="num">{y}</h4><ul>' + ''.join(f'<li><a href="{e(c["url"])}">{e(c["title"])}</a> <span class="muted small">{c["semester"]}</span></li>' for c in cs) + '</ul></div>' for y,cs in years.items())
    body = f'''
<style>
.b-grid {{ display:grid; grid-template-columns:190px minmax(0,1fr); gap:36px; margin-top:26px; }}
.subj {{ position:sticky; top:16px; align-self:start; }}
.subj ul {{ list-style:none; padding:0; margin:0; border-top:1px solid var(--ink); }}
.subj li a {{ display:block; padding:8px 0; border-bottom:1px solid var(--rule); color:var(--ink); font-size:14px; }}
.subj li a:hover {{ color:var(--accent); }}
.hub {{ padding:26px 0 30px; border-top:2px solid var(--ink); scroll-margin-top:16px; }}
.hub:first-child {{ padding-top:0; border-top:0; }}
.hub-head {{ display:grid; grid-template-columns:200px minmax(0,1fr); gap:22px; align-items:center; margin-bottom:20px; }}
.hub-cols {{ display:grid; grid-template-columns:1.25fr 1fr 1fr; gap:26px; }}
.hub-cols > div {{ min-width:0; }}
.hub h4 {{ font:600 11px/1.3 var(--body); letter-spacing:.09em; text-transform:uppercase; color:var(--accent); margin:0 0 8px; }}
.hub ul {{ list-style:none; padding:0; margin:0; }}
.courses li {{ padding:8px 0; border-top:1px solid var(--rule); }}
.courses b {{ font-weight:600; font-size:14.5px; }}
.chips {{ display:flex; flex-wrap:wrap; gap:5px; margin-top:6px; }}
.kv li {{ display:flex; justify-content:space-between; gap:12px; padding:8px 0; border-top:1px solid var(--rule); font-size:14px; }}
.kv li span {{ color:var(--muted); font-size:12.5px; white-space:nowrap; font-variant-numeric:tabular-nums; }}
details.arch {{ border-top:2px solid var(--ink); padding-top:16px; }}
details.arch summary {{ cursor:pointer; font:700 22px/1.2 var(--heading); letter-spacing:-.03em; }}
.archgrid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:18px 26px; margin-top:16px; }}
.archgrid ul {{ list-style:none; padding:0; margin:0; font-size:14px; }}
.archgrid li {{ padding:4px 0; }}
.archgrid h4 {{ margin:0 0 4px; font:600 13px/1.3 var(--body); border-bottom:1px solid var(--rule); padding-bottom:4px; }}
@media (max-width:1050px) {{ .hub-cols {{ grid-template-columns:1fr 1fr; }} .hub-cols > div:first-child {{ grid-column:1/-1; }} }}
@media (max-width:860px) {{ .b-grid {{ grid-template-columns:1fr; }} .subj {{ position:static; }} .subj ul {{ display:flex; flex-wrap:wrap; gap:0 16px; border:0; }} .subj li a {{ border:0; padding:4px 0; }} }}
@media (max-width:600px) {{ .hub-head, .hub-cols {{ grid-template-columns:1fr; }} .hub-head .cover {{ max-width:240px; }} }}
</style>
<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:16px;align-items:end;border-bottom:2px solid var(--ink);padding-bottom:18px">
 <div><span class="label">IIT Gandhinagar</span><h1 class="h1" style="margin:0">Teaching</h1><p class="muted" style="margin:6px 0 0;max-width:60ch">Everything for one subject in one place: the courses, the lecture recordings, the short videos and the cheatsheets.</p></div>
 <a class="btn solid" href="{CURRENT['url']}">This semester: Deep Learning, ES 667</a></div>
<div class="b-grid"><aside class="subj"><span class="label">Subjects</span><ul>{idx}<li><a href="#archive">All courses by year</a></li></ul></aside>
<div>{''.join(hubs)}
<details class="arch" id="archive"><summary>All courses by year <span class="small muted num">{len(COURSES)} offerings</span></summary><div class="archgrid">{arch}</div></details></div></div>'''
    page('b','teaching','Teaching · Mockup B', body)

# ======================= Direction C =======================
def c_home():
    ups = ''.join(f'<li><span class="num muted small">{d}</span><span class="kind">{k}</span><a href="{e(u)}">{t}</a></li>' for d,k,t,u in UPDATES)
    tiles = [('Research', 'Smart buildings, air quality and wearable health.', LAB, research(1), [('Publications','https://sustainability-lab.github.io/papers/'),('Open positions','https://sustainability-lab.github.io/openings.html')]),
             ('Teaching', f'{len(COURSES)} course offerings, {NVID} videos, {NSHEET} cheatsheets.', 'c-teaching.html', cover(0), [('Watch','c-teaching.html#watch'),('Courses','c-teaching.html#courses')]),
             ('Open source', 'Tools, apps and teaching code: Scancat, Pulp, Autograd playground.', SITE+'projects.html', cover(16), [('All projects', SITE+'projects.html')]),
             ('Writing', 'Blog posts and notes on ML, tools and teaching.', SITE+'blog/', cover(17), [('Blog', SITE+'blog/'),('CV', SITE+'cv/cv.pdf')])]
    tl = ''.join(f'<article class="tile"><a href="{e(u)}">{cv}</a><div><h2 class="h3"><a href="{e(u)}">{t}</a></h2><p class="small muted">{s}</p><p class="small tl">{" ".join(A(lu,ln) for ln,lu in links)}</p></div></article>' for t,s,u,cv,links in tiles)
    aw = ''.join(f'<li><span class="num muted">{y}</span> {t}, {v}</li>' for y,t,v in AWARDS)
    body = f'''
<style>
.c-head {{ display:grid; grid-template-columns:150px minmax(0,1fr); gap:26px; align-items:center; padding-bottom:22px; border-bottom:2px solid var(--ink); }}
.c-head p {{ margin:0; }}
details.full {{ margin-top:12px; font-size:15px; }}
details.full summary {{ cursor:pointer; color:var(--accent); font-size:13.5px; }}
details.full p {{ max-width:64ch; margin:10px 0 0; }}
.c-body {{ display:grid; grid-template-columns:minmax(0,1.6fr) minmax(0,1fr); gap:38px; margin-top:28px; }}
.tiles {{ display:grid; grid-template-columns:1fr 1fr; gap:26px 24px; }}
.tile {{ display:grid; gap:10px; min-width:0; align-content:start; }}
.tile > a {{ display:block; }}
.tile h2 a {{ color:var(--ink); }}
.tile p {{ margin:0; }}
.tile .tl {{ display:flex; gap:14px; margin-top:6px; }}
.feed {{ list-style:none; padding:0; margin:0; border-top:1px solid var(--ink); }}
.feed li {{ display:grid; grid-template-columns:70px minmax(0,1fr); gap:2px 10px; padding:11px 0; border-bottom:1px solid var(--rule); font-size:14.5px; }}
.feed .kind {{ font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--accent); grid-column:2; }}
.feed a {{ grid-column:2; color:var(--ink); }}
.feed a:hover {{ color:var(--accent); }}
.feed .num {{ grid-row:1/3; padding-top:1px; }}
.aw {{ list-style:none; padding:0; margin:0; font-size:13.5px; }}
.aw li {{ padding:5px 0; border-bottom:1px solid var(--rule); }}
.convos {{ display:grid; grid-template-columns:1fr 1fr; gap:18px; }}
@media (max-width:980px) {{ .c-body {{ grid-template-columns:1fr; }} }}
@media (max-width:600px) {{ .c-head {{ grid-template-columns:96px minmax(0,1fr); gap:16px; }} .tiles, .convos {{ grid-template-columns:1fr; }} }}
</style>
<header class="c-head"><img src="img/nipun.jpg" alt="Portrait of Nipun Batra" width="516" height="480">
 <div><h1 class="h1" style="margin-bottom:6px">Nipun Batra</h1><p class="role">Associate Professor of Computer Science, IIT Gandhinagar. I lead the Sustainability Lab and teach machine learning.</p>
 <details class="full"><summary>Full biography</summary><p>{BIO1}</p><p>{BIO2}</p></details></div></header>
<div style="padding:14px 0;border-bottom:1px solid var(--rule)">{social()}</div>
<div class="c-body"><div class="tiles">{tl}</div>
 <aside><span class="label">Recent</span><ul class="feed">{ups}</ul>
  <span class="label" style="margin-top:26px">Awards</span><ul class="aw">{aw}</ul></aside></div>
<section class="rule-top"><h2 class="h2">In conversation</h2><div class="convos" style="max-width:720px">{''.join(convo(*c) for c in CONVOS)}</div></section>'''
    page('c','home','Nipun Batra · Mockup C', body)

def c_teaching():
    shelves = [
     ('One minute', 'A single question answered in under a minute.', ['ml-one-minute','probability-one-minute','python-one-minute','tools-one-minute']),
     ('Three minutes', 'One idea, explained with a worked figure.', ['dl-three-minutes','ml-three-minutes','seven-ideas-ml']),
     ('Full lectures', 'Complete classroom recordings from IIT Gandhinagar.', ['dl-2026','cs203-2026','ml-2024','pml-2023','ml-2020','os-2018','aisg-2025']),
     ('Tutorials and explainers', 'Hands-on walkthroughs and science stories.', ['agentic-ai','python-data-science','websites','indian-scientists','how-things-work']),
    ]
    sh = ''.join(f'<div class="shelf"><div class="shelf-h"><h3 class="h3">{t} <span class="small muted num">{sum(len(COLS[i]["video_ids"]) for i in ids)} videos</span></h3><p class="small muted">{d}</p></div>'
                 f'<div class="row">{"".join(coll_card(i, True) for i in ids)}</div></div>' for t,d,ids in shelves)
    lat = ''.join(f'<li><a href="{e(v["url"])}">{e(v["title"])}</a><span class="num small muted">{dur(v["duration"])} · {e(c["title"])}</span></li>' for v,c in latest(6))
    path = [('Seven Ideas in Machine Learning','Start with the big picture: eight visual explanations.', abs_url(COLS['seven-ideas-ml']['url']), '8 videos'),
            ('Machine learning in 1 minute','Test your intuition, one question at a time.', abs_url(COLS['ml-one-minute']['url']), '91 Shorts'),
            ('Machine learning in 3 minutes','Each method with a worked figure.', COLS['ml-three-minutes']['url'], '87 videos'),
            ('Machine Learning, ES 335 lectures','The full course as taught at IIT Gandhinagar.', COLS['ml-2024']['url'], '33 lectures'),
            ('Machine learning cheatsheets','Two-page summaries to revise from.', SHEETS['ml-2025']['library_url'] if SHEETS['ml-2025'].get('library_url') else SHEETS['ml-2025']['course_url'], '28 PDFs')]
    pl = ''.join(f'<li><span class="step num">{i}</span><div><a href="{e(u)}"><b>{t}</b></a><span class="small muted">{d}</span></div><span class="small muted num">{n}</span></li>' for i,(t,d,u,n) in enumerate(path,1))
    years = OrderedDict()
    for c in COURSES: years.setdefault(c['year'], []).append(c)
    cy = ''.join(f'<div class="yr"><h4 class="num">{y}</h4>' + ''.join(
        f'<a href="{e(c["url"])}"><span class="small muted">{c["semester"].split()[0]} · {c["code"][:2]} {c["code"][2:]}</span><b>{e(c["title"])}</b>'
        f'<span class="flags">{LEC if c.get("recordings") else ""}{CHS if c.get("cheatsheets_url") else ""}</span></a>' for c in cs) + '</div>' for y,cs in years.items())
    sg = ''.join(f'<details class="sg"{" open" if i==0 else ""}><summary><b>{e(g["title"])}</b><span class="small muted">{g["course_code"][:2]} {g["course_code"][2:]} · {g["semester"]} · {len(g["sheets"])} PDFs</span></summary><ol>'
                 + ''.join(f'<li><a href="{e(s["url"])}">{e(s["title"])}</a></li>' for s in g['sheets']) + '</ol></details>' for i,g in enumerate(sheets['groups']))
    bl = [('How CLIP learns', 'The contrastive loss, with a live figure you can adjust.', SITE+'interactives/clip-loss/', 'Interactive')] + [(n, d, SITE+'projects.html', 'Code') for n,d in LEARN_PROJECTS]
    build = ''.join(f'<li><a href="{e(u)}"><span class="label" style="margin:0">{k}</span><b>{n}</b><span class="small muted">{d}</span></a></li>' for n,d,u,k in bl)
    tabs = [('start','Start here'),('watch',f'Watch'),('courses','Courses'),('cheatsheets','Cheatsheets'),('build','Interactives and code')]
    tabbar = ''.join(f'<a href="#{k}" role="tab" data-tab="{k}" aria-selected="{"true" if k=="start" else "false"}">{t}</a>' for k,t in tabs)
    body = f'''
<style>
.c-th {{ display:flex; flex-wrap:wrap; gap:14px 30px; align-items:end; justify-content:space-between; }}
.stats {{ display:flex; gap:26px; flex-wrap:wrap; }}
.stats div {{ display:grid; }}
.stats b {{ font:700 26px/1 var(--heading); letter-spacing:-.03em; font-variant-numeric:tabular-nums; }}
.stats span {{ font-size:12px; color:var(--muted); }}
.tabs {{ display:flex; flex-wrap:wrap; gap:0 2px; border-bottom:2px solid var(--ink); margin-top:24px; }}
.tabs a {{ padding:10px 14px; color:var(--ink); font-size:14.5px; border:1px solid transparent; border-bottom:0; margin-bottom:-2px; }}
.tabs a[aria-selected="true"] {{ background:var(--ink); color:var(--paper); }}
.tabs a:hover {{ text-decoration:none; color:var(--accent); }}
.tabs a[aria-selected="true"]:hover {{ color:var(--paper); }}
.panel {{ padding-top:26px; }}
.starts {{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.2fr); gap:34px; }}
.nowbox {{ background:var(--soft); padding:20px; display:grid; gap:12px; align-content:start; }}
.nowbox .acts {{ display:flex; flex-wrap:wrap; gap:8px; }}
ol.path {{ list-style:none; padding:0; margin:0; }}
.path li {{ display:grid; grid-template-columns:34px minmax(0,1fr) auto; gap:12px; padding:11px 0; border-top:1px solid var(--rule); align-items:baseline; }}
.path .step {{ font:700 20px/1 var(--heading); color:var(--accent); }}
.path b {{ display:block; color:var(--ink); font-weight:600; }}
.path a:hover b {{ color:var(--accent); }}
.latest {{ list-style:none; padding:0; margin:0; }}
.latest li {{ display:grid; padding:8px 0; border-top:1px solid var(--rule); font-size:14.5px; }}
.shelf {{ display:grid; grid-template-columns:200px minmax(0,1fr); gap:24px; padding:18px 0 22px; border-top:1px solid var(--rule); }}
.shelf:first-child {{ border-top:0; padding-top:0; }}
.row {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:16px; }}
.pcard {{ color:var(--ink); display:flex; flex-direction:column; gap:3px; min-width:0; }}
.pcard .pt {{ font-weight:600; font-size:14px; line-height:1.3; margin-top:6px; }}
.pcard:hover .pt {{ color:var(--accent); }}
.years {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:22px 24px; }}
.yr h4 {{ margin:0 0 4px; font:700 16px/1.2 var(--heading); border-bottom:2px solid var(--ink); padding-bottom:6px; }}
.yr a {{ display:grid; gap:2px; padding:9px 0; border-bottom:1px solid var(--rule); color:var(--ink); }}
.yr a b {{ font-weight:600; font-size:14.5px; line-height:1.3; }}
.yr a:hover b {{ color:var(--accent); }}
.flags {{ display:flex; gap:5px; flex-wrap:wrap; }}
.flags:empty {{ display:none; }}
.sg {{ border-top:1px solid var(--rule); padding:12px 0; }}
.sg summary {{ cursor:pointer; display:flex; flex-wrap:wrap; gap:4px 14px; align-items:baseline; }}
.sg ol {{ columns:2 260px; font-size:14px; margin:12px 0 0; padding-left:22px; }}
.sg li {{ padding:2px 0; break-inside:avoid; }}
.blist {{ list-style:none; padding:0; margin:0; display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:0 24px; }}
.blist a {{ display:grid; gap:3px; padding:14px 0; border-top:1px solid var(--rule); color:var(--ink); }}
.blist b {{ font-weight:600; }}
@media (max-width:900px) {{ .starts {{ grid-template-columns:1fr; }} .shelf {{ grid-template-columns:1fr; gap:10px; }} }}
</style>
<div class="c-th"><div><span class="label">IIT Gandhinagar</span><h1 class="h1" style="margin:0">Teaching</h1></div>
 <div class="stats" aria-label="At a glance"><div><b>{len(COURSES)}</b><span>course offerings</span></div><div><b>{NVID}</b><span>videos</span></div><div><b>{NSHEET}</b><span>cheatsheets</span></div><div><b>2018</b><span>teaching since</span></div></div></div>
<nav class="tabs" role="tablist" aria-label="Teaching sections">{tabbar}</nav>
<section class="panel" id="p-start" data-panel="start">
 <div class="starts"><div class="nowbox">{cover(1)}<span class="label" style="margin:0">Taking the course this semester</span>
  <h2 class="h2" style="margin:0">Deep Learning · ES 667</h2><p class="small muted" style="margin:0">Aug 2026. Losses, gradients, optimization, regularization and attention.</p>
  <div class="acts"><a class="btn solid" href="{CURRENT['url']}">Course site</a><a class="btn" href="{CURRENT['recording_url']}">Lectures</a><a class="btn" href="#cheatsheets" data-go="cheatsheets">Cheatsheets</a></div></div>
  <div><span class="label">Learning machine learning on your own</span><h2 class="h3">A suggested path through the videos</h2><ol class="path">{pl}</ol>
   <span class="label" style="margin-top:26px">Newest videos</span><ul class="latest">{lat}</ul></div></div></section>
<section class="panel" id="p-watch" data-panel="watch" hidden>{sh}<p class="small"><a href="{SITE}teaching-videos.html">Search all {NVID} videos</a></p></section>
<section class="panel" id="p-courses" data-panel="courses" hidden><div class="years">{cy}</div></section>
<section class="panel" id="p-cheatsheets" data-panel="cheatsheets" hidden>{sg}</section>
<section class="panel" id="p-build" data-panel="build" hidden><p class="muted" style="max-width:62ch">Interactive figures and code you can run, drawn from the Open source page.</p><ul class="blist">{build}</ul></section>
<script>
(function(){{
  var tabs=[].slice.call(document.querySelectorAll('[data-tab]')), panels=[].slice.call(document.querySelectorAll('[data-panel]'));
  function show(k){{ if(!panels.some(function(p){{return p.dataset.panel===k}})) k='start';
    tabs.forEach(function(t){{t.setAttribute('aria-selected', String(t.dataset.tab===k))}});
    panels.forEach(function(p){{p.hidden = p.dataset.panel!==k}}); }}
  tabs.forEach(function(t){{t.addEventListener('click',function(ev){{ev.preventDefault(); show(t.dataset.tab); try{{history.replaceState(null,'','#'+t.dataset.tab)}}catch(e){{}} }})}});
  document.querySelectorAll('[data-go]').forEach(function(a){{a.addEventListener('click',function(ev){{ev.preventDefault(); show(a.dataset.go)}})}});
  show((location.hash||'').slice(1));
}})();
</script>'''
    page('c','teaching','Teaching · Mockup C', body)

def a_projects():
    src = open(f'{REPO}/projects.html').read()
    secs = []
    for m in re.finditer(r'<section class="project-section" id="(\w+)".*?<h2[^>]*>(.*?)</h2>\s*<p>(.*?)</p>(.*?)</section>', src, re.S):
        sid, title, blurb, inner = m.groups()
        items = re.findall(r'<a class="project-item" href="([^"]+)">\s*<div class="project-copy"><h3>(.*?)</h3><p>(.*?)</p></div><span class="project-tags">(.*?)</span>', inner, re.S)
        secs.append((sid, title, blurb, items))
    total = sum(len(i) for *_, i in secs)
    jump = ''.join(f'<a href="#{sid}">{t} <span class="num muted">{len(i)}</span></a>' for sid,t,_,i in secs)
    def item(u, n, d, tags):
        tg = ''.join(f'<span class="tag">{e(t.strip())}</span>' for t in html.unescape(tags).split('·') if t.strip())
        return f'<a class="proj" href="{e(u)}"><b>{n}</b><span class="d">{d}</span><span class="tags">{tg}</span></a>'
    body_secs = ''.join(
        f'<section id="{sid}" class="rule-top psec"><div class="psec-h"><h2 class="h2" style="margin:0">{t} <span class="small muted num">{len(i)}</span></h2><p class="muted small" style="margin:0;max-width:52ch">{b}</p>'
        + (f'<a class="small" href="a-teaching.html">Courses, videos and cheatsheets are on Teaching</a>' if sid=='learning' else '')
        + f'</div><div class="pgrid2">{"".join(item(*x) for x in i)}</div></section>' for sid,t,b,i in secs)
    body = f"""
<style>
.thead {{ display:flex; flex-wrap:wrap; justify-content:space-between; gap:18px; align-items:end; border-bottom:2px solid var(--ink); padding-bottom:18px; }}
.search {{ display:flex; gap:10px; border-bottom:1px solid var(--ink); min-width:min(320px,100%); }}
.search input {{ flex:1; min-width:0; border:0; background:transparent; font:inherit; font-size:14px; padding:8px 0; color:var(--ink); }}
.search input:focus {{ outline:none; }}
.search span {{ color:var(--muted); font-size:12.5px; align-self:center; white-space:nowrap; }}
.jump {{ display:flex; flex-wrap:wrap; gap:6px 22px; font-size:13.5px; padding:12px 0; border-bottom:1px solid var(--rule); }}
.jump a {{ color:var(--ink); }}
.psec-h {{ display:grid; gap:6px; margin-bottom:16px; }}
.pgrid2 {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:0 26px; }}
.proj {{ display:grid; gap:4px; align-content:start; padding:14px 0 16px; border-top:1px solid var(--rule); color:var(--ink); min-width:0; }}
.proj b {{ font:600 16.5px/1.3 var(--heading); letter-spacing:-.01em; }}
.proj .d {{ font-size:14px; color:var(--muted); line-height:1.5; }}
.proj .tags {{ display:flex; flex-wrap:wrap; gap:5px; margin-top:6px; }}
.proj .tag {{ font-size:11px; line-height:1; padding:4px 6px; border:1px solid var(--rule); color:var(--muted); }}
.proj:hover {{ text-decoration:none; }}
.proj:hover b {{ color:var(--accent); }}
.archive {{ display:flex; flex-wrap:wrap; gap:12px 24px; justify-content:space-between; align-items:center; margin-top:34px; padding:18px 0; border-top:2px solid var(--ink); }}
.archive p {{ margin:0; }}
.empty {{ padding:18px 0; color:var(--muted); }}
</style>
<div class="thead"><div><span class="label">Tools · teaching · experiments</span><h1 class="h1" style="margin:0">Open source</h1>
 <p class="muted" style="margin:6px 0 0;max-width:62ch">{total} tools, teaching resources and experiments I build and maintain. A curated index; every repository is on GitHub.</p></div>
 <label class="search"><input id="q-p" type="search" placeholder="Search by name, description or tag" aria-label="Search open source"><span id="q-n">{total} entries</span></label></div>
<nav class="jump" aria-label="On this page">{jump}<a href="https://github.com/nipunbatra?tab=repositories">All repositories on GitHub</a></nav>
<p class="empty" id="q-empty" hidden>No matches. Try a broader term such as privacy, teaching, video or agents.</p>
{body_secs}
<div class="archive"><p><b>The complete archive is on GitHub.</b> <span class="muted">Course editions, one-off experiments and work in progress.</span></p><a class="btn solid" href="https://github.com/nipunbatra?tab=repositories">View all repositories</a></div>
<script>
(function(){{
  var q=document.getElementById('q-p'), n=document.getElementById('q-n'), empty=document.getElementById('q-empty');
  q.addEventListener('input', function(){{
    var terms=q.value.toLowerCase().split(/\\s+/).filter(Boolean), total=0;
    document.querySelectorAll('.psec').forEach(function(sec){{
      var c=0; sec.querySelectorAll('.proj').forEach(function(p){{ var t=p.textContent.toLowerCase(); var ok=terms.every(function(x){{return t.indexOf(x)>=0}}); p.hidden=!ok; if(ok)c++; }});
      sec.hidden=c===0; total+=c; }});
    n.textContent=total+(total===1?' entry':' entries'); empty.hidden=total!==0;
  }});
}})();
</script>"""
    page('a','projects','Open source · Mockup A', body)

for f in (a_home, a_teaching, b_home, b_teaching, c_home, c_teaching): f()
a_projects()
print('built')
