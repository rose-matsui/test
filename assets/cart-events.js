// On inital load
let sampleVariantIds = new Set();

(async function loadFreeSamplesCollection() {
  const collectionHandle = 'free-samples';
  const res = await fetch(`/collections/${collectionHandle}/products.json`);
  const data = await res.json();
  sampleVariantIds = new Set(data.products.map(p => p.variants[0].id));
  window.sampleVariantIds = sampleVariantIds;
})();

// This event fires whenever the cart is updated.
// This event is exposed when the ajax cart is enabled.
// The cart object is passed within the detail object.
document.addEventListener("cart:updated", async function (evt) {
  console.log("Cart updated");
  console.log(evt.detail.cart);

  const cart = evt.detail.cart;
});
