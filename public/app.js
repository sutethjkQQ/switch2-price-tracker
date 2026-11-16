const demo = [
 {id:1,name:"Nintendo Switch 2 – Consola base",category:"console",store:"Tienda de ejemplo",seller:"Vendedor directo (demo)",price:529990,old:599990,discount:12,shipping:"Despacho por confirmar",type:"Precio referencial de demostración",url:"#",verified:false},
 {id:2,name:"Nintendo Switch 2 + Mario Kart World",category:"bundle",store:"Comercio de ejemplo",seller:"Marketplace (demo)",price:589990,old:649990,discount:9,shipping:"Despacho por confirmar",type:"Bundle de demostración",url:"#",verified:false},
 {id:3,name:"Joy-Con 2 – Par",category:"accessory",store:"Tienda de ejemplo",seller:"Vendedor directo (demo)",price:99990,old:109990,discount:9,shipping:"Despacho por confirmar",type:"Accesorio de demostración",url:"#",verified:false},
 {id:4,name:"Nintendo Switch 2 – Edición especial",category:"edition",store:"Comercio de ejemplo",seller:"Vendedor por confirmar",price:629990,old:null,discount:0,shipping:"Despacho por confirmar",type:"Edición de demostración",url:"#",verified:false}
];
const $=id=>document.getElementById(id), money=n=>new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(n);
let settings=JSON.parse(localStorage.getItem("s2settings")||"{}");
$("target").value=settings.target??500000;
$("visual").checked=settings.visual??true;$("sound").checked=settings.sound??true;$("push").checked=settings.push??false;
$("interval").value=settings.interval??"5";
function toast(msg){$("toast").textContent=msg;$("toast").style.display="block";setTimeout(()=>$("toast").style.display="none",4500)}
function beep(){try{const c=new (window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=880;g.gain.value=.12;o.start();o.stop(c.currentTime+.22)}catch(e){}}
function alertDeal(item){if($("visual").checked)toast(`¡Precio objetivo! ${item.name}: ${money(item.price)}`);if($("sound").checked)beep();if($("push").checked&&"Notification"in window&&Notification.permission==="granted")new Notification("Oferta Switch 2 detectada",{body:`${item.name}: ${money(item.price)}`})}
function render(){let arr=[...demo],cat=$("category").value,sort=$("sort").value;if(cat!=="all")arr=arr.filter(x=>x.category===cat);arr.sort((a,b)=>sort==="discount"?b.discount-a.discount:sort==="recent"?b.id-a.id:a.price-b.price);
$("offers").innerHTML=arr.map(x=>`<article class="offer"><div><span class="tag">${x.category.toUpperCase()}</span><h3>${x.name}</h3><div class="meta">${x.store} · ${x.seller}</div><div class="meta">${x.shipping}</div><div class="deal">${x.type}</div></div><div class="price">${money(x.price)}${x.old?`<div class="old">${money(x.old)}</div>`:""}<div class="meta">${x.discount?`-${x.discount}%`:"Sin descuento verificado"}</div></div><a href="${x.url}" aria-label="Enlace de ejemplo">Enlace de compra no disponible en datos demo ↗</a></article>`).join("");
$("bestPrice").textContent="—";$("bestStore").textContent="No hay precios reales conectados";$("underTarget").textContent="—";$("productCount").textContent=arr.length+" (demo)"}
$("category").addEventListener("change",render);$("sort").addEventListener("change",render);
$("save").onclick=()=>{settings={target:+$("target").value,visual:$("visual").checked,sound:$("sound").checked,push:$("push").checked,interval:$("interval").value};localStorage.setItem("s2settings",JSON.stringify(settings));toast("Preferencias guardadas en este dispositivo.")};
$("test").onclick=()=>{beep();toast("Alerta de prueba: sonido y aviso visual activos.")};
$("push").addEventListener("change",async()=>{if($("push").checked&&"Notification"in window){let p=await Notification.requestPermission();if(p!=="granted"){$("push").checked=false;toast("No se concedió permiso para notificaciones.")}}});
if("serviceWorker"in navigator)navigator.serviceWorker.register("/sw.js").catch(()=>{});
render();
