# 칼럼 md → 블로그 HTML(인라인 스타일). 사용: python md2blog.py <src.md> <out.html> [리드 문구]
# 인용 배너(>)·H1·「확인할 것」 절은 제외, 「(2026.9.24 원문 확인)」 메모 제거. 표지 이미지는 __IMAGE_URL__ 자리표시.
import io, re, sys, html
sys.stdout.reconfigure(encoding='utf-8')
SRC = sys.argv[1]
OUT = sys.argv[2]
LEAD = sys.argv[3] if len(sys.argv) > 3 else ''
ALT = sys.argv[4] if len(sys.argv) > 4 else '칼럼 표지'
NOTE = '(2026.9.24 원문 확인)'

def inline(t):
    t = t.replace(NOTE, '').replace(', 2026.9.24 국가법령정보센터 원문 확인', '')
    t = html.escape(t, quote=False)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    return t

lines = io.open(SRC, encoding='utf-8').read().replace('\r\n', '\n').split('\n')
out = []
if LEAD:
    out.append(f'<p style="color:#5C6470;font-size:0.95em">{html.escape(LEAD)}</p>')
out.append(f'<figure style="margin:28px 0"><img src="__IMAGE_URL__" alt="{html.escape(ALT)}" style="width:100%;height:auto;border-radius:10px"></figure>')

state = {'table': [], 'ol': False, 'ul': False}

def flush_table():
    # 표는 <table> 로 낸다(사용자 선택, 2026-09-24 저녁). 주의: 관리자 편집기(Quill)로 저장하면 표가 한 줄로 붙는다.
    # 편집기 저장 뒤에는 이 변환기로 다시 올려야 표가 복구된다. 나라별 문단 대안은 git 이력(a8f6e38)에 있다.
    rows = state['table']
    if not rows:
        return
    head, body = rows[0], rows[1:]
    h = '<div style="overflow-x:auto;margin:16px 0"><table style="border-collapse:collapse;width:100%;font-size:0.92em;line-height:1.5">'
    h += '<thead><tr>' + ''.join(f'<th style="background:#1B2230;color:#FFFDF6;padding:10px 12px;text-align:left;border:1px solid #333;white-space:nowrap">{inline(c)}</th>' for c in head) + '</tr></thead><tbody>'
    for i, r in enumerate(body):
        bg = '#FFFFFF' if i % 2 == 0 else '#F6F7F9'
        h += f'<tr style="background:{bg}">' + ''.join(f'<td style="padding:10px 12px;border:1px solid #ddd;vertical-align:top">{inline(c)}</td>' for c in r) + '</tr>'
    h += '</tbody></table></div>'
    out.append(h)
    state['table'] = []

def close_lists():
    if state['ol']:
        out.append('</ol>'); state['ol'] = False
    if state['ul']:
        out.append('</ul>'); state['ul'] = False

for raw in lines:
    ln = raw.rstrip()
    if ln.startswith('### 확인할 것'):
        break
    if ln.startswith('# ') or ln.startswith('> **'):
        continue
    if ln.startswith('> '):
        flush_table(); close_lists()
        out.append(f'<blockquote style="margin:22px 0;padding:14px 20px;border-left:5px solid #C8271E;background:#FFF6F5;color:#222;font-weight:600;line-height:1.7">{inline(ln[2:])}</blockquote>')
        continue
    if ln.startswith('|'):
        if not re.match(r'^\|\s*-{2,}', ln):
            state['table'].append([c.strip() for c in ln.strip().strip('|').split('|')])
        continue
    flush_table()
    m = re.match(r'^(\d+)\. (.*)$', ln)
    if m:
        if state['ul']:
            out.append('</ul>'); state['ul'] = False
        if not state['ol']:
            out.append('<ol style="margin:12px 0 12px 26px;line-height:1.75">'); state['ol'] = True
        out.append(f'<li style="margin:8px 0">{inline(m.group(2))}</li>')
        continue
    if ln.startswith('- '):
        if state['ol']:
            out.append('</ol>'); state['ol'] = False
        if not state['ul']:
            out.append('<ul style="margin:8px 0 8px 22px;color:#444;font-size:0.95em;line-height:1.7">'); state['ul'] = True
        out.append(f'<li>{inline(ln[2:])}</li>')
        continue
    close_lists()
    if ln == '':
        continue
    if ln == '---':
        out.append('<hr style="margin:36px 0;border:0;border-top:1px solid #ddd">'); continue
    if ln.startswith('## '):
        out.append('<p style="margin:0;height:6px;line-height:0"><br></p>')  # 소제목 앞 빈 줄: 스타일이 벗겨지는 화면(에디터·일부 앱)에서도 문단 구분이 보이게
        out.append(f'<h2 style="margin:14px 0 10px;font-size:1.35em;font-weight:700;line-height:1.35;color:#1B2230;border-left:6px solid #C8271E;padding-left:12px">{inline(ln[3:])}</h2>'); continue
    if ln.startswith('### '):
        out.append('<p style="margin:0;height:6px;line-height:0"><br></p>')
        out.append(f'<p style="font-weight:700;margin-top:18px">{inline(ln[4:])}</p>'); continue
    if ln.startswith('*') and ln.endswith('*') and not ln.startswith('**'):
        out.append(f'<p style="font-weight:700;line-height:1.8">{inline(ln[1:-1])}</p>'); continue
    out.append(f'<p style="line-height:1.85;margin:14px 0">{inline(ln)}</p>')

close_lists()
flush_table()
out.append('<p style="margin:0;height:6px;line-height:0"><br></p>')
out.append('<p style="margin-top:10px;color:#5C6470;font-size:0.9em">주권자사법개혁추진준비위원회 · 시민법정.kr</p>')
res = '\n'.join(out)
for bad in ('확인할 것', '초안', '블로그 게시본', '원문 확인'):
    for L in res.split('\n'):
        if bad in L:
            print('BAD', bad, '::', L[:120])
    assert bad not in res, bad
io.open(OUT, 'w', encoding='utf-8').write(res)
print('written', len(res), 'chars;', res.count('<h2'), 'h2;', res.count('<table'), 'table;', res.count('<li'), 'li')
