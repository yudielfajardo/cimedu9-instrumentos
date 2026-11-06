// Recibe solicitudes de acceso y crea un issue privado en el repo de GitHub.
// Variables de entorno en Vercel:
//   GITHUB_TOKEN  token de grano fino con permiso Issues: read/write solo en este repo
//   GITHUB_REPO   yudielfajardo/cimedu9-instrumentos

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Campo trampa: si un bot lo llena, respondemos ok sin guardar nada.
  if (body.website) {
    return res.status(200).json({ ok: true });
  }

  const institucion = String(body.institucion || '').trim().slice(0, 120);
  const whatsapp = String(body.whatsapp || '').trim().slice(0, 20);
  const digitos = whatsapp.replace(/\D/g, '');

  if (institucion.length < 2) {
    return res.status(400).json({ error: 'Escribe el nombre de la institución.' });
  }
  if (digitos.length < 10 || digitos.length > 15) {
    return res.status(400).json({ error: 'Escribe un WhatsApp válido, con lada.' });
  }

  const repo = process.env.GITHUB_REPO;
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !token) {
    return res.status(500).json({ error: 'El servicio no está configurado. Avisa al equipo.' });
  }

  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'cimedu9-instrumentos',
      },
      body: JSON.stringify({
        title: `Acceso: ${institucion}`,
        body: `**Institución:** ${institucion}\n**WhatsApp:** ${whatsapp}\n**Recibido:** ${new Date().toISOString()}`,
      }),
    });

    if (!r.ok) {
      return res.status(502).json({ error: 'No se pudo guardar la solicitud. Intenta de nuevo.' });
    }
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: 'No se pudo guardar la solicitud. Intenta de nuevo.' });
  }
};
