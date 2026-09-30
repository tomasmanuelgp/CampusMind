"""Genera la hoja A4 a doble cara de Re-Fluye.

Texto editorial: 02-guia-visual-equipo.md. Mantener ambos sincronizados.
Ejecutar con el Python del runtime de Codex o cualquier Python con reportlab.
"""

from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / "output" / "pdf" / "refluye-guia-visual-equipo-a4.pdf"
DEST.parent.mkdir(parents=True, exist_ok=True)

font_pairs = [
    (Path(r"C:\Windows\Fonts\arial.ttf"), Path(r"C:\Windows\Fonts\arialbd.ttf")),
    (Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")),
    (Path("/Library/Fonts/Arial.ttf"), Path("/Library/Fonts/Arial Bold.ttf")),
]
font_pair = next(((normal, bold) for normal, bold in font_pairs if normal.exists() and bold.exists()), None)
if font_pair is None:
    raise RuntimeError("Instala Arial o DejaVu Sans para generar la guía con tildes legibles.")
pdfmetrics.registerFont(TTFont("Arial", str(font_pair[0])))
pdfmetrics.registerFont(TTFont("Arial-Bold", str(font_pair[1])))
pdfmetrics.registerFontFamily("Arial", normal="Arial", bold="Arial-Bold")

PAGE_W, PAGE_H = A4
M = 36
W = PAGE_W - M * 2
NAVY = colors.HexColor("#1A5276")
INK = colors.HexColor("#1C2833")
MUTED = colors.HexColor("#425563")
PALE_BLUE = colors.HexColor("#E8F4FA")
PALE_GREEN = colors.HexColor("#E9F7EF")
PALE_AMBER = colors.HexColor("#FEF5E7")
PALE_RED = colors.HexColor("#FDEDEC")
LINE = colors.HexColor("#C7D6D9")

body = ParagraphStyle("body", fontName="Arial", fontSize=10.2, leading=14.3, textColor=INK)
small = ParagraphStyle("small", parent=body, fontSize=9.1, leading=12.2)
micro = ParagraphStyle("micro", parent=body, fontSize=8.3, leading=10.8)
white = ParagraphStyle("white", parent=body, textColor=colors.white)


def paragraph(c, html, x, top, width, style=body, max_height=None):
    p = Paragraph(html, style)
    _, h = p.wrap(width, PAGE_H)
    if max_height is not None and h > max_height + 0.5:
        raise ValueError(f"Texto excede el espacio ({h:.1f}>{max_height:.1f}): {html[:65]}")
    p.drawOn(c, x, top - h)
    return h


def label(c, value, x, y, size=9.5, color=NAVY):
    c.setFillColor(color)
    c.setFont("Arial-Bold", size)
    c.drawString(x, y, value)


def panel(c, x, top, width, height, fill, radius=13):
    c.setFillColor(fill)
    c.roundRect(x, top - height, width, height, radius, fill=1, stroke=0)


def drop(c, x, y, scale=1):
    p = c.beginPath()
    p.moveTo(x, y + 27 * scale)
    p.curveTo(x - 11 * scale, y + 9 * scale, x - 12 * scale, y + 1 * scale, x, y)
    p.curveTo(x + 12 * scale, y + 1 * scale, x + 11 * scale, y + 9 * scale, x, y + 27 * scale)
    c.setFillColor(colors.white)
    c.drawPath(p, fill=1, stroke=0)
    c.setStrokeColor(NAVY)
    c.setLineWidth(1.4)
    c.line(x - 4 * scale, y + 8 * scale, x + 1 * scale, y + 5 * scale)


def step(c, n, title, content, top, height, tint):
    panel(c, M, top, W, height, tint)
    c.setFillColor(NAVY)
    c.circle(M + 27, top - 27, 15, fill=1, stroke=0)
    c.setFillColor(colors.white)
    c.setFont("Arial-Bold", 14)
    c.drawCentredString(M + 27, top - 32, str(n))
    label(c, title, M + 53, top - 25, 12, INK)
    paragraph(c, content, M + 53, top - 33, W - 72, small, height - 39)


def footer(c, page):
    c.setStrokeColor(LINE)
    c.line(M, 39, PAGE_W - M, 39)
    label(c, "RE-FLUYE  /  GUIA DE PROTOTIPO 0.1", M, 25, 8, NAVY)
    c.setFont("Arial", 8)
    c.setFillColor(MUTED)
    c.drawRightString(PAGE_W - M, 25, f"{page} / 2  ·  30 SEP 2026")


c = canvas.Canvas(str(DEST), pagesize=A4, pageCompression=1)
c.setTitle("Re-Fluye - guia visual de uso y cuidado del equipo")
c.setAuthor("CampusMind / Re-Fluye, con atribucion a CCD-UNAB")
c.setSubject("Guia A4 a doble cara para prototipo de medicion de agua")

# Cara 1
c.setFillColor(NAVY)
c.rect(0, PAGE_H - 139, PAGE_W, 139, fill=1, stroke=0)
drop(c, M + 20, PAGE_H - 73, 1.2)
label(c, "RE-FLUYE", M + 47, PAGE_H - 52, 13, colors.white)
c.setFillColor(colors.white)
c.setFont("Arial-Bold", 23)
c.drawString(M, PAGE_H - 89, "Abre. Conecta. Mide.")
paragraph(c, "Cinco pasos para usar el equipo y entender su resultado.", M, PAGE_H - 100, W, white, 23)
for i in range(5):
    cx = M + 10 + i * 46
    c.setFillColor(colors.white if i == 0 else colors.HexColor("#B9DEE9"))
    c.circle(cx, PAGE_H - 123, 7, fill=1, stroke=0)
    if i < 4:
        c.setStrokeColor(colors.HexColor("#B9DEE9"))
        c.setLineWidth(2)
        c.line(cx + 8, PAGE_H - 123, cx + 38, PAGE_H - 123)

panel(c, M, PAGE_H - 150, W, 70, PALE_RED)
label(c, "ANTES DE EMPEZAR", M + 15, PAGE_H - 170, 10.3, colors.HexColor("#8A2E31"))
paragraph(c, "Mide pH, turbidez, TDS y temperatura. <b>No detecta microbios ni certifica potabilidad.</b> No pruebes el agua. Si sospechas combustible o químicos, aléjate y busca otra fuente.", M + 15, PAGE_H - 178, W - 30, small, 34)

top = PAGE_H - 231
steps = [
    ("Revisa el equipo", "Caja y conectores secos; sondas sin daño; calibración y alimentación confirmadas por el técnico. Si algo está mojado o roto, <b>no enciendas</b>.", 76, PALE_BLUE),
    ("Enciende y conecta", "Usa la alimentación <b>etiquetada en tu unidad</b>. Abre la app: <b>Medir agua → Buscar equipos cercanos</b>. Acepta Bluetooth y elige ReFluye-V2. PIN de referencia: 1234. Sin equipo: modo DEMO.", 91, PALE_GREEN),
    ("Coloca las sondas", "Sumerge <b>solo los extremos de medición</b>; no mojes caja ni módulos. Evita golpear el vidrio del pH. La primera lectura completa ya permite orientar; si varía, será <b>preliminar</b>.", 79, PALE_BLUE),
    ("Cuenta lo que observas", "Escribe la fuente, elige el uso y marca origen, olor y aspecto. Si no sabes, marca <b>No sé</b>. Nunca pruebes ni acerques la cara al agua sospechosa.", 76, PALE_AMBER),
    ("Lee y actúa", "Toca <b>Ver qué puedo hacer con esta agua</b>. Lee la decisión y QUÉ HACER AHORA. El ICA de 0 a 100 no es potabilidad. Para beber o cocinar siempre hace falta desinfección.", 86, PALE_GREEN),
]
for i, (title, content, height, tint) in enumerate(steps, 1):
    step(c, i, title, content, top, height, tint)
    top -= height + 8
if top < 95:
    raise ValueError(f"La cara 1 invade el pie: {top}")
paragraph(c, "<b>Si hay olor raro, aceite o agua verde:</b> no intentes volverla utilizable solo hirviéndola. Busca otra fuente y pide orientación local.", M, top - 3, W, small, top - 50)
qr_url = "https://github.com/tomasmanuelgp/CampusMind/releases/tag/refluye-v0.3.0"
qr = QrCodeWidget(qr_url)
qr_bounds = qr.getBounds()
qr_scale = 63 / (qr_bounds[2] - qr_bounds[0])
c.saveState()
c.translate(M, 57)
c.scale(qr_scale, qr_scale)
qr_drawing = Drawing(qr_bounds[2] - qr_bounds[0], qr_bounds[3] - qr_bounds[1])
qr_drawing.add(qr)
renderPDF.draw(qr_drawing, c, 0, 0)
c.restoreState()
label(c, "DESCARGA LA APP 0.3.0", M + 77, 108, 9.8, NAVY)
paragraph(c, "Escanea el QR y descarga la APK en <b>Assets</b>. Confirma que el sitio sea <b>github.com/tomasmanuelgp/CampusMind</b>. Android 7.0+; Bluetooth Classic SPP para medir.", M + 77, 100, W - 77, micro, 45)
footer(c, 1)
c.showPage()

# Cara 2
c.setFillColor(NAVY)
c.rect(0, PAGE_H - 95, PAGE_W, 95, fill=1, stroke=0)
label(c, "RE-FLUYE  /  CUIDADO Y SOPORTE", M, PAGE_H - 35, 10, colors.white)
c.setFillColor(colors.white)
c.setFont("Arial-Bold", 22)
c.drawString(M, PAGE_H - 66, "Cuida cada componente")

top = PAGE_H - 108
care = [
    ("pH · vidrio", "Enjuaga el extremo con agua destilada/desionizada. Mantén seco el BNC. Guarda con tapa y solución del modelo; no frotes ni dejes secar el bulbo."),
    ("Turbidez · óptico", "Enjuaga y limpia suavemente la ventana sin rayarla. Revisa el cable. Mantén seco el adaptador de señal."),
    ("TDS · electrodos", "Enjuaga y retira residuos. Si la sonda es SEN0244, no midas a 55 °C o más; su rango declarado es 0–1000 ppm."),
    ("Temperatura", "Enjuaga solo la punta sellada. Revisa el sello del cable. `-127` significa que el sensor no respondió."),
    ("Caja · electrónica", "Apaga y seca el exterior; guarda a salvo de salpicaduras. Nunca sumerjas ESP32, PCB, LCD, conectores ni módulos."),
]
for i, (name, desc) in enumerate(care):
    h = 65 if i != 2 else 72
    panel(c, M, top, W, h, PALE_BLUE if i % 2 == 0 else colors.HexColor("#F3F7F5"), 9)
    label(c, name.upper(), M + 12, top - 19, 9.7, NAVY)
    paragraph(c, escape(desc).replace("`", ""), M + 12, top - 24, W - 24, micro, h - 29)
    top -= h + 6

panel(c, M, top - 1, W, 72, PALE_AMBER)
label(c, "SI ALGO FALLA", M + 13, top - 20, 10.3, INK)
paragraph(c, "<b>Sin datos:</b> revisa energía, Bluetooth y permisos. <b>Lectura no confiable:</b> solicita revisión de calibración; no inventes fechas. <b>LCD vacío o -127:</b> pide inspección de la unidad. El equipo aún requiere pruebas físicas.", M + 13, top - 28, W - 26, micro, 40)
top -= 84

label(c, "COMPLETAR ANTES DE ENTREGAR ESTA UNIDAD", M, top - 2, 9.5, NAVY)
top -= 14
fields = ["Serie / alimentación:", "Sondas / calibración:", "Vigente hasta / soporte:"]
for field in fields:
    c.setStrokeColor(LINE)
    c.line(M, top - 24, PAGE_W - M, top - 24)
    label(c, field, M + 2, top - 16, 8.6, MUTED)
    top -= 33

paragraph(c, "<b>Referencias técnicas:</b> DFRobot SEN0161, SEN0189 y SEN0244; Analog Devices DS18B20; CDC agua en emergencias. Detalles, enlaces y límites por modelo en el manual del repositorio. Prototipo: confirma piezas y alimentación reales.", M, top - 7, W, micro, top - 58)
footer(c, 2)
c.save()
print(DEST)
