
export async function onRequestGet({ env }) {
  try {
    const result = await env.DB.prepare(`
      SELECT
        o.id,
        o.product_id,
        p.name AS product_name,
        o.store_id,
        s.name AS store_name,
        o.seller_name,
        o.product_url,
        o.price_clp,
        o.payment_method,
        o.price_other_methods_clp,
        o.shipping_clp,
        CASE
          WHEN o.shipping_clp IS NULL THEN NULL
          ELSE o.price_clp + o.shipping_clp
        END AS total_price_clp,
        o.availability,
        o.last_checked_at,
        o.created_at,
        o.updated_at
      FROM offers o
      INNER JOIN products p ON o.product_id = p.id
      INNER JOIN stores s ON o.store_id = s.id
      WHERE p.active = 1
        AND s.enabled = 1
      ORDER BY
        CASE WHEN o.shipping_clp IS NULL THEN 1 ELSE 0 END,
        total_price_clp ASC,
        o.updated_at DESC
    `).all();

    return Response.json({
      success: true,
      total: result.results.length,
      offers: result.results
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: "No fue posible consultar las ofertas."
    }, {
      status: 500
    });
  }
}
