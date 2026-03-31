exports.handler = async (event) => {
  if (event.httpMethod !== 'DELETE' && event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
  const API_KEY    = process.env.CLOUDINARY_API_KEY;
  const API_SECRET = process.env.CLOUDINARY_API_SECRET;

  const { public_id, resource_type = 'raw' } = JSON.parse(event.body || '{}');

  if (!public_id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Falta public_id' }) };
  }

  try {
    const credentials = Buffer.from(`${API_KEY}:${API_SECRET}`).toString('base64');

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resource_type}/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify({ public_id, invalidate: true }),
      }
    );

    const data = await res.json();
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(data),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
