export default async function handler(req, res) {
  const buf = Buffer.from('Hola, descarga OK desde Vercel.');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Length', buf.length);
  res.setHeader('Content-Disposition', 'attachment; filename="prueba.txt"');
  res.status(200).end(buf);
}
