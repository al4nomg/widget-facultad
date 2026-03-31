const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const CLOUD_NAME  = process.env.CLOUDINARY_CLOUD_NAME;
  const API_KEY     = process.env.CLOUDINARY_API_KEY;
  const API_SECRET  = process.env.CLOUDINARY_API_SECRET;

  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Variables de entorno de Cloudinary no configuradas' })
    };
  }

  const folder = event.queryStringParameters?.folder || 'economia_org';

  try {
    const expression = `folder:${folder}`;
    const searchBody = JSON.stringify({
      expression,
      sort_by: [{ created_at: 'desc' }],
      max_results: 100,
      with_field: ['context', 'tags'],
    });

    const credentials = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/search`,
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: searchBody,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: 'Error de Cloudinary', detail: err }),
      };
    }

    const data = await response.json();

    const archivos = (data.resources || []).map(r => {
      const ctx   = r.context?.custom || {};
      const desc  = ctx.desc  ? decodeURIComponent(ctx.desc)  : null;
      const fecha = ctx.fecha || r.created_at;
      const ext   = (r.format || r.public_id.split('.').pop() || 'bin').toLowerCase();
      const segmento = r.public_id.split('/').pop();
      const nombre   = r.format ? `${segmento}.${r.format}` : segmento;

      return {
        public_id:     r.public_id,
        nombre,
        ext,
        tipo:          ext.toUpperCase(),
        desc,
        size:          r.bytes || 0,
        fecha,
        url:           r.secure_url,
        resource_type: r.resource_type,
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ archivos }),
    };

  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message }),
    };
  }
};
