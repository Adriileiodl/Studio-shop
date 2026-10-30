const money = n => n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
let cart = JSON.parse(localStorage.getItem("buildstore-cart") || "[]");
let category = "Todos";
const grid=document.querySelector("#product-grid"), drawer=document.querySelector("#cart-drawer"), overlay=document.querySelector("#overlay");
function renderProducts(){
 const products=window.PRODUCTS.filter(p=>category==="Todos"||p.category===category);
 document.querySelector("#product-total").textContent=`${products.length} produtos`;
 grid.innerHTML=products.map(p=>`<article class="product"><div class="product-art" style="--art:${p.art};--glow:${p.glow}">${p.image?`<img src="${p.image}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover">`:`<span class="shape">${p.shape}</span>`}<span class="category">${p.category}</span></div><div class="product-info"><h3>${p.name}</h3><p>${p.description}</p><div class="product-bottom"><span class="price">${money(p.price)}<small class="usd-price">≈ $${p.priceUSD.toFixed(2)} USD</small></span><button class="add-button" data-add="${p.id}">Adicionar +</button></div></div></article>`).join("");
}
function renderCart(){
 const items=cart.map(row=>({...window.PRODUCTS.find(p=>p.id===row.id),qty:row.qty})).filter(p=>p.id);
 document.querySelector("#cart-count").textContent=cart.reduce((n,x)=>n+x.qty,0);
 document.querySelector("#cart-total").textContent=money(items.reduce((n,p)=>n+p.price*p.qty,0));
 document.querySelector("#cart-items").innerHTML=items.length?items.map(p=>`<div class="cart-row"><div><strong>${p.name} × ${p.qty}</strong><small>${money(p.price*p.qty)} · ≈ $${(p.priceUSD*p.qty).toFixed(2)} USD</small></div><button class="remove" data-remove="${p.id}">Remover</button></div>`).join(""):'<p class="empty">Seu carrinho está vazio.</p>';
 localStorage.setItem("buildstore-cart",JSON.stringify(cart));
}
function showCart(show){drawer.classList.toggle("show",show);overlay.classList.toggle("show",show)}
function toast(msg){const el=document.querySelector("#toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2300)}
document.addEventListener("click",e=>{
 const add=e.target.closest("[data-add]"); if(add){const id=add.dataset.add;const found=cart.find(x=>x.id===id);found?found.qty++:cart.push({id,qty:1});renderCart();toast("Build adicionada ao carrinho!");}
 const remove=e.target.closest("[data-remove]");if(remove){cart=cart.filter(x=>x.id!==remove.dataset.remove);renderCart();}
 const filter=e.target.closest("[data-category]");if(filter){category=filter.dataset.category;document.querySelectorAll(".filter").forEach(b=>b.classList.toggle("active",b===filter));renderProducts();}
});
document.querySelector("#open-cart").onclick=()=>showCart(true);
document.querySelector("#close-cart").onclick=()=>showCart(false);
overlay.onclick=()=>showCart(false);
document.querySelector("#checkout").onclick=()=>{
 if(!cart.length){toast("Adicione uma build antes de continuar.");return;}
 alert("Pedido preparado! O pagamento PIX ainda não está conectado. Antes de vender, configure um provedor de pagamento com confirmação por webhook e a entrega segura dos arquivos.");
};
document.querySelector("#year").textContent=new Date().getFullYear();
renderProducts();renderCart();