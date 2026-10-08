"""Convert the original Spline heading font for Chibi's fixed text3d font URL.

Requires fontTools for this asset preparation step only; no app dependency.
"""
import json
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.basePen import BasePen
from fontTools.pens.boundsPen import BoundsPen

root = Path(__file__).resolve().parents[1]
font = TTFont(root / 'public/fonts/archivo-black.ttf')
glyph_set = font.getGlyphSet()
resolution = font['head'].unitsPerEm

class OutlinePen(BasePen):
    def __init__(self):
        super().__init__(glyph_set)
        self.commands = []
    def emit(self, kind, *points):
        self.commands.append(kind + ' ' + ' '.join(str(round(v, 3)) for point in points for v in point))
    def _moveTo(self, point):
        self.start = point
        self.emit('m', point)
    def _lineTo(self, point):
        self.emit('l', point)
    def _qCurveToOne(self, control, end):
        self.emit('q', end, control)
    def _curveToOne(self, first, second, end):
        self.emit('b', end, first, second)
    def _closePath(self):
        self.emit('l', self.start)

glyphs = {}
metrics = {}
for code, name in font.getBestCmap().items():
    glyph = glyph_set[name]
    outline = OutlinePen()
    bounds = BoundsPen(glyph_set)
    glyph.draw(outline)
    glyph.draw(bounds)
    left, _, right, _ = bounds.bounds or (0, 0, 0, 0)
    glyphs[chr(code)] = {'ha': glyph.width, 'x_min': left, 'x_max': right, 'o': ' '.join(outline.commands)}
    if 32 <= code < 127:
        metrics[chr(code)] = [round(v / resolution, 6) for v in (glyph.width, left, right)]
result = {'glyphs': glyphs, 'familyName': 'Archivo Black', 'resolution': resolution,
          'ascender': font['hhea'].ascent, 'descender': font['hhea'].descent,
          'boundingBox': {'yMin': font['head'].yMin, 'yMax': font['head'].yMax},
          'underlineThickness': font['post'].underlineThickness}
# Chibi 0.4.0 has a fixed font URL. Portfolio serves Archivo Black at that URL.
(root / 'public/fonts/helvetiker_regular.typeface.json').write_text(json.dumps(result, separators=(',', ':')))
(root / 'src/components/keyboard/heading-metrics.json').write_text(json.dumps(metrics, separators=(',', ':')) + '\n')
