"""Generate an original monoline connected-script font; no third-party font outlines.
Run: python3 -m pip install fonttools brotli && python3 tools/build_momentum_script.py
"""
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from math import cos, sin, pi, hypot
from pathlib import Path

# Hand-drawn centerlines, x/y in 1000-unit em space; connecting exit strokes
# are intentionally present on many lower-case glyphs.
LOWER = {
'a':'80,170 80,310 140,360 230,350 280,280 280,110 215,80 145,80 80,140|280,350 280,75 410,110',
'b':'90,640 90,110 150,75 245,95 285,175 270,290 190,355 90,300|285,110 410,110',
'c':'310,315 230,365 135,340 75,260 70,160 140,85 235,80 330,120 420,115',
'd':'290,640 290,140 235,85 150,80 85,140 80,250 125,345 225,365 290,310|290,150 325,85 410,110',
'e':'70,190 265,235 290,295 248,350 160,355 90,295 75,170 140,85 235,80 320,125 420,115',
'f':'145,-150 170,90 210,465 250,585 310,640 355,610|80,365 325,365|170,95 245,70 340,110 420,110',
'g':'290,340 235,365 150,355 75,250 90,135 150,85 240,85 290,165 290,340 290,-80 245,-165 150,-165 95,-110|290,115 400,115',
'h':'85,640 90,90 140,90 145,240 210,345 280,355 315,295 315,90 425,110',
'i':'175,345 175,90 250,85 325,110 420,110|170,510 175,505',
'j':'285,345 285,-90 240,-165 160,-165 115,-105|280,510 285,505',
'k':'90,640 90,80|305,355 135,205 305,90 415,110',
'l':'180,640 180,100 250,75 320,110 420,110',
'm':'70,345 70,90 110,80 140,240 205,350 255,330 255,95 295,90 335,255 400,340 445,300 445,90 510,110',
'n':'90,340 90,90 145,85 150,255 205,340 285,350 315,295 315,90 420,110',
'o':'185,365 90,325 70,230 100,120 185,80 285,115 315,230 285,325 185,365|310,130 415,110',
'p':'90,340 90,-175|90,285 175,355 265,350 315,260 280,150 190,90 90,140|280,130 420,110',
'q':'285,310 210,365 130,350 75,270 85,150 165,85 245,100 285,160 285,340 285,-170|285,100 410,110',
'r':'95,335 95,90 150,90 165,265 245,345 320,315 425,110',
's':'305,325 225,360 125,345 95,280 140,220 265,190 300,130 245,85 145,80 85,120 425,110',
't':'175,515 175,135 210,85 290,85 405,110|95,345 320,345',
'u':'85,350 85,155 120,85 205,90 280,165 280,350 280,100 335,85 420,110',
'v':'75,350 150,90 210,80 315,350 270,180 310,110 425,110',
'w':'60,350 105,90 150,90 230,265 255,90 300,90 405,350 370,185 420,110',
'x':'90,345 315,95 420,110|315,345 95,90',
'y':'75,350 135,110 200,95 295,350 265,0 215,-145 135,-165 95,-120|290,110 410,110',
'z':'85,340 310,345 85,90 310,90 425,110',
}
NUMBERS={
'0':'190,500 95,440 75,260 95,90 200,65 290,150 315,320 275,465 190,500',
'1':'105,395 210,490 210,80|110,80 315,80',
'2':'85,390 165,490 270,470 310,385 260,295 85,90 320,90',
'3':'90,440 200,490 300,435 285,340 200,290 285,250 310,170 235,80 90,100',
'4':'270,80 270,500 60,200 340,200',
'5':'290,490 115,490 90,305 215,320 300,245 285,135 190,75 80,110',
'6':'290,465 205,485 100,370 85,195 145,90 260,100 305,205 245,300 135,280',
'7':'80,480 330,480 170,75',
'8':'195,290 100,350 120,445 205,490 290,445 280,345 195,290 100,205 120,110 205,75 290,125 275,235 195,290',
'9':'295,270 225,250 125,295 95,390 150,480 250,480 300,375 290,180 190,80 105,105',
}
PUNCT={
'period':'175,90 180,95','comma':'175,90 145,-30',
'exclam':'180,500 175,205|175,90 180,95',
'question':'85,415 175,485 270,470 295,390 245,325 180,255 180,195|180,90 185,95',
'hyphen':'110,225 320,225','quotesingle':'160,500 150,385',
'colon':'175,280 180,285|175,90 180,95',
'ampersand':'300,355 210,470 135,430 145,360 265,210 320,105 240,75 145,100 105,190 300,350',
}
PUNCT_CMAP={'.':'period',',':'comma','!':'exclam','?':'question','-':'hyphen',"'":'quotesingle',':':'colon','&':'ampersand'}

def make_glyph(data, upper=False):
    pen=TTGlyphPen(None)
    for stroke in data.split('|'):
        pts=[tuple(map(float,p.split(','))) for p in stroke.split()]
        if upper:
            pts=[(x*1.02+25,y*1.2+5) for x,y in pts]
        for (x0,y0),(x1,y1) in zip(pts,pts[1:]):
            x0+=.18*y0; x1+=.18*y1
            length=hypot(x1-x0,y1-y0)
            if length<.001: continue
            nx=-(y1-y0)/length*22;ny=(x1-x0)/length*22
            pen.moveTo((round(x0+nx),round(y0+ny)))
            pen.lineTo((round(x1+nx),round(y1+ny)))
            pen.lineTo((round(x1-nx),round(y1-ny)))
            pen.lineTo((round(x0-nx),round(y0-ny)))
            pen.closePath()
        for x,y in pts:
            x+=.18*y;radius=22
            pen.moveTo((round(x+radius),round(y)))
            for j in range(1,13):
                a=j*2*pi/12
                pen.lineTo((round(x+radius*cos(a)),round(y+radius*sin(a))))
            pen.closePath()
    return pen.glyph()

def build():
    names=['.notdef','space']+list(LOWER)+[c.upper() for c in LOWER]+list(NUMBERS)+list(PUNCT)
    fb=FontBuilder(1000,isTTF=True)
    fb.setupGlyphOrder(names)
    glyphs={'.notdef':make_glyph('50,0 50,700 450,700 450,0 50,0'),'space':TTGlyphPen(None).glyph()}
    metrics={'.notdef':(500,30),'space':(300,0)}
    cmap={32:'space'}
    for c,d in LOWER.items():
        glyphs[c]=make_glyph(d)
        glyphs[c.upper()]=make_glyph(d,True)
        metrics[c]=(570 if c in 'mw' else 500,30)
        metrics[c.upper()]=(590 if c in 'mw' else 530,30)
        cmap[ord(c)]=c;cmap[ord(c.upper())]=c.upper()
    for c,d in NUMBERS.items():
        glyphs[c]=make_glyph(d);metrics[c]=(480,30);cmap[ord(c)]=c
    for c,d in PUNCT.items():
        glyphs[c]=make_glyph(d);metrics[c]=(430,30)
    for c,n in PUNCT_CMAP.items():cmap[ord(c)]=n
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=800,descent=-220)
    fb.setupCharacterMap(cmap)
    fb.setupNameTable({'familyName':'Momentum Script','styleName':'Regular','uniqueFontIdentifier':'MomentumScript-Regular-1.0','fullName':'Momentum Script Regular','psName':'MomentumScript-Regular','version':'Version 1.0','description':'Original experimental monoline hand-lettered typeface for Momentum Data Solutions'})
    fb.setupOS2(sTypoAscender=800,sTypoDescender=-220,usWinAscent=850,usWinDescent=250)
    fb.setupPost();fb.setupMaxp()
    out=Path('public/fonts');out.mkdir(parents=True,exist_ok=True)
    fb.font.save(str(out/'MomentumScript-Regular.ttf'))
    fb.font.flavor='woff2'
    fb.font.save(str(out/'MomentumScript-Regular.woff2'))
    print(f'Generated {len(names)} original glyphs in public/fonts')

if __name__=='__main__':build()
