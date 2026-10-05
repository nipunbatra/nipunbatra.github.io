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

# Offerings of one course share a row; later titles for the same course are aliased.
TITLE_ALIASES = {'Introduction to Computing': 'Computing'}
CURRENT = DATA['courses'][0]

def spaced(code):
    return re.sub(r'([A-Z]+)(\d+)', r'\1 \2', code)

def sheet_group(course):
    return next((g for g in SHEETS if g['course_code']==course['code'] and g['semester']==course['semester']), None)

def course_rows():
    rows=OrderedDict()
    for c in DATA['courses']: rows.setdefault(TITLE_ALIASES.get(c['title'],c['title']),[]).append(c)
    return [(title, offerings[::-1]) for title, offerings in rows.items()]

def chip(c):
    state='is-current' if c is CURRENT else 'is-recorded' if c['recordings'] else ''
    notes=(['teaching now'] if c is CURRENT else [])+(['lectures recorded'] if c['recordings'] else [])+(['cheatsheets'] if c.get('cheatsheets_url') else [])
    label=e(c['semester'].replace('Winter','Win'))+(' <span aria-hidden="true">§</span>' if c.get('cheatsheets_url') else '')
    aria=e(f'{c["title"]}, {spaced(c["code"])}, {c["semester"]}'+''.join(', '+n for n in notes),quote=True)
    return link(c['url'],label,f'offering {state}'.strip(),f'data-offering data-recorded="{str(c["recordings"]).lower()}" aria-label="{aria}"')

def course_table():
    rows=''
    for title,offerings in course_rows():
        codes=' / '.join(OrderedDict.fromkeys(spaced(c['code']) for c in offerings))
        years=[re.search(r'\d{4}',c['semester']).group() for c in offerings]
        span=years[0] if years[0]==years[-1] else f'{years[0]}–{years[-1]}'
        haystack=e(' '.join([title]+[' '.join(c[k] for k in ['code','title','semester','year']) for c in offerings]),quote=True)
        sheets=''.join(link(c['cheatsheets_url'],f'Cheatsheets · {c["semester"]}','course-sheets') for c in offerings if c.get('cheatsheets_url'))
        rows+=(f'<tr data-course data-search="{haystack}"><th scope="row">{link(offerings[-1]["url"],e(title))}<span class="course-code">{codes}</span>{sheets}</th>'
               f'<td class="num">{len(offerings)}×</td><td class="num">{span}</td><td><div class="chips">{" ".join(chip(c) for c in offerings)}</div></td></tr>')
    legend=('<p class="chip-legend"><span class="offering is-current">Aug 2026</span> teaching now <span class="offering is-recorded">Jan 2024</span> lectures recorded '
            '<span class="offering">Jan 2023</span> course site <span>§ cheatsheets</span></p>')
    return ('<div class="table-wrap"><table class="course-table"><caption class="sr-only">IIT Gandhinagar courses, one row per course, with each semester offered.</caption>'
            '<thead><tr><th scope="col">Course</th><th scope="col">Taught</th><th scope="col">Years</th><th scope="col">Offerings</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+legend)

def feature():
    c=CURRENT; group=sheet_group(c)
    recording=next((x for x in DATA['collections'] if x['url']==c.get('recording_url')),None)
    cover=recording['cover'] if recording else 0
    acts=link(c['url'],'Course site','button solid')
    if recording: acts+=link(recording['url'],f'Lecture recordings · {len(recording["video_ids"])}','button')
    if group: acts+=link('#sheets-'+group['id'],f'Cheatsheets · {len(group["sheets"])}','button course-sheets')
    for cid in c.get('related_collections',[]):
        x=COLLECTIONS[cid]; acts+=link(x['url'],f'{e(x["title"])} · {len(x["video_ids"])}','button')
    description=f'<p>{spaced(c["code"])}. {e(group["description"])}</p>' if group else f'<p>{spaced(c["code"])}</p>'
    return (f'<section class="feature" id="now" aria-labelledby="now-heading"><span class="collection-cover cover-{cover}" aria-hidden="true"></span><div>'
            f'<p class="teaching-eyebrow">This semester · {c["semester"]}</p><h2 id="now-heading">{e(c["title"])}</h2>{description}<div class="actions">{acts}</div></div></section>')

def collection_card(c):
    count=len(c['video_ids']); meta=f'{count} video'+('s' if count != 1 else '')
    if c['section'] == 'Visual explanations':
        lengths=sorted([VIDEOS[v]['duration'] for v in c['video_ids']],key=duration_seconds)
        meta+=' · '+duration(lengths[0])
        if len(lengths)>1: meta+='–'+duration(lengths[-1])+' each'
    if c.get('playlist_id'):
        youtube='https://www.youtube.com/playlist?list='+c['playlist_id']
        if c['url'] != youtube: meta+=' · '+link(youtube,'YouTube')
    cover=f'<span class="collection-cover cover-{c["cover"]}" role="img" aria-label="Illustration for {e(c["title"],quote=True)}"></span>'
    description=f'<p class="collection-description">{e(c["description"])}</p>' if c['description'] else ''
    cover_link=link(c['url'],cover,'cover-link','tabindex="-1" aria-hidden="true"')
    return f'<article class="collection" data-collection-id="{c["id"]}">{cover_link}<h4>{link(c["url"],e(c["title"]))}</h4><p class="collection-meta">{meta}</p>{description}</article>'

def playlists():
    groups=OrderedDict()
    for c in DATA['collections']:
        if c['cover'] is not None: groups.setdefault(c['section'],[]).append(c)
    total=len(DATA['videos'])
    body=''.join(f'<section class="collection-group"><h3>{e(name)}</h3><span class="group-count">{sum(len(c["video_ids"]) for c in group)} videos</span><div class="collection-grid">'
                 +''.join(collection_card(c) for c in group)+'</div></section>' for name,group in groups.items())
    # #series is kept for older links to the video collections.
    return (f'<section class="teaching-videos" id="videos" aria-labelledby="series"><header class="course-heading"><h2 id="series">Videos</h2><span>{total} videos in {sum(len(g) for g in groups.values())} playlists</span></header>'
            +body+link('teaching-videos.html',f'Browse all {total} teaching videos','all-videos-link')+'</section>')

def cheatsheets():
    groups=''
    for g in SHEETS:
        items=''.join(f'<li>{link(s["url"],e(s["title"]))}<span>PDF · {s["pages"]} pages</span></li>' for s in g['sheets'])
        groups+=f'<details class="sheet-group" id="sheets-{g["id"]}"><summary><span>{e(g["title"])}<small>{e(g["course_code"])} · {e(g["semester"])}</small><em>{e(g["description"])}</em></span><span>{len(g["sheets"])} PDFs</span></summary><div class="sheet-content"><p class="sheet-course">{link(g["course_url"],"Course page")} · {link(g["library_url"],"Lecture library")}</p><ul class="sheet-list">{items}</ul></div></details>'
    count=sum(len(g['sheets']) for g in SHEETS)
    return f'<section class="teaching-cheatsheets" id="cheatsheets" aria-labelledby="cheatsheets-heading"><header class="course-heading"><h2 id="cheatsheets-heading">Cheatsheets</h2><span>{count} PDFs</span></header><p class="section-note">Two-page references from my courses. Open a course to see its sheets, or search for a topic above.</p>{groups}</section>'

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


NVIDEOS=len(DATA['videos']); NSHEETS=sum(len(g['sheets']) for g in SHEETS)
main=(f'''<header class="teaching-intro"><div><p class="teaching-eyebrow">IIT Gandhinagar</p><h1>Teaching</h1><p>{len(DATA['courses'])} course offerings, {NVIDEOS} videos and {NSHEETS} cheatsheets since 2018.</p></div>'''+search_ui()+'</header>'
      f'<nav class="section-jumps" aria-label="Teaching sections"><a href="#now">This semester</a><a href="#courses">Courses</a><a href="#videos">Videos</a><a href="#cheatsheets">Cheatsheets</a><a href="teaching-videos.html">All {NVIDEOS} videos</a></nav>'
      +search_results()+feature()
      +'<section class="teaching-courses" id="courses" aria-labelledby="courses-heading"><header class="course-heading"><h2 id="courses-heading">Courses</h2><span>2018–2026</span></header><p class="section-note">One row per course. Each chip is one offering and links to that semester’s course site.</p>'
      +course_table()+'</section>'+playlists()+cheatsheets())
(ROOT/'teaching.html').write_text(page(main,'Teaching','Courses at IIT Gandhinagar by semester, cheatsheets, lecture recordings, and visual lessons on machine learning, mathematics, Python and software tools.','teaching.html'))
options=''.join(f'<option value="{c["id"]}">{e(c["title"])}</option>' for c in DATA['collections'])
library='''<header class="teaching-intro"><div><p class="teaching-eyebrow"><a href="teaching.html">Teaching</a></p><h1>Teaching videos</h1><p>Search by topic, or choose a collection.</p></div>'''+search_ui()+'''</header>'''+search_results()+f'''<section class="video-directory" aria-labelledby="directory-heading"><div class="directory-controls"><h2 id="directory-heading">All teaching videos</h2><label>Collection<select data-collection-filter><option value="">All collections</option>{options}</select></label></div><p class="video-count" data-video-count role="status">{len(DATA['videos'])} videos</p><div class="video-list">'''+''.join(video_row(v) for v in DATA['videos'])+'''</div><p data-video-empty hidden>No videos match this collection.</p><button class="load-more" data-more-videos type="button" hidden>Show more videos</button></section>'''
(ROOT/'teaching-videos.html').write_text(page(library,'Teaching videos','Search public teaching videos by Nipun Batra: machine learning, mathematical foundations, deep learning, Python, software tools and course lectures.','teaching-videos.html'))
print(f'Built teaching.html and teaching-videos.html: {len(DATA["courses"])} offerings, {len(DATA["videos"])} unique videos.')
