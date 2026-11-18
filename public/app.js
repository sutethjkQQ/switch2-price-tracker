
const $ = id => document.getElementById(id);

const money = n =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(n);

const escapeHTML = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

let settings = JSON.parse(localStorage.getItem("s2settings") || "{}");
let products = [];
let offers = [];

$("target").value = settings.target ?? 500000;
$("visual").checked = settings.visual ?? true;
$("sound").checked = settings.sound ?? true;
$("push").checked = settings.push ?? false;
$("interval").value = settings.interval ?? "5";

function toast(message) {
  $("toast").textContent = message;
  $("toast").style.display = "block";
  setTimeout(() => {
    $("toast").style.display = "none";
  }, 4500);
}

function beep() {
  try {
    const audio = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.frequency.value = 880;
    gain.gain.value = 0.12;
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.22);
  } catch (error) {
    console.error("No fue posible reproducir la alerta:", error);
  }
}

function categoryOf(product) {
  const edition = (product.edition || "").toLowerCase();

  if (edition.includes("mario kart") || edition.includes("bundle")) {
    return "bundle";
  }

  if (edition.includes("edición especial")) {
    return "edition";
  }

  return "console";
}

function renderCard(product, offer) {
  const category = categoryOf(product);
  const hasOffer = Boolean(offer);
  const name = escapeHTML(product.name);
  const categoryName = {
    console: "CONSOLA",
    bundle: "BUNDLE",
    edition: "EDICIÓN ESPECIAL"
  }[category];

  if (!hasOffer) {
    return `
      <article class="offer">
        <div>
          <span class="tag">${categoryName}</span>
          <h3>${name}</h3>
          <div class="meta">${escapeHTML(product.edition)}</div>
          <div class="deal">Producto registrado · Sin ofertas disponibles todavía</div>
        </div>
        <div class="price">Sin precio registrado</div>
        <span class="meta">Esperando una oferta verificada</span>
      </article>
    `;
  }

  const store = escapeHTML(offer.store_name || offer.seller_name || "Tienda");
  const seller = escapeHTML(offer.seller_name || store);
  const debitPrice = money(offer.price_clp);

  const otherPrice = offer.price_other_methods_clp != null
    ? money(offer.price_other_methods_clp)
    : null;

  const shipping = offer.shipping_clp == null
    ? "Despacho por confirmar según destino"
    : offer.shipping_clp === 0
      ? "Despacho registrado: $0"
      : `Despacho: ${money(offer.shipping_clp)}`;

  const paymentMethod = offer.payment_method === "transferencia_debito"
    ? "Transferencia / débito"
    : escapeHTML(offer.payment_method || "Precio principal");

  const url = /^https?:\/\//i.test(offer.product_url || "")
    ? escapeHTML(offer.product_url)
    : null;

  const target = Number(product.target_price_clp);
  const belowTarget = Number.isFinite(target) &&
    target > 0 &&
    Number(offer.price_clp) <= target;

  return `
    <article class="offer">
      <div>
        <span class="tag">${categoryName}</span>
        <h3>${name}</h3>
        <div class="meta">${store} · ${seller}</div>
        <div class="meta">${shipping}</div>
        <div class="deal">${paymentMethod}</div>
        ${otherPrice ? `
          <div class="meta">Otros medios de pago: ${otherPrice}</div>
        ` : ""}
        ${belowTarget ? `
          <div class="deal">¡Está bajo el precio objetivo de ${money(target)}!</div>
        ` : ""}
      </div>
      <div class="price">
        ${debitPrice}
        <div class="meta">Transferencia / débito</div>
        ${offer.total_price_clp != null ? `
          <div class="meta">Total con despacho: ${money(offer.total_price_clp)}</div>
        ` : ""}
      </div>
      ${url
        ? `<a href="${url}" target="_blank" rel="noopener noreferrer">Ver producto en ${store} ↗</a>`
        : `<span class="meta">Enlace no disponible</span>`
      }
    </article>
  `;
}

function render() {
  const category = $("category").value;
  const sort = $("sort").value;

  let cards = products.flatMap(product => {
    const matchingOffers = offers.filter(
      offer => offer.product_id === product.id
    );

    if (matchingOffers.length === 0) {
      return [{ product, offer: null }];
    }

    return matchingOffers.map(offer => ({ product, offer }));
  });

  if (category !== "all") {
    cards = cards.filter(
      item => categoryOf(item.product) === category
    );
  }

  cards.sort((a, b) => {
    if (sort === "recent") {
      const dateA = a.offer?.last_checked_at || "";
      const dateB = b.offer?.last_checked_at || "";
      return dateB.localeCompare(dateA);
    }

    if (sort === "discount") {
      return 0;
    }

    const priceA = a.offer?.price_clp ?? Infinity;
    const priceB = b.offer?.price_clp ?? Infinity;
    return priceA - priceB;
  });

  $("offers").innerHTML = cards.length
    ? cards.map(item => renderCard(item.product, item.offer)).join("")
    : `<p class="meta">No hay productos en esta categoría.</p>`;

  const availableOffers = offers.filter(
    offer => Number.isFinite(Number(offer.price_clp))
  );

  if (availableOffers.length) {
    const best = availableOffers.reduce((a, b) =>
      Number(a.price_clp) <= Number(b.price_clp) ? a : b
    );

    $("bestPrice").textContent = money(best.price_clp);
    $("bestStore").textContent =
      best.store_name || best.seller_name || "Tienda";
  } else {
    $("bestPrice").textContent = "—";
    $("bestStore").textContent = "Sin ofertas registradas";
  }

  const target = Number($("target").value) || 0;

  const underTarget = availableOffers.filter(
    offer => target > 0 && Number(offer.price_clp) <= target
  ).length;

  $("underTarget").textContent = String(underTarget);
}

async function loadData() {
  $("statusText").textContent = "Conectando con la base de datos…";
  $("demoNotice").style.display = "none";

  try {
    const [productsResponse, offersResponse] = await Promise.all([
      fetch("/api/products", { cache: "no-store" }),
      fetch("/api/offers", { cache: "no-store" })
    ]);

    if (!productsResponse.ok || !offersResponse.ok) {
      throw new Error("No fue posible consultar las API.");
    }

    const productsData = await productsResponse.json();
    const offersData = await offersResponse.json();

    if (!productsData.success || !offersData.success) {
      throw new Error("Las API devolvieron un error.");
    }

    products = productsData.products || [];
    offers = offersData.offers || [];

    $("statusText").textContent =
      "Datos conectados · Base de datos real";

    render();

  } catch (error) {
    console.error("Error al cargar los datos:", error);

    $("statusText").textContent = "Error de conexión";
    $("demoNotice").style.display = "block";

    $("demoNotice").innerHTML =
      "<b>No fue posible cargar los datos reales.</b> Comprueba la conexión con las API e inténtalo nuevamente.";

    $("offers").innerHTML =
      '<p class="meta">No se pudieron cargar los productos. Intenta recargar la página.</p>';

    $("bestPrice").textContent = "—";
    $("bestStore").textContent = "Error de conexión";
    $("underTarget").textContent = "—";
  }
}

$("category").addEventListener("change", render);
$("sort").addEventListener("change", render);
$("target").addEventListener("input", render);

$("save").onclick = () => {
  settings = {
    target: Number($("target").value),
    visual: $("visual").checked,
    sound: $("sound").checked,
    push: $("push").checked,
    interval: $("interval").value
  };

  localStorage.setItem("s2settings", JSON.stringify(settings));
  toast("Preferencias guardadas en este dispositivo.");
};

$("test").onclick = () => {
  beep();
  toast("Alerta de prueba: sonido y aviso visual activos.");
};

$("push").addEventListener("change", async () => {
  if ($("push").checked && "Notification" in window) {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      $("push").checked = false;
      toast("No se concedió permiso para notificaciones.");
    }
  }
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(error => {
    console.error("Error al registrar el Service Worker:", error);
  });
}

loadData();
