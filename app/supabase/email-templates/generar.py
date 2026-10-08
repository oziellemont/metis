"""Genera las plantillas de correo de Supabase Auth con el diseño de mêtis.

Uso:  python3 app/supabase/email-templates/generar.py
Crea un .html por plantilla (para pegar en Supabase → Authentication → Emails)
y un vista-previa.html para verlas todas juntas.
"""
from pathlib import Path

LOGO = "https://www.metisalign.mx/brand/logo-horizontal-2000.png"
SITE = "https://www.metisalign.mx"
CONTACT = "hola@metisalign.mx"
INK, INDIGO, SLATE, MUTED, CANVAS = "#171A3A", "#4F3FE0", "#475569", "#94A3B8", "#F6F7FC"
FONT = "Poppins,'Segoe UI',Helvetica,Arial,sans-serif"


def layout(preheader: str, title: str, body: str, button: str | None, url: str | None, note: str) -> str:
    btn = ""
    fallback = ""
    if button and url:
        btn = f"""
              <tr><td style="padding:8px 0 4px">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                  <td bgcolor="{INDIGO}" style="border-radius:12px">
                    <a href="{url}" target="_blank" style="display:inline-block;padding:14px 26px;font-family:{FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:12px">{button}</a>
                  </td>
                </tr></table>
              </td></tr>"""
        fallback = f"""
              <tr><td style="padding:22px 0 0;font-family:{FONT};font-size:12px;line-height:18px;color:{MUTED}">
                ¿El botón no funciona? Copia y pega este enlace en tu navegador:<br>
                <a href="{url}" style="color:{INDIGO};word-break:break-all;text-decoration:underline">{url}</a>
              </td></tr>"""
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>{title}</title>
</head>
<body style="margin:0;padding:0;background:{CANVAS};-webkit-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">{preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="{CANVAS}">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
        <tr><td style="padding:0 4px 18px">
          <a href="{SITE}" target="_blank"><img src="{LOGO}" width="120" height="35" alt="mêtis" style="display:block;border:0;width:120px;height:35px"></a>
        </td></tr>
        <tr><td bgcolor="#ffffff" style="border-radius:20px;border:1px solid #E8EAF4;overflow:hidden">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td height="4" style="height:4px;line-height:4px;font-size:0;background:{INDIGO};background-image:linear-gradient(90deg,#6D5DF6,#4F3FE0,#2B1F8A)">&nbsp;</td></tr>
            <tr><td style="padding:32px 32px 30px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="font-family:{FONT};font-size:22px;line-height:30px;font-weight:600;color:{INK};padding:0 0 12px">{title}</td></tr>
                <tr><td style="font-family:{FONT};font-size:15px;line-height:24px;color:{SLATE};padding:0 0 18px">{body}</td></tr>{btn}{fallback}
              </table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:18px 8px 0;font-family:{FONT};font-size:12px;line-height:18px;color:{MUTED}">
          {note}
        </td></tr>
        <tr><td style="padding:14px 8px 0;font-family:{FONT};font-size:12px;line-height:18px;color:{MUTED}">
          <strong style="color:{SLATE}">mêtis</strong> · Alineación estratégica · Monterrey, México<br>
          <a href="{SITE}" style="color:{MUTED};text-decoration:underline">metisalign.mx</a> · <a href="mailto:{CONTACT}" style="color:{MUTED};text-decoration:underline">{CONTACT}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
"""


SAFE = "Si no fuiste tú, ignora este correo: tu cuenta sigue segura y no se hará ningún cambio."

TEMPLATES = [
    {
        "file": "1-confirmar-registro.html",
        "supabase": "Confirm signup",
        "subject": "Confirma tu correo para entrar a mêtis",
        "preheader": "Un clic y tu cuenta queda lista.",
        "title": "Confirma tu correo",
        "body": "¡Bienvenido a <strong style=\"color:#171A3A\">mêtis</strong>! Solo falta confirmar que <strong style=\"color:#171A3A\">{{ .Email }}</strong> es tu correo. Con un clic tu cuenta queda lista y entras directo a tu portal.",
        "button": "Confirmar mi correo",
        "url": "{{ .ConfirmationURL }}",
        "note": "Este enlace vence en 24 horas. " + SAFE,
    },
    {
        "file": "2-invitacion.html",
        "supabase": "Invite user",
        "subject": "Te invitaron a mêtis",
        "preheader": "Tu equipo ya mide sus objetivos en mêtis. Acepta tu invitación.",
        "title": "Te invitaron a mêtis",
        "body": "Tu equipo usa <strong style=\"color:#171A3A\">mêtis</strong> para alinear sus objetivos, KPIs y proyectos en un solo lugar. Acepta la invitación para ver tu scorecard y cargar tus resultados cada mes.",
        "button": "Aceptar invitación",
        "url": "{{ .ConfirmationURL }}",
        "note": "Esta invitación vence en 24 horas. Si no esperabas este correo, puedes ignorarlo.",
    },
    {
        "file": "3-enlace-de-acceso.html",
        "supabase": "Magic Link",
        "subject": "Tu enlace para entrar a mêtis",
        "preheader": "Entra con un clic, sin contraseña.",
        "title": "Tu enlace para entrar",
        "body": "Recibimos una solicitud para entrar a <strong style=\"color:#171A3A\">mêtis</strong> con <strong style=\"color:#171A3A\">{{ .Email }}</strong>. Da clic en el botón y entras directo, sin contraseña.",
        "button": "Entrar a mêtis",
        "url": "{{ .ConfirmationURL }}",
        "note": "Por seguridad, este enlace sirve una sola vez y vence en 1 hora. " + SAFE,
    },
    {
        "file": "4-cambio-de-correo.html",
        "supabase": "Change Email Address",
        "subject": "Confirma tu nuevo correo en mêtis",
        "preheader": "Confirma el cambio para seguir entrando sin problema.",
        "title": "Confirma tu nuevo correo",
        "body": "Pediste cambiar el correo de tu cuenta de <strong style=\"color:#171A3A\">{{ .Email }}</strong> a <strong style=\"color:#171A3A\">{{ .NewEmail }}</strong>. Confirma el cambio y a partir de ahora entrarás con el nuevo.",
        "button": "Confirmar cambio",
        "url": "{{ .ConfirmationURL }}",
        "note": "Si no pediste este cambio, ignora este correo y tu correo actual seguirá funcionando. Si crees que alguien más intentó hacerlo, escríbenos a " + CONTACT + ".",
    },
    {
        "file": "5-restablecer-contrasena.html",
        "supabase": "Reset Password",
        "subject": "Restablece tu acceso a mêtis",
        "preheader": "Crea una nueva contraseña en un minuto.",
        "title": "Restablece tu acceso",
        "body": "Recibimos una solicitud para restablecer el acceso de <strong style=\"color:#171A3A\">{{ .Email }}</strong>. Da clic en el botón para continuar.",
        "button": "Restablecer acceso",
        "url": "{{ .ConfirmationURL }}",
        "note": "Este enlace vence en 1 hora. " + SAFE,
    },
    {
        "file": "6-codigo-de-verificacion.html",
        "supabase": "Reauthentication",
        "subject": "Tu código de verificación de mêtis",
        "preheader": "Usa este código para confirmar que eres tú.",
        "title": "Confirma que eres tú",
        "body": "Para completar esta acción en <strong style=\"color:#171A3A\">mêtis</strong>, escribe este código:"
                "<div style=\"margin:20px 0 4px;padding:18px 0;text-align:center;background:#EEF0FD;border-radius:14px;font-family:'SF Mono',Menlo,Consolas,monospace;font-size:32px;letter-spacing:10px;font-weight:700;color:#4F3FE0\">{{ .Token }}</div>",
        "button": None,
        "url": None,
        "note": "El código vence en pocos minutos. " + SAFE,
    },
]


def main() -> None:
    out = Path(__file__).parent
    previews = []
    for t in TEMPLATES:
        html = layout(t["preheader"], t["title"], t["body"], t["button"], t["url"], t["note"])
        (out / t["file"]).write_text(html, encoding="utf-8")
        demo = (html.replace("{{ .ConfirmationURL }}", SITE + "/auth/confirm?token=ejemplo")
                    .replace("{{ .Email }}", "oziel@empresa.mx").replace("{{ .NewEmail }}", "oziel.nuevo@empresa.mx")
                    .replace("{{ .Token }}", "482913"))
        srcdoc = demo.replace("&", "&amp;").replace('"', "&quot;")
        previews.append(f'<section><h2>{t["supabase"]}</h2><p><b>Asunto:</b> {t["subject"]} &nbsp;·&nbsp; <b>Archivo:</b> {t["file"]}</p>'
                        f'<iframe srcdoc="{srcdoc}"></iframe></section>')
    (out / "vista-previa.html").write_text(
        "<!DOCTYPE html><html lang='es'><meta charset='utf-8'><title>mêtis · correos</title>"
        "<style>body{font-family:Arial,sans-serif;background:#e9ebf3;margin:0;padding:24px;color:#171A3A}"
        "main{display:grid;grid-template-columns:repeat(auto-fill,minmax(520px,1fr));gap:24px}"
        "section{background:#fff;border-radius:16px;padding:16px}h2{margin:0 0 4px;font-size:16px}p{margin:0 0 10px;font-size:13px;color:#475569}"
        "iframe{width:100%;height:660px;border:1px solid #E8EAF4;border-radius:12px}</style>"
        "<h1 style='font-size:20px'>Plantillas de correo de mêtis</h1><main>" + "".join(previews) + "</main></html>",
        encoding="utf-8")
    # Guía de asuntos para copiar
    lines = ["# Asuntos para Supabase → Authentication → Emails\n"]
    for t in TEMPLATES:
        lines.append(f"- **{t['supabase']}** → archivo `{t['file']}` · asunto: `{t['subject']}`")
    (out / "ASUNTOS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
