export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  try {
    let body = '';
    req.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const params = new URLSearchParams(body);
        const dataURL = params.get('dataURL');
        const filenameRaw = params.get('filename') || 'quiniela.png';

        if (!dataURL || !dataURL.startsWith('data:image/')) {
          res.statusCode = 400;
          res.end('Invalid dataURL');
          return;
        }

        const sanitizedFilename = filenameRaw.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const base64 = dataURL.split(',')[1];
        const buffer = Buffer.from(base64, 'base64');

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}"`);
        res.statusCode = 200;
        res.end(buffer);
      } catch (error) {
        console.error('download-image handler error', error);
        res.statusCode = 500;
        res.end('Server error');
      }
    });
  } catch (error) {
    console.error('download-image streaming error', error);
    res.statusCode = 500;
    res.end('Server error');
  }
}
