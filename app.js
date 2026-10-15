/**
 * The Fresh Cup • Minimalist Menu Application
 * Usulután, El Salvador
 */

document.addEventListener('DOMContentLoaded', () => {
  // Ensure MENU_DATA is loaded
  if (typeof MENU_DATA === 'undefined') {
    console.error('MENU_DATA not found. Make sure menu-data.js is loaded before app.js.');
    return;
  }

  // --- State ---
  const state = {
    menu: MENU_DATA,
    activeCategory: null,
    searchQuery: '',
    selectedVariations: {}, // dishId -> selectedPriceIndex
    cart: JSON.parse(localStorage.getItem('tfc_cart') || '[]'),
    theme: localStorage.getItem('tfc_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    activeModalDish: null,
    modalVariationIndex: 0
  };

  // --- DOM Elements ---
  const topNav = document.getElementById('topNav');
  const themeToggle = document.getElementById('themeToggle');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const categoriesScroll = document.getElementById('categoriesScroll');
  const menuCategoriesContainer = document.getElementById('menuCategoriesContainer');
  const searchSummaryBanner = document.getElementById('searchSummaryBanner');
  const searchSummaryText = document.getElementById('searchSummaryText');
  const resetSearchBtn = document.getElementById('resetSearchBtn');
  const emptySearchState = document.getElementById('emptySearchState');
  const clearSearchActionBtn = document.getElementById('clearSearchActionBtn');

  // Cart DOM
  const cartTriggerBtn = document.getElementById('cartTriggerBtn');
  const cartCountBadge = document.getElementById('cartCountBadge');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartDrawerBackdrop = document.getElementById('cartDrawerBackdrop');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartDrawerCount = document.getElementById('cartDrawerCount');
  const cartItemsContainer = document.getElementById('cartItemsContainer');
  const orderNotesInput = document.getElementById('orderNotes');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartTotal = document.getElementById('cartTotal');
  const sendWhatsappBtn = document.getElementById('sendWhatsappBtn');
  const clearCartBtn = document.getElementById('clearCartBtn');
  const cartFooter = document.getElementById('cartFooter');

  // Floating Cart DOM
  const floatingCartBar = document.getElementById('floatingCartBar');
  const floatingCartOpenBtn = document.getElementById('floatingCartOpenBtn');
  const floatingCartCount = document.getElementById('floatingCartCount');
  const floatingCartTotal = document.getElementById('floatingCartTotal');

  // Modal DOM
  const dishModal = document.getElementById('dishModal');
  const dishModalBackdrop = document.getElementById('dishModalBackdrop');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalDishImg = document.getElementById('modalDishImg');
  const modalImageContainer = document.getElementById('modalImageContainer');
  const modalCategoryBadge = document.getElementById('modalCategoryBadge');
  const modalDishPrice = document.getElementById('modalDishPrice');
  const modalDishTitle = document.getElementById('modalDishTitle');
  const modalDishDescription = document.getElementById('modalDishDescription');
  const modalVariationsContainer = document.getElementById('modalVariationsContainer');
  const modalVariationsPills = document.getElementById('modalVariationsPills');
  const modalAddToCartBtn = document.getElementById('modalAddToCartBtn');
  const modalAddToCartLabel = document.getElementById('modalAddToCartLabel');

  // Toast
  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');

  // Footer Year
  const currentYearSpan = document.getElementById('currentYear');
  if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

  // --- Theme Management ---
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.theme = theme;
    localStorage.setItem('tfc_theme', theme);
  }
  applyTheme(state.theme);

  themeToggle.addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });

  // --- Category Tabs Rendering ---
  function renderCategoryTabs() {
    categoriesScroll.innerHTML = '';

    state.menu.categories.forEach((cat, index) => {
      const btn = document.createElement('button');
      btn.className = `category-tab-btn ${index === 0 ? 'active' : ''}`;
      btn.dataset.targetId = `cat-${cat.id}`;
      btn.innerHTML = `
        <span>${cat.name}</span>
        <span class="category-tab-count">(${cat.items.length})</span>
      `;

      btn.addEventListener('click', () => {
        document.querySelectorAll('.category-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // If search was active, clear it when clicking a category tab
        if (state.searchQuery) {
          searchInput.value = '';
          state.searchQuery = '';
          clearSearchBtn.style.display = 'none';
          renderMenu();
        }

        const section = document.getElementById(`cat-${cat.id}`);
        if (section) {
          const navOffset = 120;
          const sectionTop = section.getBoundingClientRect().top + window.scrollY - navOffset;
          window.scrollTo({ top: sectionTop, behavior: 'smooth' });
        }
      });

      categoriesScroll.appendChild(btn);
    });
  }

  // --- Setup ScrollSpy ---
  function setupScrollSpy() {
    const sections = document.querySelectorAll('.menu-category-section');
    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      if (state.searchQuery) return; // Don't scroll spy during search
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          const activeBtn = categoriesScroll.querySelector(`[data-target-id="${id}"]`);
          if (activeBtn) {
            document.querySelectorAll('.category-tab-btn').forEach(b => b.classList.remove('active'));
            activeBtn.classList.add('active');
            // Auto scroll category tabs horizontally
            activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        }
      });
    }, {
      rootMargin: '-20% 0px -70% 0px'
    });

    sections.forEach(s => observer.observe(s));
  }

  // --- Helper: Format Price ---
  function formatPrice(val) {
    if (typeof val !== 'number') return '$0.00';
    return `$${val.toFixed(2)}`;
  }

  // --- Helper: Clean Badges ---
  function getItemBadges(name) {
    const badges = [];
    if (name.includes('🔥') || name.toLowerCase().includes('más pedida')) {
      badges.push('Más Pedida');
    } else if (name.toLowerCase().includes('nena')) {
      badges.push('Especialidad');
    }
    return badges;
  }

  // --- Render Menu Items ---
  function renderMenu() {
    menuCategoriesContainer.innerHTML = '';
    const query = state.searchQuery.trim().toLowerCase();
    let totalVisibleItems = 0;

    state.menu.categories.forEach(cat => {
      // Filter items if searching
      const filteredItems = cat.items.filter(item => {
        if (!query) return true;
        const inName = item.name.toLowerCase().includes(query);
        const inDesc = item.description.toLowerCase().includes(query);
        const inCat = cat.name.toLowerCase().includes(query);
        return inName || inDesc || inCat;
      });

      if (filteredItems.length === 0) return;

      totalVisibleItems += filteredItems.length;

      // Section Wrapper
      const section = document.createElement('section');
      section.className = 'menu-category-section';
      section.id = `cat-${cat.id}`;

      // Section Header
      const header = document.createElement('div');
      header.className = 'category-header';
      header.innerHTML = `
        <h2 class="category-title">${cat.name}</h2>
        <span class="category-items-count">${filteredItems.length} ${filteredItems.length === 1 ? 'platillo' : 'platillos'}</span>
      `;
      section.appendChild(header);

      // Dishes Grid
      const grid = document.createElement('div');
      grid.className = 'dishes-grid';

      filteredItems.forEach(item => {
        // Init default variation index (0) if not set
        if (state.selectedVariations[item.id] === undefined) {
          state.selectedVariations[item.id] = 0;
        }

        const card = createDishCard(item, cat);
        grid.appendChild(card);
      });

      section.appendChild(grid);
      menuCategoriesContainer.appendChild(section);
    });

    // Handle search status banners
    if (query) {
      searchSummaryBanner.style.display = 'flex';
      searchSummaryText.textContent = `${totalVisibleItems} ${totalVisibleItems === 1 ? 'resultado' : 'resultados'} para "${query}"`;
    } else {
      searchSummaryBanner.style.display = 'none';
    }

    if (totalVisibleItems === 0) {
      emptySearchState.style.display = 'block';
    } else {
      emptySearchState.style.display = 'none';
    }

    setupScrollSpy();
  }

  // --- Create Single Dish Card ---
  function createDishCard(item, category) {
    const card = document.createElement('article');
    card.className = 'dish-card';
    card.dataset.dishId = item.id;

    const currentVarIndex = state.selectedVariations[item.id] || 0;
    const currentPriceObj = (item.prices && item.prices[currentVarIndex]) || { price: 0 };
    const badges = getItemBadges(item.name);

    // Media HTML (local image with fallback to online Firebase image)
    let mediaHtml = '';
    const imgSrc = item.localImage || item.image;
    const fallbackSrc = item.image;

    if (imgSrc) {
      mediaHtml = `
        <div class="dish-card-media" role="button" aria-label="Ver imagen completa de ${item.name}">
          <img src="${imgSrc}" alt="${item.name}" class="dish-img" loading="lazy" onerror="if(this.src !== '${fallbackSrc}'){this.src='${fallbackSrc}';}else{this.parentElement.style.display='none';}">
          ${badges.length ? `<span class="dish-badge-overlay">${badges[0]}</span>` : ''}
        </div>
      `;
    }

    // Variations HTML if item has multiple sizes
    let variationsHtml = '';
    if (item.prices && item.prices.length > 1) {
      variationsHtml = `
        <div class="dish-variations-group">
          <span class="variations-label">Porción / Tamaño:</span>
          <div class="variations-pills-row">
            ${item.prices.map((p, idx) => `
              <button type="button" class="var-pill ${idx === currentVarIndex ? 'active' : ''}" data-var-index="${idx}">
                <span>${p.label || 'Opción ' + (idx + 1)}</span>
                <span class="var-pill-price">${formatPrice(p.price)}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      ${mediaHtml}
      <div class="dish-card-body">
        <div class="dish-title-row">
          <h3 class="dish-title">${item.name}</h3>
        </div>
        ${item.description ? `<p class="dish-description">${item.description}</p>` : ''}
        ${variationsHtml}
        <div class="dish-card-footer">
          <div class="dish-price-box">
            <span class="price-main" data-price-display>${formatPrice(currentPriceObj.price)}</span>
            ${currentPriceObj.label ? `<span class="price-note">${currentPriceObj.label}</span>` : ''}
          </div>
          <button type="button" class="add-btn" aria-label="Añadir ${item.name} al pedido">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Añadir</span>
          </button>
        </div>
      </div>
    `;

    // Event: Click on image or title opens modal
    const mediaElem = card.querySelector('.dish-card-media');
    if (mediaElem) {
      mediaElem.addEventListener('click', () => openDishModal(item, category));
    }
    const titleElem = card.querySelector('.dish-title');
    if (titleElem) {
      titleElem.addEventListener('click', () => openDishModal(item, category));
    }

    // Event: Switch variation directly on card
    const varPills = card.querySelectorAll('.var-pill');
    varPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(pill.dataset.varIndex, 10);
        state.selectedVariations[item.id] = index;

        varPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        const selectedPrice = item.prices[index];
        const priceDisplay = card.querySelector('[data-price-display]');
        const priceNote = card.querySelector('.price-note');

        if (priceDisplay && selectedPrice) {
          priceDisplay.textContent = formatPrice(selectedPrice.price);
        }
        if (priceNote && selectedPrice) {
          priceNote.textContent = selectedPrice.label || '';
        }
      });
    });

    // Event: Add to cart
    const addBtn = card.querySelector('.add-btn');
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const varIdx = state.selectedVariations[item.id] || 0;
      addToCart(item, varIdx);
    });

    return card;
  }

  // --- Dish Modal Detail ---
  function openDishModal(item, category) {
    state.activeModalDish = item;
    const currentVarIdx = state.selectedVariations[item.id] || 0;
    state.modalVariationIndex = currentVarIdx;

    const imgSrc = item.localImage || item.image;
    if (imgSrc) {
      modalDishImg.src = imgSrc;
      modalDishImg.onerror = () => {
        if (item.image && modalDishImg.src !== item.image) {
          modalDishImg.src = item.image;
        } else {
          modalImageContainer.style.display = 'none';
        }
      };
      modalImageContainer.style.display = 'block';
    } else {
      modalImageContainer.style.display = 'none';
    }

    modalCategoryBadge.textContent = category?.name || 'The Fresh Cup';
    modalDishTitle.textContent = item.name;
    modalDishDescription.textContent = item.description || 'Platillo preparado al momento con los más frescos ingredientes seleccionados.';

    // Variations in modal
    if (item.prices && item.prices.length > 1) {
      modalVariationsContainer.style.display = 'block';
      modalVariationsPills.innerHTML = '';
      item.prices.forEach((p, idx) => {
        const pBtn = document.createElement('button');
        pBtn.type = 'button';
        pBtn.className = `var-pill ${idx === state.modalVariationIndex ? 'active' : ''}`;
        pBtn.innerHTML = `<span>${p.label || 'Opción ' + (idx + 1)}</span> <strong>${formatPrice(p.price)}</strong>`;
        pBtn.addEventListener('click', () => {
          state.modalVariationIndex = idx;
          state.selectedVariations[item.id] = idx;
          modalVariationsPills.querySelectorAll('.var-pill').forEach(b => b.classList.remove('active'));
          pBtn.classList.add('active');
          updateModalPriceDisplay(item);
        });
        modalVariationsPills.appendChild(pBtn);
      });
    } else {
      modalVariationsContainer.style.display = 'none';
    }

    updateModalPriceDisplay(item);

    dishModal.classList.add('active');
    dishModalBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function updateModalPriceDisplay(item) {
    const pObj = (item.prices && item.prices[state.modalVariationIndex]) || { price: 0 };
    modalDishPrice.textContent = formatPrice(pObj.price);
    modalAddToCartLabel.textContent = `Agregar al pedido • ${formatPrice(pObj.price)}`;
  }

  function closeDishModal() {
    dishModal.classList.remove('active');
    dishModalBackdrop.classList.remove('active');
    document.body.style.overflow = '';
    state.activeModalDish = null;
  }

  closeModalBtn.addEventListener('click', closeDishModal);
  dishModalBackdrop.addEventListener('click', closeDishModal);

  modalAddToCartBtn.addEventListener('click', () => {
    if (state.activeModalDish) {
      addToCart(state.activeModalDish, state.modalVariationIndex);
      closeDishModal();
    }
  });

  // --- Cart Management ---
  function addToCart(item, varIndex) {
    const priceObj = (item.prices && item.prices[varIndex]) || { price: 0, label: null };
    const cartItemId = `${item.id}_${varIndex}`;

    const existingIndex = state.cart.findIndex(c => c.cartItemId === cartItemId);

    if (existingIndex > -1) {
      state.cart[existingIndex].qty += 1;
    } else {
      state.cart.push({
        cartItemId: cartItemId,
        id: item.id,
        name: item.name,
        price: priceObj.price,
        variationLabel: priceObj.label || null,
        image: item.localImage || item.image || null,
        qty: 1
      });
    }

    saveCart();
    renderCart();
    showToast(`"${item.name}" añadido al pedido`);
  }

  function updateCartQty(cartItemId, delta) {
    const itemIndex = state.cart.findIndex(c => c.cartItemId === cartItemId);
    if (itemIndex === -1) return;

    state.cart[itemIndex].qty += delta;
    if (state.cart[itemIndex].qty <= 0) {
      state.cart.splice(itemIndex, 1);
    }

    saveCart();
    renderCart();
  }

  function clearCart() {
    state.cart = [];
    saveCart();
    renderCart();
    showToast('Pedido vaciado');
  }

  function saveCart() {
    localStorage.setItem('tfc_cart', JSON.stringify(state.cart));
    updateCartBadges();
  }

  function updateCartBadges() {
    const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Top Nav badge
    cartCountBadge.textContent = totalCount;
    cartDrawerCount.textContent = `${totalCount} ${totalCount === 1 ? 'producto' : 'productos'}`;

    // Floating bar on mobile
    if (totalCount > 0) {
      floatingCartBar.style.display = 'flex';
      floatingCartCount.textContent = totalCount;
      floatingCartTotal.textContent = formatPrice(subtotal);
    } else {
      floatingCartBar.style.display = 'none';
    }
  }

  function renderCart() {
    updateCartBadges();
    cartItemsContainer.innerHTML = '';

    if (state.cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="cart-empty-view">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-2z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <p>Tu orden está vacía</p>
          <span style="font-size:0.8rem; opacity:0.8;">Explora el menú y agrega tus hamburguesas y bebidas favoritas.</span>
        </div>
      `;
      cartFooter.style.display = 'none';
      return;
    }

    cartFooter.style.display = 'block';
    let subtotal = 0;

    state.cart.forEach(item => {
      const itemTotal = item.price * item.qty;
      subtotal += itemTotal;

      const row = document.createElement('div');
      row.className = 'cart-item-row';
      row.innerHTML = `
        <div class="cart-item-info">
          <h4 class="cart-item-name">${item.name}</h4>
          ${item.variationLabel ? `<span class="cart-item-option">${item.variationLabel}</span>` : ''}
          <div class="cart-item-price">${formatPrice(item.price)} c/u &bull; <strong>${formatPrice(itemTotal)}</strong></div>
        </div>
        <div class="cart-qty-controls">
          <button type="button" class="qty-btn minus-btn" aria-label="Restar una unidad">&minus;</button>
          <span class="qty-number">${item.qty}</span>
          <button type="button" class="qty-btn plus-btn" aria-label="Sumar una unidad">&plus;</button>
        </div>
      `;

      row.querySelector('.minus-btn').addEventListener('click', () => updateCartQty(item.cartItemId, -1));
      row.querySelector('.plus-btn').addEventListener('click', () => updateCartQty(item.cartItemId, 1));

      cartItemsContainer.appendChild(row);
    });

    cartSubtotal.textContent = formatPrice(subtotal);
    cartTotal.textContent = formatPrice(subtotal);
  }

  // --- Cart Drawer Open/Close ---
  function openCartDrawer() {
    renderCart();
    cartDrawer.classList.add('active');
    cartDrawerBackdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    cartDrawer.classList.remove('active');
    cartDrawerBackdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  cartTriggerBtn.addEventListener('click', openCartDrawer);
  floatingCartOpenBtn.addEventListener('click', openCartDrawer);
  closeCartBtn.addEventListener('click', closeCartDrawer);
  cartDrawerBackdrop.addEventListener('click', closeCartDrawer);
  clearCartBtn.addEventListener('click', clearCart);

  // --- Send WhatsApp Order ---
  sendWhatsappBtn.addEventListener('click', () => {
    if (state.cart.length === 0) return;

    const phoneNumber = '50376468648'; // Official The Fresh Cup WhatsApp
    const notes = (orderNotesInput.value || '').trim();
    const totalAmount = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    let message = `¡Hola *The Fresh Cup*! 👋🍔\nMe gustaría realizar el siguiente pedido desde el menú digital:\n\n`;

    state.cart.forEach(item => {
      const varText = item.variationLabel ? ` (${item.variationLabel})` : '';
      const totalItem = formatPrice(item.price * item.qty);
      message += `• *${item.qty}x* ${item.name}${varText} — ${totalItem}\n`;
    });

    message += `\n💰 *Total Estimado:* ${formatPrice(totalAmount)}`;

    if (notes) {
      message += `\n📝 *Notas:* ${notes}`;
    }

    message += `\n\n📍 *Ubicación del local:* 8va calle oriente #15, barrio La Parroquia, Usulután, Usulután`;
    message += `\nℹ️ *Nota:* Pedido sujeto a confirmación de disponibilidad. El envío, si aplica, se cotiza aparte.`;

    const encodedUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(encodedUrl, '_blank');
  });

  // --- Toast Notification ---
  let toastTimer = null;
  function showToast(msg) {
    toastMessage.textContent = msg;
    toastNotification.classList.add('active');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotification.classList.remove('active');
    }, 2400);
  }

  // --- Live Search Handlers ---
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    if (state.searchQuery.trim().length > 0) {
      clearSearchBtn.style.display = 'block';
    } else {
      clearSearchBtn.style.display = 'none';
    }
    renderMenu();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderMenu();
    searchInput.focus();
  });

  resetSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderMenu();
  });

  clearSearchActionBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.searchQuery = '';
    clearSearchBtn.style.display = 'none';
    renderMenu();
  });

  // --- Keyboard Shortcuts (Escape to close modals/drawers) ---
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (dishModal.classList.contains('active')) {
        closeDishModal();
      } else if (cartDrawer.classList.contains('active')) {
        closeCartDrawer();
      }
    }
  });

  // --- Initial Render ---
  renderCategoryTabs();
  renderMenu();
  renderCart();
});
