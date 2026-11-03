// ==========================================
// STOQR - Logica principal
// ==========================================

// -- DATOS BASE --
const productDB = [
    { code: 'V-M1',  name: 'Vestido floral',     cat: 'Vestidos',   size: 'M',  price: 750,  stock: 15, maxStock: 30 },
    { code: 'B-L1',  name: 'Blusa Lino',         cat: 'Blusas',     size: 'L',  price: 340,  stock: 2,  maxStock: 20 },
    { code: 'P-M1',  name: 'Pantalon Mezclilla', cat: 'Pantalones', size: 'M',  price: 750,  stock: 12, maxStock: 25 },
    { code: 'C-CH1', name: 'Camisa de lino',     cat: 'Camisas',    size: 'CH', price: 420,  stock: 8,  maxStock: 20 },
    { code: 'F-L1',  name: 'Falda floral',       cat: 'Faldas',     size: 'L',  price: 380,  stock: 5,  maxStock: 15 },
];

let ventasData = [
    { id:'0001', prods:[{n:'Vestido floral M',q:2,p:750},{n:'Blusa Lino L',q:1,p:340}], fecha:'12/07/2026', metodo:'QR',      total:1840, estado:'COMPLETADO', notas:'' },
    { id:'0002', prods:[{n:'Pantalon Mezclilla M',q:1,p:750}],                          fecha:'11/07/2026', metodo:'Efectivo', total:750,  estado:'COMPLETADO', notas:'' },
    { id:'0003', prods:[{n:'Vestido floral M',q:1,p:750}],                              fecha:'10/07/2026', metodo:'Tarjeta',  total:750,  estado:'COMPLETADO', notas:'Cliente frecuente' },
    { id:'0004', prods:[{n:'Falda floral L',q:2,p:380}],                                fecha:'09/07/2026', metodo:'Efectivo', total:760,  estado:'COMPLETADO', notas:'' },
    { id:'0005', prods:[{n:'Camisa de lino CH',q:1,p:420}],                             fecha:'08/07/2026', metodo:'QR',       total:420,  estado:'COMPLETADO', notas:'' },
];

let gastosData = [
    { id: 'G-001', fecha: '10/07/2026', concepto: 'Lote de 50 Vestidos Florales', cat: 'Proveedores / Mercancia', monto: 8000, notas: 'Proveedor Textil MX' },
    { id: 'G-002', fecha: '08/07/2026', concepto: 'Bolsas Kraft y Etiquetas con logo', cat: 'Empaques y Envios', monto: 1200, notas: 'Para la nueva temporada' },
    { id: 'G-003', fecha: '05/07/2026', concepto: 'Publicidad en Instagram', cat: 'Marketing / Publicidad', monto: 800, notas: 'Campaña de verano' },
];

// ==========================================
// NAVEGACION
// ==========================================
function showView(id) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    document.querySelectorAll('.nav-item[data-target="' + id + '"]').forEach(n => n.classList.add('active'));
}

document.querySelectorAll('.nav-item[data-target]').forEach(item => {
    item.addEventListener('click', () => {
        showView(item.dataset.target);
        if (item.dataset.target === 'view-scanner')     renderQuickCodes();
        if (item.dataset.target === 'view-rendimiento') renderRendimiento();
        if (item.dataset.target === 'view-dashboard')   renderDashboard();
    });
});

// ==========================================
// DASHBOARD - Datos en tiempo real
// ==========================================
function renderDashboard() {
    // Calcular ingresos de ventas completadas
    const totalVentas = ventasData.reduce((sum, v) => v.estado === 'COMPLETADO' ? sum + v.total : sum, 0);
    const totalGastos = gastosData.reduce((sum, g) => sum + g.monto, 0);
    const ganancia = totalVentas - totalGastos;

    // Tarjetas del dashboard
    document.getElementById('dash-ventas-val').textContent = '$' + totalVentas.toLocaleString();
    document.getElementById('dash-stock-val').textContent = productDB.reduce((s, p) => s + p.stock, 0);
    document.getElementById('dash-gastos-val').textContent = '$' + totalGastos.toLocaleString();
    document.getElementById('dash-ganancia-val').textContent = '$' + ganancia.toLocaleString();

    const gananciaEl = document.getElementById('dash-ganancia-val');
    gananciaEl.style.color = ganancia < 0 ? '#e53935' : '#000';

    // Calcular las 3 prendas mas vendidas
    const prodVentas = {};
    ventasData.forEach(v => {
        if (v.estado === 'COMPLETADO') {
            v.prods.forEach(p => {
                const key = p.n;
                prodVentas[key] = (prodVentas[key] || 0) + p.q;
            });
        }
    });
    const sorted = Object.entries(prodVentas).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const medals = ['🥇','🥈','🥉'];
    const topList = document.getElementById('dash-top-prendas');
    if (topList) {
        topList.innerHTML = sorted.length > 0
            ? sorted.map((p, i) => `
                <div class="interactive-item" style="padding:12px 16px;">
                    <div style="font-size:22px;width:32px;text-align:center;">${medals[i]}</div>
                    <div style="flex:1;">
                        <p class="activity-title" style="font-size:14px;margin-bottom:2px;">${p[0]}</p>
                        <p class="activity-desc" style="font-size:12px;">${p[1]} unidades vendidas</p>
                    </div>
                </div>`).join('')
            : '<p style="color:#aaa;font-size:14px;padding:16px;text-align:center;">Sin ventas registradas aun</p>';
    }
}

// ==========================================
// ESCANER QR
// ==========================================
let scanHistory = [], totalScans = 0, foundScans = 0, quickSales = 0, currentScanned = null;

function renderQuickCodes() {
    const grid = document.getElementById('quickCodesGrid');
    if (!grid) return;
    grid.innerHTML = '';
    productDB.forEach(p => {
        const chip = document.createElement('button');
        chip.className = 'qcode-chip';
        chip.title = p.name + ' - $' + p.price.toLocaleString();
        chip.innerHTML = '<span class="chip-code">' + p.code + '</span><span class="chip-name">' + p.name.split(' ')[0] + '</span>';
        chip.onclick = () => {
            document.querySelectorAll('.qcode-chip').forEach(c => c.classList.remove('active-chip'));
            chip.classList.add('active-chip');
            document.getElementById('scanInput').value = p.code;
            processScan(p.code);
            document.getElementById('scanInput').value = '';
        };
        grid.appendChild(chip);
    });
}

function findProduct(code) {
    return productDB.find(p => p.code.toLowerCase() === code.toLowerCase().trim()) || null;
}

function doScan() {
    const code = document.getElementById('scanInput').value.trim();
    if (!code) return;
    processScan(code);
    document.getElementById('scanInput').value = '';
}

function doRandomScan() {
    const randomCodes = [...productDB.map(p => p.code), 'XX-999', 'YY-000'];
    const code = randomCodes[Math.floor(Math.random() * randomCodes.length)];
    document.getElementById('scanInput').value = code;
    setTimeout(() => { processScan(code); document.getElementById('scanInput').value = ''; }, 200);
}

function processScan(code) {
    totalScans++;
    const product = findProduct(code);
    const now = new Date();
    const timeStr = String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0') + ':' + String(now.getSeconds()).padStart(2,'0');
    const viewfinder = document.getElementById('scannerViewfinder');
    viewfinder.classList.remove('found');

    if (product) {
        foundScans++;
        currentScanned = product;
        setTimeout(() => viewfinder.classList.add('found'), 50);
        document.getElementById('scannerWaiting').style.display = 'none';
        document.getElementById('notFoundCard').classList.remove('visible');
        document.getElementById('pf-name').textContent  = product.name;
        document.getElementById('pf-code').textContent  = 'Codigo: ' + product.code;
        document.getElementById('pf-cat').textContent   = product.cat;
        document.getElementById('pf-size').textContent  = product.size;
        document.getElementById('pf-price').textContent = '$' + product.price.toLocaleString();
        document.getElementById('pf-stock').textContent = product.stock + ' uds';
        const pct = Math.round((product.stock / product.maxStock) * 100);
        document.getElementById('pf-stock-pct').textContent = pct + '%';
        const fill = document.getElementById('pf-stock-bar');
        fill.style.width = pct + '%';
        fill.style.background = pct <= 20 ? '#ef5350' : pct <= 50 ? '#fb8c00' : '#43a047';
        document.getElementById('productFoundCard').classList.add('visible');
        showToast(product.name + ' encontrado', 'success');
        addToHistory(code, product.name, true, timeStr);
    } else {
        currentScanned = null;
        document.getElementById('scannerWaiting').style.display = 'none';
        document.getElementById('productFoundCard').classList.remove('visible');
        document.getElementById('not-found-code').textContent = 'Codigo "' + code + '" no existe en el inventario.';
        document.getElementById('notFoundCard').classList.add('visible');
        showToast('Codigo "' + code + '" no encontrado', 'error');
        addToHistory(code, null, false, timeStr);
    }
    updateScanStats();
}

function addToHistory(code, name, found, time) {
    scanHistory.unshift({ code, name, found, time });
    if (scanHistory.length > 20) scanHistory.pop();
    renderHistory();
}

function renderHistory() {
    const card = document.getElementById('scanHistoryCard');
    const list = document.getElementById('scanHistoryList');
    card.style.display = 'block';
    list.innerHTML = '';
    scanHistory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'scan-history-item';
        div.innerHTML = '<div class="scan-dot ' + (item.found ? 'found' : 'not-found') + '"></div><div class="scan-history-info"><div class="scan-history-code">' + item.code + '</div><div class="scan-history-name">' + (item.found ? item.name : 'No encontrado') + '</div></div><div class="scan-history-time">' + item.time + '</div>';
        if (item.found) div.onclick = () => { document.getElementById('scanInput').value = item.code; doScan(); };
        list.appendChild(div);
    });
}

function clearHistory() {
    scanHistory = [];
    document.getElementById('scanHistoryCard').style.display = 'none';
}

function updateScanStats() {
    document.getElementById('stat-total-scans').textContent = totalScans;
    document.getElementById('stat-found').textContent = foundScans;
    document.getElementById('stat-sales').textContent = quickSales;
}

// ==========================================
// VENTA RAPIDA QR
// ==========================================
function openQuickSale() {
    if (!currentScanned) return;
    document.getElementById('qs-name').textContent  = currentScanned.name;
    document.getElementById('qs-code').textContent  = 'Codigo: ' + currentScanned.code;
    document.getElementById('qs-price').textContent = '$' + currentScanned.price.toLocaleString();
    document.getElementById('qs-qty').value = 1;
    updateQSTotal();
    document.getElementById('quickSaleModal').style.display = 'flex';
}

function updateQSTotal() {
    if (!currentScanned) return;
    const qty = parseInt(document.getElementById('qs-qty').value) || 1;
    document.getElementById('qs-total').textContent = '$' + (qty * currentScanned.price).toLocaleString();
}

function confirmQuickSale() {
    if (!currentScanned) return;
    const qty   = parseInt(document.getElementById('qs-qty').value) || 1;
    const metodo = document.getElementById('qs-metodo').value;
    const total  = qty * currentScanned.price;
    const now    = new Date();
    const fecha  = String(now.getDate()).padStart(2,'0') + '/' + String(now.getMonth()+1).padStart(2,'0') + '/' + now.getFullYear();
    const id     = String(ventasData.length + 1).padStart(4,'0');
    ventasData.push({ id, prods:[{ n: currentScanned.name + ' ' + currentScanned.size, q: qty, p: currentScanned.price }], fecha, metodo, total, estado: 'COMPLETADO', notas: 'Venta rapida QR' });
    currentScanned.stock = Math.max(0, currentScanned.stock - qty);
    document.getElementById('pf-stock').textContent = currentScanned.stock + ' uds';
    const pct = Math.round((currentScanned.stock / currentScanned.maxStock) * 100);
    document.getElementById('pf-stock-pct').textContent = pct + '%';
    document.getElementById('pf-stock-bar').style.width = pct + '%';
    quickSales++;
    updateScanStats();
    renderVentasTable();
    updateVentasSummary();
    renderDashboard();
    closeModal('quickSaleModal');
    showToast('Venta #' + id + ' - $' + total.toLocaleString() + ' registrada', 'success');
}

// ==========================================
// INVENTARIO
// ==========================================
let rowToDelete = null;

function showDeleteModal(btn) {
    rowToDelete = btn.closest('tr');
    document.getElementById('deleteModal').style.display = 'flex';
}

function confirmDelete() {
    if (rowToDelete) { rowToDelete.remove(); rowToDelete = null; }
    closeModal('deleteModal');
}

function toggleEdit(btn) {
    const row = btn.closest('tr');
    const cells = row.querySelectorAll('td');
    const isEditing = btn.dataset.editing === 'true';
    if (!isEditing) {
        [0,1,3,5].forEach(i => {
            const val = cells[i].textContent.trim();
            cells[i].innerHTML = '<input class="inline-input" value="' + val + '">';
        });
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';
        btn.dataset.editing = 'true';
        btn.style.color = '#43a047';
    } else {
        [0,1,3,5].forEach(i => {
            const input = cells[i].querySelector('input');
            if (input) cells[i].textContent = input.value;
        });
        btn.innerHTML = '<i class="fa-regular fa-pen-to-square"></i>';
        btn.dataset.editing = 'false';
        btn.style.color = '';
    }
}

function showLabel(name, code) {
    document.getElementById('label-modal-name').textContent = name;
    document.getElementById('label-modal-code').textContent = code;
    document.getElementById('labelModal').style.display = 'flex';
}

function generateCode(name) {
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
    return initials + '-' + Math.floor(Math.random() * 900 + 100);
}

function saveProduct() {
    const name  = document.getElementById('prod-name').value.trim();
    const cat   = document.getElementById('prod-cat').value.trim();
    const size  = document.getElementById('prod-size').value.trim();
    const price = document.getElementById('prod-price').value.trim();
    const qty   = document.getElementById('prod-qty').value.trim();
    if (!name) { alert('Ingresa el nombre del producto'); return; }
    const code = generateCode(name) + (size ? '-' + size.charAt(0) : '');
    document.getElementById('success-prod-name').textContent = name;
    document.getElementById('success-prod-code').textContent = code;
    document.getElementById('success-qr-code').textContent  = code;
    const tbody   = document.querySelector('#main-inventory-table tbody');
    const tr      = document.createElement('tr');
    const stockQty = parseInt(qty) || 0;
    const status  = stockQty <= 3 ? '<span class="status-pill bajo">Stock bajo</span>' : '<span class="status-pill normal">Stock normal</span>';
    tr.innerHTML  = '<td>' + name + '</td><td>' + (size||'-') + '</td><td>' + code + '</td><td>' + (cat||'-') + '</td><td>' + stockQty + ' unidades</td><td>' + (price||'$0') + '</td><td>' + status + '</td><td><button class="action-btn edit" onclick="toggleEdit(this)"><i class="fa-regular fa-pen-to-square"></i></button><button class="action-btn delete" onclick="showDeleteModal(this)"><i class="fa-regular fa-trash-can"></i></button><button class="action-btn" onclick="showLabel(\'' + name + '\',\'' + code + '\')" style="color:#9c27b0;"><i class="fa-solid fa-qrcode"></i></button></td>';
    tbody.appendChild(tr);
    productDB.push({ code, name, cat: cat||'Sin cat', size: size||'-', price: parseFloat((price||'0').replace(/[^0-9.]/g,'')), stock: stockQty, maxStock: Math.max(stockQty*2,20) });
    renderQuickCodes();
    showView('view-success-product');
}

function saveCategory() {
    const name = document.getElementById('new-cat-name').value.trim();
    if (!name) { alert('Ingresa el nombre de la categoria'); return; }
    const tbody = document.getElementById('inline-cat-body');
    const tr = document.createElement('tr');
    tr.innerHTML = '<td>' + name + '</td><td>0</td>';
    tbody.appendChild(tr);
    document.getElementById('new-cat-name').value = '';
    document.getElementById('inline-cat-list').style.display = 'block';
    showToast('Categoria guardada', 'success');
}

function toggleCategoriesList() {
    const el = document.getElementById('inline-cat-list');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// ==========================================
// VENTAS
// ==========================================
function openNuevaVenta() {
    document.getElementById('prod-rows-container').innerHTML = '';
    document.getElementById('nv-notas').value = '';
    addProdRow();
    updateNVTotal();
    document.getElementById('nuevaVentaModal').style.display = 'flex';
}

function addProdRow() {
    const container = document.getElementById('prod-rows-container');
    const div = document.createElement('div');
    div.className = 'prod-row';
    div.innerHTML = '<div><label>Producto</label><input type="text" placeholder="Nombre del producto" oninput="updateNVTotal()"></div><div><label>Cantidad</label><input type="number" value="1" min="1" oninput="updateNVTotal()"></div><div><label>Precio unit.</label><input type="number" value="0" min="0" oninput="updateNVTotal()"></div><button class="remove-prod-btn" onclick="this.closest(\'.prod-row\').remove();updateNVTotal();"><i class="fa-solid fa-xmark"></i></button>';
    container.appendChild(div);
}

function updateNVTotal() {
    let total = 0;
    document.querySelectorAll('.prod-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        total += (parseFloat(inputs[1].value)||0) * (parseFloat(inputs[2].value)||0);
    });
    document.getElementById('nv-total-display').textContent = '$' + total.toLocaleString();
    return total;
}

function guardarVenta() {
    const rows = document.querySelectorAll('.prod-row');
    if (!rows.length) { alert('Agrega al menos un producto'); return; }
    const prods = [];
    let total = 0;
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const n = inputs[0].value.trim() || 'Producto';
        const q = parseFloat(inputs[1].value) || 1;
        const p = parseFloat(inputs[2].value) || 0;
        prods.push({n,q,p});
        total += q * p;
    });
    const metodo = document.getElementById('nv-metodo').value;
    const estado = document.getElementById('nv-estado').value;
    const notas  = document.getElementById('nv-notas').value.trim();
    const now    = new Date();
    const fecha  = String(now.getDate()).padStart(2,'0') + '/' + String(now.getMonth()+1).padStart(2,'0') + '/' + now.getFullYear();
    const id     = String(ventasData.length + 1).padStart(4,'0');
    ventasData.push({ id, prods, fecha, metodo, total, estado, notas });
    closeModal('nuevaVentaModal');
    renderVentasTable();
    updateVentasSummary();
    renderDashboard();
    showToast('Venta #' + id + ' registrada - $' + total.toLocaleString(), 'success');
}

function renderVentasTable() {
    const tbody = document.getElementById('ventas-tbody');
    tbody.innerHTML = '';
    ventasData.forEach(v => {
        const prodsHtml   = v.prods.map(p => '<strong>' + p.n + '</strong> x' + p.q).join('<br>');
        const statusClass = v.estado === 'COMPLETADO' ? 'normal' : 'bajo';
        const prodsStr    = v.prods.map(p => p.n).join(' ').toLowerCase();
        const metodoBadge = v.metodo === 'QR'
            ? '<span class="method-badge"><i class="fa-solid fa-qrcode" style="color:var(--primary-blue);"></i> QR</span>'
            : v.metodo === 'Efectivo'
                ? '<span class="method-badge"><i class="fa-solid fa-money-bill-wave" style="color:#43a047;"></i> Efectivo</span>'
                : '<span class="method-badge"><i class="fa-solid fa-credit-card" style="color:#7b1fa2;"></i> ' + v.metodo + '</span>';
        const tr = document.createElement('tr');
        tr.dataset.estado = v.estado;
        tr.dataset.search = prodsStr;
        const prodsJSON = JSON.stringify(v.prods);
        tr.innerHTML = '<td style="font-weight:700;color:var(--primary-blue);">#' + v.id + '</td><td class="product-list-cell">' + prodsHtml + '</td><td>' + v.fecha + '</td><td>' + metodoBadge + '</td><td style="font-weight:700;">$' + v.total.toLocaleString() + '</td><td><span class="status-pill ' + statusClass + '">' + v.estado + '</span></td><td><button class="action-btn edit" title="Ver ticket" onclick=\'showTicket("' + v.id + '","' + v.fecha + '","' + v.metodo + '",' + prodsJSON + ',"' + v.notas + '")\'><i class="fa-solid fa-receipt"></i></button><button class="action-btn delete" onclick="showDeleteModal(this)"><i class="fa-regular fa-trash-can"></i></button></td>';
        tbody.appendChild(tr);
    });
}

function updateVentasSummary() {
    document.getElementById('total-ventas-count').textContent = ventasData.length;
    document.getElementById('total-ventas-amt').textContent   = '$' + ventasData.reduce((s,v) => s+v.total, 0).toLocaleString();
    document.getElementById('total-completadas').textContent  = ventasData.filter(v => v.estado === 'COMPLETADO').length;
}

function filterVentas() {
    const q   = document.getElementById('search-ventas').value.toLowerCase();
    const est = document.getElementById('filter-estado').value;
    document.querySelectorAll('#ventas-tbody tr').forEach(tr => {
        const matchQ = !q   || tr.dataset.search.includes(q);
        const matchE = !est || tr.dataset.estado === est;
        tr.style.display = matchQ && matchE ? '' : 'none';
    });
}

function showTicket(id, fecha, metodo, prods, notas) {
    document.getElementById('ticket-id').textContent     = '#' + id;
    document.getElementById('ticket-date').textContent   = fecha;
    document.getElementById('ticket-method').textContent = metodo;
    const tbody = document.querySelector('#ticket-items-table tbody');
    tbody.innerHTML = '';
    let total = 0;
    prods.forEach(p => {
        total += p.q * p.p;
        tbody.innerHTML += '<tr><td>' + p.n + '</td><td style="text-align:center">' + p.q + '</td><td style="text-align:right">$' + (p.q*p.p).toLocaleString() + '</td></tr>';
    });
    document.getElementById('ticket-total-amt').textContent = '$' + total.toLocaleString();
    if (notas) {
        document.getElementById('ticket-notes-block').style.display = 'block';
        document.getElementById('ticket-notes-text').textContent = notas;
    } else {
        document.getElementById('ticket-notes-block').style.display = 'none';
    }
    document.getElementById('ticketModal').style.display = 'flex';
}

// ==========================================
// GASTOS
// ==========================================
function renderGastos() {
    const tbody = document.getElementById('gasto-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    let total = 0;
    let cats = {};
    gastosData.forEach(g => {
        total += g.monto;
        cats[g.cat] = (cats[g.cat] || 0) + g.monto;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${g.fecha}</td>
                        <td style="font-weight:600;">${g.concepto}</td>
                        <td><span class="status-pill normal" style="background:#e3f2fd;color:#1551b5;">${g.cat}</span></td>
                        <td style="font-weight:700;color:#e53935;">-$${g.monto.toLocaleString()}</td>
                        <td style="color:#888;font-size:13px;">${g.notas || '-'}</td>
                        <td><button class="action-btn delete" onclick="deleteGasto('${g.id}')"><i class="fa-regular fa-trash-can"></i></button></td>`;
        tbody.appendChild(tr);
    });
    document.getElementById('gasto-total-mes').textContent = '$' + total.toLocaleString();
    document.getElementById('gasto-count').textContent = gastosData.length;
    let mayorCat = '-';
    let maxVal = 0;
    for (let c in cats) { if (cats[c] > maxVal) { maxVal = cats[c]; mayorCat = c; } }
    document.getElementById('gasto-cat-mayor').textContent = mayorCat;
}

function openGastoModal() {
    document.getElementById('gasto-fecha').valueAsDate = new Date();
    document.getElementById('gasto-concepto').value = '';
    document.getElementById('gasto-monto').value    = '';
    document.getElementById('gasto-notas').value    = '';
    document.getElementById('gastoModal').style.display = 'flex';
}

function saveGasto() {
    const concepto = document.getElementById('gasto-concepto').value.trim();
    const cat      = document.getElementById('gasto-cat').value;
    const monto    = parseFloat(document.getElementById('gasto-monto').value);
    const fechaVal = document.getElementById('gasto-fecha').value;
    if (!concepto || isNaN(monto) || monto <= 0) { alert('Por favor ingresa un concepto y monto validos.'); return; }
    const fechaStr = fechaVal ? new Date(fechaVal).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');
    gastosData.unshift({ id: 'G-' + Math.floor(Math.random()*10000), fecha: fechaStr, concepto, cat, monto, notas: document.getElementById('gasto-notas').value.trim() });
    closeModal('gastoModal');
    showToast('Gasto registrado con exito', 'success');
    renderGastos();
    renderDashboard();
}

function deleteGasto(id) {
    if(confirm('¿Seguro que deseas eliminar este gasto?')) {
        gastosData = gastosData.filter(g => g.id !== id);
        renderGastos();
        renderDashboard();
        showToast('Gasto eliminado', 'error');
    }
}

// ==========================================
// RENDIMIENTO
// ==========================================
let rendPieChartInst = null;
let rendBarChartInst = null;

function renderRendimiento() {
    let totalIngresos = 0;
    let ventasCount   = 0;
    const prodVentas  = {};
    ventasData.forEach(v => {
        if (v.estado === 'COMPLETADO') {
            totalIngresos += v.total;
            ventasCount++;
            v.prods.forEach(p => { prodVentas[p.n] = (prodVentas[p.n] || 0) + p.q; });
        }
    });
    const totalGastos = gastosData.reduce((s, g) => s + g.monto, 0);
    const utilidad    = totalIngresos - totalGastos;

    document.getElementById('rend-ingresos').textContent = '$' + totalIngresos.toLocaleString();
    document.getElementById('rend-gastos').textContent   = '$' + totalGastos.toLocaleString();
    const balanceEl   = document.getElementById('rend-balance');
    const balanceCard = document.getElementById('rend-balance-card');
    const balanceMsg  = document.getElementById('rend-balance-msg');
    balanceEl.textContent = '$' + utilidad.toLocaleString();
    if (utilidad < 0) {
        balanceCard.style.background = 'linear-gradient(135deg, #e53935 0%, #b71c1c 100%)';
        balanceMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Numeros rojos (Gastaste mas)';
    } else {
        balanceCard.style.background = 'linear-gradient(135deg, #1551b5 0%, #1e88e5 100%)';
        balanceMsg.innerHTML = '<i class="fa-solid fa-arrow-trend-up"></i> Negocio saludable';
    }

    let topProd = '-';
    let maxVentas = 0;
    const sortedProds = [];
    for (let p in prodVentas) {
        sortedProds.push({ name: p, qty: prodVentas[p] });
        if (prodVentas[p] > maxVentas) { maxVentas = prodVentas[p]; topProd = p; }
    }
    document.getElementById('rend-top-prod').textContent = maxVentas > 0 ? topProd : 'Sin ventas';
    sortedProds.sort((a, b) => b.qty - a.qty);
    const top5      = sortedProds.slice(0, 5);
    const barLabels = top5.map(p => p.name.length > 15 ? p.name.substring(0,15)+'...' : p.name);
    const barData   = top5.map(p => p.qty);

    const ctxPie = document.getElementById('rendPieChart');
    if (rendPieChartInst) rendPieChartInst.destroy();
    rendPieChartInst = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: ['Lo que vendiste', 'Lo que gastaste'],
            datasets: [{ data: [totalIngresos, totalGastos], backgroundColor: ['#1551b5', '#e53935'], borderWidth: 0, hoverOffset: 8 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter' } } } }, cutout: '65%', layout: { padding: 10 } }
    });

    const ctxBar = document.getElementById('rendBarChart');
    if (rendBarChartInst) rendBarChartInst.destroy();
    rendBarChartInst = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: barLabels.length > 0 ? barLabels : ['-'],
            datasets: [{ label: 'Prendas Vendidas', data: barData.length > 0 ? barData : [0], backgroundColor: '#ffc107', borderRadius: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0, font: { family: 'Inter' } } },
                x: { grid: { display: false }, ticks: { font: { family: 'Inter' } } }
            }
        }
    });
}

// ==========================================
// MODALES GENERALES
// ==========================================
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) { if (e.target === this) this.style.display = 'none'; });
});

// ==========================================
// TOAST NOTIFICACION
// ==========================================
let toastTimeout = null;
function showToast(msg, type) {
    const toast = document.getElementById('scanToast');
    toast.className = 'scan-toast ' + type;
    document.getElementById('scanToastMsg').textContent = msg;
    document.getElementById('scanToastIcon').className = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark';
    toast.classList.add('show');
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ==========================================
// DASHBOARD CHART (ventas mensuales)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('salesChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mar','Abr','May','Jun','Jul'],
            datasets: [{
                label: 'Ventas ($)',
                data: [12000, 18500, 22000, 30000, ventasData.reduce((s,v) => s+v.total, 0)],
                backgroundColor: 'rgba(21,81,181,0.15)',
                borderColor: '#1551b5',
                borderWidth: 2,
                borderRadius: 10,
                hoverBackgroundColor: 'rgba(21,81,181,0.3)'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: '#f0f0f0' }, ticks: { callback: v => '$' + v.toLocaleString() } },
                x: { grid: { display: false } }
            }
        }
    });

    // Inicializar todas las vistas
    renderDashboard();
    renderVentasTable();
    updateVentasSummary();
    renderGastos();
    renderQuickCodes();
    renderRendimiento();
});
