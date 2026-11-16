
export async function onRequestGet({ env }) {
  try {
    const result = await env.DB.prepare(
      `SELECT
        id,
        name,
        category,
        model,
        edition,
        target_price_clp,
        active
      FROM products
      WHERE active = 1
      ORDER BY name ASC`
    ).all();

    return Response.json({
      success: true,
      total: result.results.length,
      products: result.results
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: "No fue posible consultar los productos."
    }, {
      status: 500
    });
  }
}
