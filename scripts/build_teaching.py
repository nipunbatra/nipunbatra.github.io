"""Build the static teaching pages from curated, public teaching metadata."""
from pathlib import Path
from collections import OrderedDict
from html import escape as e
import json
import re
from site_layout import render_page

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT/'data/teaching/catalog.json').read_text())
SHEETS = json.loads((ROOT/'data/teaching/cheatsheets.json').read_text())['groups']
COLLECTIONS = {c['id']: c for c in DATA['collections']}
VIDEOS = {v['id']: v for v in DATA['videos']}

def duration(value):
    match = re.fullmatch(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?',value)
    h,m,s = [int(x or 0) for x in match.groups()]
    return f'{h}:{m:02d}:{s:02d}' if h else f'{m}:{s:02d}'

def duration_seconds(value):
    match = re.fullmatch(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?',value)
    h,m,s = [int(x or 0) for x in match.groups()]
    return h*3600+m*60+s

def link(url, label, cls='', attrs=''):
    return f'<a href="{e(url,quote=True)}" class="{cls}" {attrs}>{label}</a>'

def course_table():
    groups=OrderedDict()
    for course in DATA['courses']: groups.setdefault(course['year'],[]).append(course)
    rows=''
    for year,courses in groups.items():
        rows+=f'<tbody data-year-group><tr class="year-row"><th colspan="3" scope="rowgroup">{year}</th></tr>'
        for c in courses:
            haystack=e(' '.join(c[k] for k in ['code','title','semester','year']),quote=True)
            record=link(c['recording_url'],'Available','recording-link',f'aria-label="Recordings for {e(c["code"]+" "+c["semester"],quote=True)}"') if c['recordings'] else '<span class="unlinked">Not linked</span>'
            if c['recordings'] and c['recording_destination']=='course page': record+='<small>On course page</small>'
            current='<small class="current-course">Teaching now</small>' if c==DATA['courses'][0] else ''
            sheets=link(c['cheatsheets_url'],'Cheatsheets','course-sheets') if c.get('cheatsheets_url') else ''
            rows+=f'<tr data-course data-search="{haystack}" data-recorded="{str(c["recordings"]).lower()}"><td class="term">{c["semester"]}</td><td class="course-name"><span class="course-code">{c["code"]}</span>{link(c["url"],e(c["title"]))}{current}{sheets}</td><td class="recording"><span class="mobile-label">Recordings</span>{record}</td></tr>'
        rows+='</tbody>'
    return '<table class="course-table"><caption class="sr-only">IIT Gandhinagar courses by semester with recording availability.</caption><thead><tr><th scope="col">Semester</th><th scope="col">Course & materials</th><th scope="col">Recordings</th></tr></thead>'+rows+'</table>'

def collection_row(c):
    count=len(c['video_ids']); meta=f'{count} video'+('s' if count != 1 else '') if count else 'No public videos'
    if c['section'] == 'Visual explanations':
        lengths=sorted([VIDEOS[v]['duration'] for v in c['video_ids']],key=duration_seconds)
        meta+=' · '+duration(lengths[0])
        if len(lengths)>1: meta+='–'+duration(lengths[-1])+' each'
    if c.get('playlist_id'):
        youtube='https://www.youtube.com/playlist?list='+c['playlist_id']
        if c['url'] != youtube: meta+=' · '+link(youtube,'YouTube')
    cover=f'<span class="collection-cover cover-{c["cover"]}" role="img" aria-label="Illustration for {e(c["title"],quote=True)}"></span>'
    description=f'<p class="collection-description">{e(c["description"])}</p>' if c['description'] else ''
    cover_link=link(c['url'],cover,'cover-link','aria-label="'+e(c['title'],quote=True)+'"')
    return f'<article class="collection" data-collection-id="{c["id"]}">{cover_link}<div><h4>{link(c["url"],e(c["title"]))}</h4><p class="collection-meta">{meta}</p>{description}</div></article>'

def sidebar():
    groups=OrderedDict()
    for c in DATA['collections']:
        if c['cover'] is not None: groups.setdefault(c['section'],[]).append(c)
    count=sum(bool(c.get('playlist_id')) for c in DATA['collections'])
    heading=f'<header class="sidebar-heading"><h2>Playlists & series</h2><span>{count} playlists</span></header>'
    return '<aside class="teaching-sidebar" id="series" aria-label="Teaching video collections">'+heading+''.join(f'<section class="collection-group"><h3>{e(name)}</h3>'+''.join(collection_row(c) for c in group)+'</section>' for name,group in groups.items())+link('teaching-videos.html','Browse all teaching videos','all-videos-link')+'</aside>'

def sheet_shortcuts():
    links=''.join(link('#sheets-'+g['id'],e(g['short_title'])+f'<span>{len(g["sheets"])} sheets</span>','course-sheets') for g in SHEETS)
    return '<nav class="sheet-shortcuts" aria-label="Cheatsheets by course"><span class="shortcut-label">Cheatsheets <br>by course</span>'+links+'</nav>'

def cheatsheets():
    groups=''
    for g in SHEETS:
        items=''.join(f'<li>{link(s["url"],e(s["title"]))}<span>PDF · {s["pages"]} pages</span></li>' for s in g['sheets'])
        groups+=f'<details class="sheet-group" id="sheets-{g["id"]}"><summary><span>{e(g["title"])}<small>{e(g["course_code"])} · {e(g["semester"])}</small></span><span>{len(g["sheets"])} PDFs</span></summary><div class="sheet-content"><p class="sheet-course">{link(g["course_url"],"Course page")} · {link(g["library_url"],"Lecture library")}</p><p class="sheet-description">{e(g["description"])}</p><ul class="sheet-list">{items}</ul></div></details>'
    count=sum(len(g['sheets']) for g in SHEETS)
    return f'<section class="teaching-cheatsheets" id="cheatsheets" aria-labelledby="cheatsheets-heading"><header class="course-heading"><h2 id="cheatsheets-heading">Cheatsheets</h2><span>{count} sheets · PDF</span></header><p class="section-note">Two-page references from my courses. Choose a course to see its sheets, or search for a topic above.</p>{groups}</section>'

def search_ui():
    return '''<form class="library-search" action="teaching-videos.html" method="get" role="search"><label for="library-query">Search courses, videos and cheatsheets</label><div><input id="library-query" name="q" type="search" placeholder="Try Bayes, Python, or a course code"><button type="submit">Search</button></div></form>'''

def search_results():
    filters=''.join(f'<button type="button" data-result-type="{kind}" aria-pressed="{str(kind=="all").lower()}">{label}<span data-type-count></span></button>' for kind,label in [('all','All'),('Course','Courses'),('Collection','Collections'),('Video','Videos'),('Cheatsheet','Cheatsheets')])
    return '''<section class="search-results" data-search-panel hidden aria-labelledby="search-heading"><div class="results-heading"><h2 id="search-heading">Search results</h2><button type="button" data-close-search>Close results</button></div>'''+f'<div class="result-types" role="group" aria-label="Filter search results by resource type">{filters}</div>'+'''<p data-result-count role="status" aria-live="polite"></p><div class="search-result-list" data-results></div><button class="load-more" type="button" data-more-results hidden>Show more results</button></section>'''

def video_row(v):
    names=' · '.join(COLLECTIONS[c]['title'] for c in v['collections'])
    return f'<article class="video-entry" data-video data-groups="{e(" ".join(v["collections"]),quote=True)}"><h3>{link(v["url"],e(v["title"]))}</h3><p>{duration(v["duration"])} · {e(names)}</p></article>'

def page(body,title,description,filename):
    index=[]
    for c in DATA['courses']: index.append({'kind':'Course','title':c['title'],'url':c['url'],'meta':c['code']+' · '+c['semester'],'terms':c['year']})
    for c in DATA['collections']: index.append({'kind':'Collection','title':c['title'],'url':c['url'],'meta':str(len(c['video_ids']))+' videos','terms':c['section']+' '+c['description']})
    for g in SHEETS:
        for s in g['sheets']: index.append({'kind':'Cheatsheet','title':s['title'],'url':s['url'],'meta':f'PDF · {s["pages"]} pages · {g["course_code"]} · {g["semester"]}','terms':'cheatsheet cheat sheet '+g['title']})
    for v in DATA['videos']: index.append({'kind':'Video','title':v['title'],'url':v['url'],'meta':duration(v['duration'])+' · '+' · '.join(COLLECTIONS[c]['title'] for c in v['collections']),'groups':v['collections']})
    index_json=json.dumps(index,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    schema={'@context':'https://schema.org','@type':'CollectionPage','name':title,'url':'https://nipunbatra.github.io/'+filename,'description':description,'author':{'@type':'Person','name':'Nipun Batra'}}
    return render_page(
        f'<main class="teaching-page" id="main">{body}</main>',
        title=title+' - Nipun Batra', description=description, filename=filename,
        body_class='resource-page teaching-body', active='teaching.html',
        styles=('common.css', 'teaching.css'), scripts=('teaching.js',),
        extra_head='<script type="application/ld+json">'+json.dumps(schema)+'</script>',
        after_main='<script id="teaching-search-data" type="application/json">'+index_json+'</script>',
    )


main='''<header class="teaching-intro"><div><p class="teaching-eyebrow">IIT Gandhinagar</p><h1>Teaching</h1><p>My courses, videos and cheatsheets.</p></div>'''+search_ui()+'''</header><nav class="section-jumps" aria-label="Teaching sections"><a href="#courses">Courses</a><a href="#series">Video collections</a><a href="#cheatsheets">Cheatsheets</a><a href="teaching-videos.html">All teaching videos</a></nav>'''+sheet_shortcuts()+search_results()+'''<div class="teaching-columns"><div class="teaching-left"><section class="teaching-courses" id="courses"><header class="course-heading"><h2>Courses at IIT Gandhinagar</h2><span>2018–2026</span></header><p class="section-note">Each semester links to its course page and materials.</p><div class="course-filters"><label>Find a course<input data-course-query type="search" placeholder="Course, code or year"></label><label class="recorded-filter"><input data-recordings type="checkbox"> With recordings</label><button type="button" data-clear-course>Clear</button></div><p class="course-count" data-course-count role="status" aria-live="polite">25 course offerings</p>'''+course_table()+'''<p class="course-empty" data-course-empty hidden>No courses match. Try another word or clear the filters.</p><p class="recording-note">“Not linked” means a recording link hasn’t been added here.</p></section>'''+cheatsheets()+'''</div>'''+sidebar()+'''</div>'''
(ROOT/'teaching.html').write_text(page(main,'Teaching','Courses at IIT Gandhinagar by semester, cheatsheets, lecture recordings, and visual lessons on machine learning, mathematics, Python and software tools.','teaching.html'))
options=''.join(f'<option value="{c["id"]}">{e(c["title"])}</option>' for c in DATA['collections'])
library='''<header class="teaching-intro"><div><p class="teaching-eyebrow"><a href="teaching.html">Teaching</a></p><h1>Teaching videos</h1><p>Search by topic, or choose a collection.</p></div>'''+search_ui()+'''</header>'''+search_results()+f'''<section class="video-directory" aria-labelledby="directory-heading"><div class="directory-controls"><h2 id="directory-heading">All teaching videos</h2><label>Collection<select data-collection-filter><option value="">All collections</option>{options}</select></label></div><p class="video-count" data-video-count role="status">{len(DATA['videos'])} videos</p><div class="video-list">'''+''.join(video_row(v) for v in DATA['videos'])+'''</div><p data-video-empty hidden>No videos match this collection.</p><button class="load-more" data-more-videos type="button" hidden>Show more videos</button></section>'''
(ROOT/'teaching-videos.html').write_text(page(library,'Teaching videos','Search public teaching videos by Nipun Batra: machine learning, mathematical foundations, deep learning, Python, software tools and course lectures.','teaching-videos.html'))
print(f'Built teaching.html and teaching-videos.html: {len(DATA["courses"])} offerings, {len(DATA["videos"])} unique videos.')
