
export async function onRequestGet({ env }) {
  try {
    const result = await env.DB.prepare(
      `SELECT
        id,
        name,
        website_url,
        country,
        enabled
      FROM stores
      WHERE enabled = 1
      ORDER BY name ASC`
    ).all();

    return Response.json({
      success: true,
      total: result.results.length,
      stores: result.results
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: "No fue posible consultar las tiendas."
    }, {
      status: 500
    });
  }
}
