/**
 * grid.js — Grilla de eventos con filtros.
 */
window.Grid = (() => {
  let _filter = 'all';
  let _cat    = 'Todos';

  function init() {
    _buildPills();
    build();
  }

  function _buildPills() {
    const el = document.getElementById('cat-pills');
    if (!el) return;
    el.innerHTML = CATEGORIES.map(c =>
      `<button class="cat-pill${c === 'Todos' ? ' active' : ''}" onclick="Grid.setCat('${c}')">${c}</button>`
    ).join('');
  }

  function setFilter(f) {
    _filter = f;
    ['all','bestSeller','recommended'].forEach(k => {
      document.getElementById(`f-${k}`)?.classList.toggle('active-filter', k === f);
    });
    build();
  }

  function setCat(cat) {
    _cat = cat;
    document.querySelectorAll('.cat-pill').forEach(p =>
      p.classList.toggle('active', p.textContent.trim() === cat)
    );
    build();
  }

  function toggleCats() {
    document.getElementById('cat-pills')?.classList.toggle('open');
  }

  function clearAll() {
    _filter = 'all'; _cat = 'Todos';
    const inp = document.getElementById('search-input');
    if (inp) inp.value = '';
    document.getElementById('search-clear')?.classList.add('hidden');
    document.getElementById('cat-pills')?.classList.remove('open');
    _buildPills();
    ['all','bestSeller','recommended'].forEach(k =>
      document.getElementById(`f-${k}`)?.classList.toggle('active-filter', k === 'all')
    );
    build();
  }

  function build() {
    const q     = (Search.getQuery() || '').toLowerCase();
    const items = _compute(q);
    _renderHeader(items.length, q);
    _renderGrid(items);
  }

  function _compute(q) {
    const seen  = new Set();
    const items = [];
    EVENTS.forEach(ev => {
      if (ev.status === 'expired') return;
      const matchCat  = _cat === 'Todos' || ev.category === _cat;
      const matchQ    = !q || [ev.city, ev.category, ev.venue||'', ev.tourName||''].some(v => v.toLowerCase().includes(q));
      const matchF    = _filter === 'bestSeller' ? ev.bestSeller : _filter === 'recommended' ? ev.recommended : true;
      if (!matchCat || !matchQ || !matchF) return;

      if (ev.tourName) {
        const key = `${ev.artistId}-${ev.tourName}`;
        if (seen.has(key)) return;
        seen.add(key);
        const dates = EVENTS.filter(e => e.artistId === ev.artistId && e.tourName === ev.tourName && e.status !== 'expired')
                            .sort((a, b) => new Date(a.date) - new Date(b.date));
        items.push({ type:'tour', artistId:ev.artistId, tourName:ev.tourName, dates });
      } else {
        items.push({ type:'event', ev });
      }
    });
    return items;
  }

  function _renderHeader(count, q) {
    const has = q || _cat !== 'Todos' || _filter !== 'all';
    const titleEl = document.getElementById('grid-title');
    const countEl = document.getElementById('grid-count');
    const clearEl = document.getElementById('clear-all-btn');
    if (titleEl) titleEl.textContent = has ? 'Resultados' : 'Eventos Destacados';
    if (clearEl) clearEl.classList.toggle('hidden', !has);
    if (countEl) {
      let html = `${count} resultado${count !== 1 ? 's' : ''}`;
      if (_cat !== 'Todos') html += ` en <span>${_cat}</span>`;
      if (q) html += ` · "<span>${q}</span>"`;
      countEl.innerHTML = html;
    }
  }

  function _renderGrid(items) {
    const grid = document.getElementById('events-grid');
    if (!grid) return;
    if (!items.length) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-icon">${Icons.search}</div><h3 class="empty-title">Sin resultados</h3><p class="empty-sub">¿Buscas un artista? Escríbelo y selecciónalo del menú.</p><button class="btn btn-ghost" onclick="Grid.clearAll()">Limpiar filtros</button></div>`;
      return;
    }
    grid.innerHTML = items.map(item =>
      item.type === 'tour' ? _tourCard(item) : _eventCard(item.ev)
    ).join('');
  }

  function _tourCard(item) {
    const first    = item.dates[0];
    const last     = item.dates[item.dates.length - 1];
    const cities   = item.dates.map(e => e.city);
    const minPrice = Math.min(...item.dates.map(e => Zones.getMinPrice(e.id)));
    const liked    = Profile.isLiked(first.id);
    const d1 = _fmt(first.date, {day:'numeric', month:'short'});
    const d2 = _fmt(last.date,  {day:'numeric', month:'short', year:'numeric'});

    return `
      <article class="card card--tour" onclick="Pages.openArtist('${item.artistId}')" role="button" tabindex="0">
        <div class="card-img">
          <img src="${first.image}" alt="${item.tourName}" loading="lazy"/>
          <div class="card-img-overlay"></div>
          <span class="badge badge--gira">Gira</span>
          <div class="badge--cities">${cities.slice(0,3).join(' · ')}${cities.length > 3 ? ` +${cities.length-3}` : ''}</div>
          <button class="like-btn${liked?' liked':''}" data-id="${first.id}"
            onclick="event.stopPropagation();Profile.toggleLike('${first.id}',this)" aria-label="Favorito">${liked ? Icons.heart : Icons.heartOutline}</button>
        </div>
        <div class="card-body">
          <p class="card-category card-category--tour">${first.category}</p>
          <h2 class="card-title">${item.tourName}</h2>
          <p class="card-artist">${first.artist}</p>
          <div class="card-meta">
            <div class="card-meta-row"><span class="meta-icon"></span>${d1} — ${d2}</div>
            <div class="card-meta-row"><span class="meta-icon"></span>${item.dates.length} ciudad${item.dates.length !== 1?'es':''}</div>
          </div>
          <div class="card-footer">
            <div><p class="price-from">Desde</p><p class="price-value">$${minPrice.toLocaleString()}</p></div>
            <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();Pages.openArtist('${item.artistId}')">Ver fechas</button>
          </div>
        </div>
      </article>`;
  }

  function _eventCard(ev) {
    const reviews  = ev.reviews || [];
    const liked    = Profile.isLiked(ev.id);
    const dateStr  = _fmt(ev.date, {weekday:'short', day:'numeric', month:'short', year:'numeric'});
    const location = ev.venue ? `${ev.venue}, ${ev.city}` : ev.city;
    const stars    = reviews.length ? _stars(reviews) : '';
    const minPrice = Zones.getMinPrice(ev.id);

    return `
      <article class="card card--event" onclick="Pages.openEvent('${ev.id}')" role="button" tabindex="0">
        <div class="card-img">
          <img src="${ev.image}" alt="${ev.title}" loading="lazy"/>
          <div class="card-img-overlay"></div>
          <div class="card-badges">
            ${ev.bestSeller ? '<span class="badge badge--top">Top</span>' : ''}
            ${ev.adultsOnly ? '<span class="badge badge--18">+18</span>' : ''}
          </div>
          ${ev.status === 'expired' ? '<div class="expired-overlay"><div class="expired-label">Caducado</div></div>' : ''}
          <button class="like-btn${liked?' liked':''}" data-id="${ev.id}"
            onclick="event.stopPropagation();Profile.toggleLike('${ev.id}',this)" aria-label="Favorito">${liked ? Icons.heart : Icons.heartOutline}</button>
        </div>
        <div class="card-body">
          <p class="card-category card-category--event">${ev.category}</p>
          <h2 class="card-title">${ev.title}</h2>
          <p class="card-artist">${ev.artist}</p>
          <div class="card-meta">
            <div class="card-meta-row"><span class="meta-icon"></span>${dateStr}</div>
            <div class="card-meta-row"><span class="meta-icon"></span>${location}</div>
          </div>
          ${stars}
          <div class="card-footer">
            <div><p class="price-from">Desde</p><p class="price-value">$${minPrice.toLocaleString()}</p></div>
            <button class="btn btn-primary btn-sm" ${ev.status==='expired'?'disabled':''}
              onclick="event.stopPropagation();Pages.handleBuy('${ev.id}')">Comprar</button>
          </div>
        </div>
      </article>`;
  }

  function _stars(reviews) {
    const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
    return `<div class="card-stars">
      ${[1,2,3,4,5].map(i => `<span class="star star--${i <= Math.round(avg)?'filled':'empty'}">${Icons.star}</span>`).join('')}
      <span class="star-count">(${reviews.length})</span>
    </div>`;
  }

  function _fmt(d, opts) { return new Date(d).toLocaleDateString('es-ES', opts); }

  return { init, build, setFilter, setCat, toggleCats, clearAll };
})();
