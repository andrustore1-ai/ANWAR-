/* Oskar mobile app polish + R14 direct invoice page/sync fixes - 2026-05-11 */
(function(){
  'use strict';
  if(window.__OSKAR_MOBILE_APP_POLISH_20260510__) return;
  window.__OSKAR_MOBILE_APP_POLISH_20260510__ = true;

  const TEAL = '#409898';
  const TEAL_DARK = '#2f8584';
  const TEAL_SOFT = '#e9f5f4';
  const STORAGE_PREFIX = 'oskar_persist_select:';

  function $(id){ return document.getElementById(id); }
  function qsa(sel,root){ return Array.from((root||document).querySelectorAll(sel)); }
  function safe(n){ return Number(n || 0) || 0; }
  function txt(v){ return String(v == null ? '' : v).trim(); }
  function esc(v){ return txt(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function hasFn(name){ return typeof window[name] === 'function' || (typeof globalThis[name] === 'function'); }
  function call(name){ try{ const fn = window[name] || globalThis[name]; return typeof fn === 'function' ? fn.apply(window, Array.prototype.slice.call(arguments,1)) : undefined; }catch(e){ console.warn(name,e); } }
  function getCollection(name){ try{ if(typeof collection === 'function') return collection(name); }catch(e){} try{ if(window.DB && Array.isArray(window.DB[name])) return window.DB[name]; }catch(e){} return []; }
  function moneySafe(n){ try{ if(typeof money2 === 'function') return money2(n); }catch(e){} try{ if(typeof money === 'function') return money(n); }catch(e){} return (safe(n).toFixed(2)); }
  function uidSafe(p){ try{ if(typeof uid === 'function') return uid(p); }catch(e){} return (p || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,7); }
  function nowSafe(){ try{ if(typeof nowText === 'function') return nowText(); }catch(e){} return new Date().toLocaleString('ar-EG',{hour12:false}); }
  function todaySafe(){ try{ if(typeof todayISO === 'function') return todayISO(); }catch(e){} return new Date().toISOString().slice(0,10); }
  function currentUserName(){ try{ return currentUser().name || 'مدير النظام'; }catch(e){ return 'مدير النظام'; } }
  function persistSafe(){ try{ if(typeof persist === 'function') return persist(); }catch(e){} try{ if(typeof saveDB === 'function' && typeof DB !== 'undefined') return saveDB(DB); }catch(e){} }
  function toastSafe(m){ try{ if(typeof toast === 'function') return toast(m); }catch(e){} alert(m); }
  function activeBranchSafe(){ try{ if(typeof activeBranch === 'function') return activeBranch(); }catch(e){} return $('branch')?.value || ''; }
  function sourceKeySafe(prefix,id){ try{ if(typeof sourceKey === 'function') return sourceKey(prefix,id); }catch(e){} return prefix + ':' + id; }
  function stockFactorSafe(item){ try{ if(typeof stockFactor === 'function') return stockFactor(item); }catch(e){} return safe(item.factor || 1) * safe(item.qty || 0); }
  function updateStockSafe(item,delta){ try{ if(typeof updateStock === 'function') return updateStock(item,delta); }catch(e){} const p = getCollection('products').find(x => String(x.id) === String(item.productId)); if(p){ p.stock = safe(p.stock) + safe(delta); getCollection('stockMovements').unshift({id:uidSafe('stk'),date:nowSafe(),type:delta<0?'صادر مخزون':'وارد مخزون',product:p.name,branch:activeBranchSafe(),qty:delta,note:item.name||''}); } }
  function addMovementSafe(accountId,type,amount,source,note,sourceId){ try{ if(typeof addMovement === 'function') return addMovement(accountId,type,amount,source,note,sourceId); }catch(e){} }
  function calcStatusSafe(total,paid,method){ try{ if(typeof calcStatus === 'function') return calcStatus(total,paid,method); }catch(e){} const due = Math.max(0,safe(total)-safe(paid)); if(due <= 0) return 'مدفوع'; if(method === 'تطبيق لاحق') return 'تطبيق لاحق'; return 'مستحق'; }
  function accountOptions(selected){
    const accounts = getCollection('accounts');
    return '<option value="">اختر الحساب</option>' + accounts.map(a => '<option value="'+esc(a.id)+'" '+(String(selected||'')===String(a.id)?'selected':'')+'>'+esc(a.name||a.id)+'</option>').join('');
  }
  function customerBy(id,name,phone){
    const cs = getCollection('customers');
    return cs.find(c => id && String(c.id)===String(id)) || cs.find(c => phone && txt(c.phone||c.mobile)===txt(phone)) || cs.find(c => name && txt(c.name)===txt(name));
  }
  function customerPhone(customer, fallback){ return txt(fallback || customer?.phone || customer?.mobile || customer?.whatsapp || ''); }
  function ensureCustomer(name, phone, id){
    name = txt(name); phone = txt(phone);
    let c = customerBy(id,name,phone);
    if(c){
      if(name && !c.name) c.name = name;
      if(phone && !customerPhone(c)) { c.phone = phone; c.mobile = phone; }
      return c;
    }
    if(name || phone){
      c = {id:uidSafe('cust'), name:name || ('عميل '+phone), phone, mobile:phone, createdAt:nowSafe(), createdBy:currentUserName(), source:'تلقائي من الفاتورة'};
      getCollection('customers').unshift(c);
      return c;
    }
    return null;
  }
  function methodDefaultName(method){
    if(method === 'نقدي') return 'زبون نقدي';
    if(method === 'تطبيق فوري') return 'زبون تطبيق';
    if(method === 'تحويل بنكي') return 'زبون تحويل';
    return '';
  }
  function isMandatoryCustomerMethod(method){ return method === 'تطبيق لاحق' || method === 'دين'; }
  function currentCart(){ try{ if(typeof cart !== 'undefined' && Array.isArray(cart)) return cart; }catch(e){} return Array.isArray(window.cart) ? window.cart : []; }
  function clearCart(){ const c = currentCart(); try{ c.splice(0,c.length); }catch(e){ try{ cart = []; }catch(_){} window.cart = []; } }

  function injectStyle(){
    if($('oskar-mobile-app-polish-style')) return;
    const st = document.createElement('style');
    st.id = 'oskar-mobile-app-polish-style';
    st.textContent = `
:root{--brand:${TEAL}!important;--brand2:${TEAL_DARK}!important;--ink:#263f4a!important;--soft:${TEAL_SOFT}!important;--bg:#f4f7f7!important;--line:#dfe9e9!important;--shadow:0 12px 28px rgba(47,133,132,.14)!important;--app-teal:${TEAL}!important;--app-teal-dark:${TEAL_DARK}!important}
html,body{background:#f4f7f7!important;color:#263f4a!important;overscroll-behavior-y:none}
meta[name="theme-color"]{content:${TEAL}!important}
.topbar{background:${TEAL}!important;background-image:none!important;height:58px!important;box-shadow:0 2px 0 rgba(47,133,132,.12)!important;color:#fff!important}
.drawer-brand{background:${TEAL}!important;background-image:none!important}.brand:before,.drawer-brand .dot{background:#dff7f5!important;box-shadow:none!important}.brand,.drawer-brand{color:#fff!important}
.icon-btn,.top-pill{background:rgba(255,255,255,.14)!important;border-color:rgba(255,255,255,.23)!important;color:#fff!important;border-radius:16px!important}
.card{background:#fff!important;border:1px solid var(--line)!important;border-radius:24px!important;box-shadow:0 10px 26px rgba(47,133,132,.09)!important}.card:before,.card:after,.kpi:before,.kpi:after{display:none!important;content:none!important}
.kpis{gap:14px!important}.kpi{position:relative!important;overflow:hidden!important;border:0!important;border-radius:14px!important;padding:18px 18px!important;min-height:118px!important;box-shadow:0 16px 32px rgba(47,133,132,.13)!important;background:${TEAL}!important;color:#fff!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important}.kpi span,.kpi strong{color:#fff!important}.kpi span{font-size:16px!important;font-weight:850!important;opacity:.94!important}.kpi strong{font-size:34px!important;line-height:1.1!important;margin-top:6px!important}.kpi.color-card,.kpi.blue,.kpi.green,.kpi.orange,.kpi.red,.kpi.purple-card,.profit-color-card{background-image:none!important}.kpi.blue{background:#4fa2d6!important}.kpi.green{background:#67ac5f!important}.kpi.orange{background:#df9547!important}.kpi.red{background:#d66767!important}.kpi.purple-card,#custKpi{background:${TEAL}!important}.kpi:hover{transform:none!important;filter:none!important}.kpi *{text-shadow:none!important}
.btn{border-radius:15px!important;font-weight:950!important;min-height:42px!important}.btn.primary,.btn.success,.btn.purple,.btn.dark{background:${TEAL}!important;background-image:none!important;color:#fff!important;box-shadow:0 10px 22px rgba(64,152,152,.20)!important}.btn.ghost{background:#fff!important;border:1px solid var(--line)!important;color:${TEAL_DARK}!important}.btn.danger{background:#fff0f0!important;color:#b91c1c!important;border:1px solid #fecaca!important}.btn.small{min-height:32px!important;border-radius:11px!important}
.menu-head{background:#eef6f6!important;border:1px solid #dae9e9!important;border-radius:18px!important;color:#304d56!important;font-weight:950!important}.menu-head .mi{background:${TEAL}!important;background-image:none!important;color:#fff!important;border-radius:14px!important}.submenu a:hover,.submenu a.active-link{background:#e6f3f2!important;color:${TEAL_DARK}!important}.sub-icon{background:#eef4f4!important;color:${TEAL_DARK}!important}.submenu a:hover .sub-icon,.submenu a.active-link .sub-icon{background:${TEAL}!important;color:#fff!important}
.bottom-nav{background:rgba(255,255,255,.97)!important;border:1px solid var(--line)!important;box-shadow:0 18px 46px rgba(47,133,132,.19)!important}.bottom-nav svg{stroke:${TEAL}!important}.bottom-nav a{color:#8a9aa1!important}.bottom-nav a.active{background:#e9f5f4!important;color:${TEAL}!important}.bottom-nav b{display:none!important}.bottom-nav a svg{width:24px!important;height:24px!important}.bottom-nav:not(.oskar-nav-ready){visibility:hidden!important}.ledger-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.ledger-section{margin-top:14px}.ledger-section h3{margin:12px 0 8px;color:#304d56}.debt-click-row{cursor:pointer}.debt-click-row:hover td{background:#f1faf9!important}.debt-customer-card{cursor:pointer}.oskar-ledger-print{background:#fff;color:#111;font-family:Cairo,Arial;padding:18px}.oskar-ledger-print table{width:100%;border-collapse:collapse}.oskar-ledger-print th,.oskar-ledger-print td{border:1px solid #ddd;padding:7px;text-align:right;font-size:12px}
.title-row{background:#fff!important;background-image:none!important;border:1px solid var(--line)!important;border-radius:24px!important;box-shadow:0 10px 24px rgba(47,133,132,.08)!important}.title-row h1{color:#304d56!important}
.table-toolbar{background:#fff!important;border:1px solid var(--line)!important;border-radius:20px!important;box-shadow:0 8px 20px rgba(47,133,132,.07)!important}.data-table th{background:#edf7f7!important;color:#304d56!important}.data-table tr:hover td{background:#f5fbfb!important}
.field{gap:8px!important}.field label{font-size:14px!important;font-weight:950!important;color:#6b8088!important;padding-inline:4px!important}input,select,textarea,.search{height:54px!important;border:0!important;border-radius:12px!important;background:#fff!important;color:#304d56!important;font-size:16px!important;font-weight:800!important;box-shadow:0 0 0 1px rgba(167,185,192,.45),0 8px 18px rgba(47,133,132,.06)!important;padding:0 16px!important;outline:none!important}textarea{height:auto!important;min-height:110px!important;padding-top:14px!important}input::placeholder,textarea::placeholder{color:#9aa9ae!important;font-weight:800!important}input:focus,select:focus,textarea:focus,.search:focus{box-shadow:0 0 0 2px ${TEAL}!important;border:0!important}.app-input-wrap{height:58px;display:flex;align-items:center;gap:12px;background:#fff;border-radius:12px;box-shadow:0 0 0 1px rgba(167,185,192,.45),0 8px 18px rgba(47,133,132,.06);padding:0 14px}.app-input-wrap input,.app-input-wrap select{box-shadow:none!important;background:transparent!important;height:54px!important;border-radius:0!important;padding:0!important;flex:1;min-width:0}.app-input-wrap .input-icon{width:30px;height:30px;color:#98a8ae;display:inline-flex;align-items:center;justify-content:center;flex:0 0 30px}.app-input-wrap .input-icon svg{width:28px;height:28px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}.form-section-title{color:#fff!important;font-size:23px!important;font-weight:950!important}
.product-card,.popular-card,.customer-card,.invoice-card,.debt-card,.debt-customer-card{border-radius:20px!important;border:1px solid var(--line)!important;box-shadow:0 10px 24px rgba(47,133,132,.09)!important;background:#fff!important}.debt-customer-card b{color:#304d56!important}.debt-total{color:#dc2626!important}.debt-paid-btn{white-space:nowrap!important;background:${TEAL}!important;color:white!important}.debt-paid-done{background:#e8f3f3!important;color:${TEAL_DARK}!important}.customer-search-results{z-index:999!important}.suggestions{position:absolute;left:0;right:0;top:100%;background:#fff;border:1px solid var(--line);border-radius:18px;box-shadow:0 18px 40px rgba(47,133,132,.18);padding:8px;z-index:120}.suggestions button{width:100%;border:0;background:#fff;border-radius:12px;text-align:right;padding:10px 12px;color:#304d56;font-weight:900}.suggestions button:hover{background:#eef7f7}
.modal{border-radius:24px!important}.modal-head{border-color:var(--line)!important}.modal-back,.smart-modal-back{backdrop-filter:blur(7px)!important;background:rgba(18,48,56,.55)!important}.toast{background:#234d55!important;border-color:rgba(255,255,255,.16)!important;color:#fff!important}
@media(max-width:900px){.page{padding:14px 10px 104px!important}.kpis{grid-template-columns:repeat(2,minmax(0,1fr))!important}.kpi{min-height:112px!important;padding:16px!important}.kpi strong{font-size:32px!important}.grid,.two-col-form{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important}.field[style*="grid-column:1/-1"],.full-row{grid-column:1/-1!important}.pos-layout{gap:12px!important}.product-results{grid-template-columns:repeat(2,minmax(0,1fr))!important}.cart-line{border-radius:18px!important;background:#fff!important}.topbar{height:56px!important}.drawer{width:82vw!important}.data-table{min-width:850px}.table-wrap{border-radius:18px!important}}
@media(max-width:430px){input,select,textarea,.search{font-size:15px!important}.kpi{min-height:104px!important}.kpi span{font-size:14px!important}.kpi strong{font-size:28px!important}.btn{font-size:13px!important;padding-inline:12px!important}}
@media print{.kpi{background:#fff!important;color:#111!important;box-shadow:none!important;border:1px solid #ddd!important}.kpi span,.kpi strong{color:#111!important}}
`;
    document.head.appendChild(st);
    qsa('meta[name="theme-color"]').forEach(m=>m.setAttribute('content',TEAL));
  }

  function userIcon(){ return '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'; }
  function phoneIcon(){ return '<svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>'; }
  function cardIcon(){ return '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>'; }
  function accountIcon(){ return '<svg viewBox="0 0 24 24"><path d="M3 10h18"/><path d="M5 10v10"/><path d="M19 10v10"/><path d="M12 10v10"/><path d="M2 20h20"/><path d="M12 3 3 8h18z"/></svg>'; }

  function installCustomerChooser(){
    const chooser = function(){
      return `<div class="field app-field customer-field" style="position:relative"><label>اسم العميل</label><div class="app-input-wrap"><span class="input-icon">${userIcon()}</span><input id="customerText" autocomplete="off" placeholder="اكتب اسم العميل" oninput="suggestCustomers(this.value)"><input type="hidden" id="customerId"><div id="customerSuggest" class="suggestions hide"></div></div></div><div class="field app-field"><label>رقم الجوال</label><div class="app-input-wrap"><span class="input-icon">${phoneIcon()}</span><input id="customerPhone" inputmode="tel" autocomplete="tel" placeholder="رقم جوال العميل"></div></div>`;
    };
    window.customerChooserHTML = chooser;
    try{ customerChooserHTML = chooser; }catch(e){}
    window.suggestCustomers = function(q){
      const box = $('customerSuggest'); if(!box) return;
      q = txt(q); if(q.length < 1){ box.classList.add('hide'); box.innerHTML=''; return; }
      const low = q.toLowerCase();
      const rows = getCollection('customers').filter(c => [c.name,c.phone,c.mobile].join(' ').toLowerCase().includes(low)).slice(0,10);
      if(!rows.length){
        box.innerHTML = '';
        box.classList.add('hide');
        return;
      }
      box.innerHTML = rows.map(c => `<button type="button" onclick="selectCustomer('${esc(c.id)}')"><b>${esc(c.name||'عميل')}</b><small class="muted"> ${esc(c.phone||c.mobile||'')}</small></button>`).join('');
      box.classList.remove('hide');
    };
    try{ suggestCustomers = window.suggestCustomers; }catch(e){}
    window.selectCustomer = function(id){
      const c = getCollection('customers').find(x => String(x.id) === String(id)); if(!c) return;
      if($('customerId')) $('customerId').value = c.id;
      if($('customerText')) $('customerText').value = c.name || '';
      if($('customerPhone')) $('customerPhone').value = c.phone || c.mobile || '';
      $('customerSuggest')?.classList.add('hide');
    };
    try{ selectCustomer = window.selectCustomer; }catch(e){}
  }

  function installPaymentHTML(){
    const payBox = function(){
      return `<div class="card payment-card"><h3>إضافة الدفع</h3><div class="grid"><div class="field"><label>الإجمالي</label><b id="grandTotal">0.00</b></div><div class="field"><label>المبلغ المدفوع</label><input id="payAmount" type="number" step="0.01" value="0" oninput="this.dataset.touched=1;renderCart()"></div><div class="field"><label>المدفوعة على</label><input type="date" id="paidDate" value="${todaySafe()}"></div><div class="field"><label>طريقة الدفع</label><div class="app-input-wrap"><span class="input-icon">${cardIcon()}</span><select id="paymentMethod"><option>نقدي</option><option>تطبيق فوري</option><option>تطبيق لاحق</option><option>دين</option><option>تحويل بنكي</option></select></div></div><div class="field"><label>حساب</label><div class="app-input-wrap"><span class="input-icon">${accountIcon()}</span><select id="accountId">${accountOptions('')}</select></div></div><div class="field"><label>ملاحظة الدفع</label><input id="paymentNote"></div><div class="field"><label>الرصيد المستحق</label><b id="dueAmount" style="color:#dc2626">0.00</b></div></div></div>`;
    };
    window.paymentBoxHTML = payBox;
    try{ paymentBoxHTML = payBox; }catch(e){}
  }

  function enforcePaymentRule(){
    const method = $('paymentMethod'); const paid = $('payAmount');
    if(!method || !paid) return;
    if(isMandatoryCustomerMethod(method.value)){
      paid.value = '0'; paid.dataset.touched = '1';
    }
  }

  function installSaleSave(){
    window.saveSaleLike = function(collectionName='sales', flags={}){
      const c = currentCart();
      if(!c.length){ toastSafe('أضف أصناف أولاً'); return; }
      const method = $('paymentMethod')?.value || 'نقدي';
      let paid = safe($('payAmount')?.value);
      if(isMandatoryCustomerMethod(method)) paid = 0;
      const total = Math.max(0, c.reduce((s,i)=>s+safe(i.total),0) - safe($('discountAmount')?.value) + safe($('shippingAmount')?.value));
      const due = Math.max(0,total-paid);
      const rawName = txt($('customerText')?.value);
      const rawPhone = txt($('customerPhone')?.value);
      const existingId = txt($('customerId')?.value);
      if(isMandatoryCustomerMethod(method) && (!rawName || !rawPhone)){
        toastSafe('طريقة الدفع '+method+' تتطلب إدخال اسم العميل ورقم الجوال');
        if(!rawName) $('customerText')?.focus(); else $('customerPhone')?.focus();
        return;
      }
      let customer = ensureCustomer(rawName, rawPhone, existingId);
      const finalName = rawName || customer?.name || methodDefaultName(method) || 'زبون';
      const finalPhone = rawPhone || customerPhone(customer,'');
      if((rawName || rawPhone) && !customer) customer = ensureCustomer(finalName, finalPhone, existingId);
      const account = $('accountId')?.value || 'cash-main';
      const rec = {
        id: uidSafe(collectionName), date: $('saleDate')?.value || todaySafe(), invoiceNo: $('invoiceNo')?.value || ('INV-'+Date.now()),
        customerId: customer?.id || '', customerName: finalName, customerPhone: finalPhone, branch: activeBranchSafe(),
        items: JSON.parse(JSON.stringify(c)), total, paid, due, paymentMethod: method, paymentStatus: calcStatusSafe(total,paid,method),
        accountId: account, note: $('paymentNote')?.value || '', deliveryStatus: $('deliveryStatus')?.value || '',
        createdBy: currentUserName(), kind: flags.quotation ? 'عرض سعر' : flags.draft ? 'مسودة' : 'بيع'
      };
      getCollection(collectionName).unshift(rec);
      if(!flags.quotation && !flags.draft){
        if(paid > 0) addMovementSafe(account,'in',paid,'فاتورة بيع '+rec.invoiceNo,rec.note,sourceKeySafe('sale',rec.id));
        if(due > 0) window.addDebt('customer', customer?.id || '', finalName, due, method, rec.invoiceNo, sourceKeySafe('sale',rec.id), finalPhone);
        rec.items.forEach(i => updateStockSafe(i, -stockFactorSafe(i)));
      }
      try{ if(typeof logAction === 'function') logAction('حفظ',rec.kind,rec.invoiceNo); }catch(e){}
      persistSafe(); clearCart(); toastSafe('تم الحفظ');
      if(flags.print){ try{ printInvoice(rec); }catch(e){} }
      try{ if(typeof renderPage === 'function') renderPage(); }catch(e){}
      setTimeout(applySelectPrefs,60);
    };
    try{ saveSaleLike = window.saveSaleLike; }catch(e){}
  }

  function installDebtCore(){
    window.addDebt = function(partyType, partyId, partyName, amount, source, note, sourceId='', partyPhone=''){
      amount = safe(amount); if(amount <= 0) return;
      const c = customerBy(partyId,partyName,partyPhone);
      const phone = customerPhone(c,partyPhone);
      getCollection('debts').unshift({
        id:uidSafe('debt'), date:nowSafe(), partyType, partyId:partyId || c?.id || '', partyName:partyName || c?.name || 'عميل',
        partyPhone:phone, customerPhone:phone, amount, paid:0, remaining:amount, source, note, sourceId,
        status:'مستحق', createdBy:currentUserName()
      });
    };
    try{ addDebt = window.addDebt; }catch(e){}

    window.payDebt = function(id){
      const d = getCollection('debts').find(x => String(x.id) === String(id)); if(!d) return;
      const rem = Math.max(0, safe(d.remaining !== undefined ? d.remaining : safe(d.amount)-safe(d.paid)));
      const phone = debtPhone(d);
      if($('modalTitle')) $('modalTitle').textContent = 'تم الدفع';
      if($('modalBody')) $('modalBody').innerHTML = `<form id="payDebtForm" class="grid"><div class="field"><label>العميل</label><input value="${esc(d.partyName||'')}" readonly></div><div class="field"><label>رقم الجوال</label><input value="${esc(phone)}" readonly></div><div class="field"><label>المتبقي</label><b>${moneySafe(rem)}</b></div><div class="field"><label>قيمة الدفعة</label><input name="amount" type="number" step="0.01" value="${rem}"></div><div class="field"><label>الحساب الداخل عليه المبلغ</label><select name="accountId">${accountOptions(loadSelectValue('accountId') || '')}</select></div><div class="field full-row" style="grid-column:1/-1"><label>ملاحظة</label><input name="note" placeholder="اختياري"></div></form><div class="tools" style="margin-top:12px"><button class="btn success" onclick="saveDebtPayment('${esc(id)}')">تم الدفع</button></div>`;
      const back = $('modalBack'); if(back) back.style.display='flex';
      setTimeout(applySelectPrefs,30);
    };

    window.saveDebtPayment = function(id){
      const d = getCollection('debts').find(x => String(x.id) === String(id)); const f = $('payDebtForm'); if(!d || !f) return;
      const amount = safe(f.amount.value); const account = f.accountId.value;
      if(amount <= 0) return toastSafe('أدخل مبلغ صحيح');
      if(!account) return toastSafe('اختر الحساب الذي ستدخل عليه الدفعة');
      const oldPaid = safe(d.paid);
      d.paid = oldPaid + amount;
      d.remaining = Math.max(0, safe(d.amount) - safe(d.paid));
      d.status = d.remaining <= 0 ? 'مدفوع' : 'جزئي';
      d.paidAt = nowSafe(); d.paidAccountId = account;
      const phone = debtPhone(d);
      addMovementSafe(account,'in',amount,'دفعة دين '+(d.partyName||''),f.note.value,sourceKeySafe('debtPay',id+':'+Date.now()));
      getCollection('debtPayments').unshift({id:uidSafe('dp'),date:nowSafe(),debtId:id,partyName:d.partyName,partyPhone:phone,amount,accountId:account,note:f.note.value,createdBy:currentUserName()});
      persistSafe(); try{ if(typeof closeModal === 'function') closeModal(); else $('modalBack').style.display='none'; }catch(e){}
      toastSafe('تم ترحيل الدفعة للحساب المختار');
      try{ if(typeof renderPage === 'function') renderPage(); }catch(e){}
    };

    window.openManualDebt = function(){
      if($('modalTitle')) $('modalTitle').textContent = 'إضافة دين على عميل';
      if($('modalBody')) $('modalBody').innerHTML = `<form id="manualDebtForm" class="grid"><div class="field"><label>العميل المسجل</label><select name="customerId" onchange="fillManualDebtCustomer(this.value)"><option value="">عميل غير مسجل</option>${getCollection('customers').map(c=>`<option value="${esc(c.id)}">${esc(c.name||'عميل')} ${customerPhone(c)?' - '+esc(customerPhone(c)):''}</option>`).join('')}</select></div><div class="field"><label>اسم العميل *</label><input name="partyName" placeholder="اسم الزبون"></div><div class="field"><label>رقم الجوال *</label><input name="partyPhone" inputmode="tel" placeholder="رقم الجوال"></div><div class="field"><label>المبلغ</label><input name="amount" type="number" step="0.01" required></div><div class="field"><label>نوع الدين</label><select name="source"><option>دين يدوي</option><option>تطبيق لاحق</option><option>فاتورة غير مكتملة</option></select></div><div class="field full-row" style="grid-column:1/-1"><label>ملاحظة</label><input name="note"></div></form><div class="tools" style="margin-top:12px"><button class="btn success" onclick="saveManualDebt()">حفظ الدين</button></div>`;
      const back = $('modalBack'); if(back) back.style.display='flex';
      setTimeout(applySelectPrefs,30);
    };
    window.fillManualDebtCustomer = function(id){ const c = customerBy(id); const f=$('manualDebtForm'); if(c&&f){ f.partyName.value = c.name || ''; f.partyPhone.value = customerPhone(c); } };
    window.saveManualDebt = function(){
      const f = $('manualDebtForm'); if(!f) return; const d = Object.fromEntries(new FormData(f).entries());
      let c = customerBy(d.customerId,d.partyName,d.partyPhone);
      const name = txt(d.partyName || c?.name); const phone = txt(d.partyPhone || customerPhone(c));
      if(!name || !phone){ toastSafe('الدين يتطلب اسم العميل ورقم الجوال'); if(!name) f.partyName.focus(); else f.partyPhone.focus(); return; }
      c = ensureCustomer(name,phone,d.customerId);
      window.addDebt('customer', c?.id || '', name, safe(d.amount), d.source || 'دين يدوي', d.note || '', sourceKeySafe('manualDebt',uidSafe('m')), phone);
      persistSafe(); try{ if(typeof closeModal === 'function') closeModal(); else $('modalBack').style.display='none'; }catch(e){}
      toastSafe('تم تسجيل الدين على العميل'); try{ if(typeof renderPage === 'function') renderPage(); }catch(e){}
    };
  }

  function debtPhone(d){
    const c = customerBy(d.partyId,d.partyName,d.partyPhone||d.customerPhone||d.phone);
    return txt(d.partyPhone || d.customerPhone || d.phone || c?.phone || c?.mobile || '');
  }
  function renderDebtRows(rows){
    return rows.map(d => {
      const rem = Math.max(0, safe(d.remaining !== undefined ? d.remaining : safe(d.amount)-safe(d.paid)));
      const phone = debtPhone(d);
      const action = rem > 0 ? `<button class="btn small debt-paid-btn" onclick="event.stopPropagation();payDebt('${esc(d.id)}')">تم الدفع</button>` : `<span class="status ok debt-paid-done">مدفوع</span>`;
      const cid = d.partyId || (customerBy('',d.partyName,phone)?.id || '');
      const ledger = `<button class="btn small ghost" onclick="event.stopPropagation();openCustomerLedgerSmart('${esc(cid)}','${esc(d.partyName||'')}','${esc(phone)}')">سجل العميل</button>`;
      return `<tr class="debt-click-row" onclick="openCustomerLedgerSmart('${esc(cid)}','${esc(d.partyName||'')}','${esc(phone)}')"><td>${esc(d.date||'')}</td><td><b>${esc(d.partyName||'')}</b></td><td>${esc(phone)}</td><td>${moneySafe(d.amount)}</td><td>${moneySafe(d.paid)}</td><td><b style="color:#dc2626">${moneySafe(rem)}</b></td><td>${esc(d.source||'')}</td><td>${esc(d.status||'مستحق')}</td><td><div class="tools">${ledger}${action}</div></td></tr>`;
    }).join('') || '<tr><td colspan="9" style="text-align:center;color:#6b7280">لا توجد ديون</td></tr>';
  }
  function installRenderDebts(){
    window.renderDebts = function(){
      let rows = getCollection('debts').slice();
      try{ if(typeof periodFilterRows === 'function') rows = periodFilterRows(rows); }catch(e){}
      const q = txt($('searchBox')?.value).toLowerCase();
      if(q) rows = rows.filter(r => JSON.stringify(r).toLowerCase().includes(q));
      const total = rows.reduce((s,d)=>s+safe(d.remaining !== undefined ? d.remaining : safe(d.amount)-safe(d.paid)),0);
      const paid = rows.reduce((s,d)=>s+safe(d.paid),0);
      const grouped = {};
      rows.forEach(d => { const k = d.partyId || d.partyName || d.id; grouped[k] = grouped[k] || {name:d.partyName, phone:debtPhone(d), total:0, count:0}; grouped[k].total += safe(d.remaining !== undefined ? d.remaining : safe(d.amount)-safe(d.paid)); grouped[k].count++; });
      const cards = Object.values(grouped).map(c => `<div class="debt-customer-card" onclick="openCustomerLedgerSmart('', '${esc(c.name||'')}', '${esc(c.phone||'')}')"><div><b>${esc(c.name||'عميل')}</b><div class="muted">${esc(c.phone||'بدون رقم')} · ${c.count} حركة</div></div><div style="display:flex;align-items:center;gap:8px"><div class="debt-total">${moneySafe(c.total)}</div><button class="btn small ghost" onclick="event.stopPropagation();openCustomerLedgerSmart('', '${esc(c.name||'')}', '${esc(c.phone||'')}')">سجل</button></div></div>`).join('');
      const html = `<div class="kpis"><div class="kpi"><span>إجمالي الديون</span><strong>${moneySafe(total)}</strong></div><div class="kpi"><span>المسدّد</span><strong>${moneySafe(paid)}</strong></div><div class="kpi" id="custKpi"><span>عدد العملاء</span><strong>${Object.keys(grouped).length}</strong></div><div class="kpi"><span>عدد الحركات</span><strong>${rows.length}</strong></div></div><div class="table-toolbar" style="margin:14px 0"><div class="tools"><button class="btn primary" onclick="openManualDebt()">+ إضافة دين يدوي</button><input id="searchBox" class="search" value="${esc(q)}" placeholder="بحث في الديون..." oninput="renderDebts()"></div></div>${cards}<h3>سجل الديون</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>التاريخ</th><th>اسم الزبون</th><th>رقم الجوال</th><th>المبلغ</th><th>المدفوع</th><th>المتبقي</th><th>المصدر</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>${renderDebtRows(rows)}</tbody></table></div><div class="muted" style="margin-top:8px">زر “تم الدفع” يرحّل الدفعة مباشرة للحساب الذي تختاره.</div>`;
      if($('mainCard')) $('mainCard').innerHTML = html;
      setTimeout(applySelectPrefs,30);
    };
    try{ renderDebts = window.renderDebts; }catch(e){}
  }


  function collectCustomerLedger(id,name,phone){
    let c = customerBy(id,name,phone) || (id ? getCollection('customers').find(x => String(x.id)===String(id)) : null);
    if(!c && (name || phone)) c = ensureCustomer(name,phone,id);
    const cid = c?.id || id || '';
    const cname = txt(c?.name || name || 'عميل');
    const cphone = txt(customerPhone(c,phone));
    const match = (r) => (cid && String(r.customerId||r.partyId||'')===String(cid)) || (cname && txt(r.customerName||r.partyName)===cname) || (cphone && txt(r.customerPhone||r.partyPhone||r.phone||r.mobile)===cphone);
    const invoices = getCollection('sales').filter(match).map(x=>({...x,_ledgerType:'فاتورة'}));
    const drafts = getCollection('draftSales').filter(match).map(x=>({...x,_ledgerType:'مسودة'}));
    const quotations = getCollection('quotations').filter(match).map(x=>({...x,_ledgerType:'عرض سعر'}));
    const debts = getCollection('debts').filter(match);
    const payments = getCollection('debtPayments').filter(p => debts.some(d=>String(d.id)===String(p.debtId)) || (cname && txt(p.partyName)===cname) || (cphone && txt(p.partyPhone||p.phone)===cphone));
    const allInvoices = invoices.concat(drafts,quotations).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
    const totalSales = allInvoices.reduce((s,x)=>s+safe(x.total),0);
    const totalDue = allInvoices.reduce((s,x)=>s+safe(x.due),0);
    const totalDebt = debts.reduce((s,d)=>s+safe(d.remaining!==undefined?d.remaining:(safe(d.amount)-safe(d.paid))),0);
    const totalPayments = payments.reduce((s,p)=>s+safe(p.amount),0);
    return {customer:c||{id:cid,name:cname,phone:cphone,mobile:cphone}, id:cid, name:cname, phone:cphone, invoices:allInvoices, debts, payments, totalSales, totalDue, totalDebt, totalPayments};
  }
  function simpleTable(rows, cols, emptyText){
    return `<div class="table-wrap"><table class="data-table"><thead><tr>${cols.map(c=>`<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.length ? rows.map(r=>`<tr>${cols.map(c=>`<td>${c.f?c.f(r):esc(r[c.key]??'')}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cols.length}" style="text-align:center;color:#6b7280">${esc(emptyText||'لا توجد بيانات')}</td></tr>`}</tbody></table></div>`;
  }
  function customerLedgerHTML(data, printMode){
    const invCols=[{label:'النوع',key:'_ledgerType'},{label:'التاريخ',key:'date'},{label:'رقم الفاتورة',key:'invoiceNo'},{label:'الحالة',key:'paymentStatus'},{label:'طريقة الدفع',key:'paymentMethod'},{label:'الإجمالي',f:r=>moneySafe(r.total)},{label:'المدفوع',f:r=>moneySafe(r.paid)},{label:'المتبقي',f:r=>moneySafe(r.due)}];
    const debtCols=[{label:'التاريخ',key:'date'},{label:'المصدر',key:'source'},{label:'المبلغ',f:r=>moneySafe(r.amount)},{label:'المدفوع',f:r=>moneySafe(r.paid)},{label:'المتبقي',f:r=>moneySafe(r.remaining!==undefined?r.remaining:(safe(r.amount)-safe(r.paid)))},{label:'الحالة',key:'status'}];
    const payCols=[{label:'التاريخ',key:'date'},{label:'المبلغ',f:r=>moneySafe(r.amount)},{label:'الحساب',key:'accountId'},{label:'ملاحظة',key:'note'}];
    const actions = printMode ? '' : `<div class="ledger-actions"><button class="btn primary" onclick="printCustomerLedger('${esc(data.id)}','${esc(data.name)}','${esc(data.phone)}')">طباعة / PDF</button><button class="btn success" onclick="downloadCustomerLedger('${esc(data.id)}','${esc(data.name)}','${esc(data.phone)}','xls')">Excel</button><button class="btn ghost" onclick="downloadCustomerLedger('${esc(data.id)}','${esc(data.name)}','${esc(data.phone)}','csv')">جدول CSV</button><button class="btn ghost" onclick="openQuickDebtPayment&&openQuickDebtPayment('${esc(data.id)}')">+ سداد</button></div>`;
    return `${actions}<div class="kpis"><div class="kpi"><span>إجمالي الفواتير</span><strong>${moneySafe(data.totalSales)}</strong></div><div class="kpi"><span>المتبقي من الفواتير</span><strong>${moneySafe(data.totalDue)}</strong></div><div class="kpi"><span>إجمالي الدين</span><strong>${moneySafe(data.totalDebt)}</strong></div><div class="kpi"><span>دفعات مسددة</span><strong>${moneySafe(data.totalPayments)}</strong></div></div><div class="ledger-section"><h3>بيانات العميل</h3><div class="customer-card"><div><b>${esc(data.name)}</b><div class="muted">${esc(data.phone||'بدون رقم')}</div></div></div></div><div class="ledger-section"><h3>سجل الفواتير: مكتملة وغير مكتملة</h3>${simpleTable(data.invoices,invCols,'لا توجد فواتير')}</div><div class="ledger-section"><h3>سجل الديون</h3>${simpleTable(data.debts,debtCols,'لا توجد ديون')}</div><div class="ledger-section"><h3>سجل دفعات السداد</h3>${simpleTable(data.payments,payCols,'لا توجد دفعات')}</div>`;
  }
  window.openCustomerLedgerSmart = function(id,name,phone){
    const data = collectCustomerLedger(id,name,phone);
    if(window.openModal) openModal('سجل العميل - '+data.name, customerLedgerHTML(data,false));
    else { let old=$('smartModalBack'); if(old) old.remove(); const d=document.createElement('div'); d.id='smartModalBack'; d.className='smart-modal-back'; d.innerHTML='<div class="smart-modal"><div class="smart-modal-head"><h3>سجل العميل - '+esc(data.name)+'</h3><button class="btn danger small" onclick="document.getElementById(\'smartModalBack\').remove()">×</button></div>'+customerLedgerHTML(data,false)+'</div>'; document.body.appendChild(d); }
  };
  window.openCustomerLedger = function(id){ return window.openCustomerLedgerSmart(id,'',''); };
  window.printCustomerLedger = function(id,name,phone){
    const data = collectCustomerLedger(id,name,phone);
    const html='<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>سجل العميل</title><style>body{font-family:Cairo,Arial;margin:0;padding:18px;color:#111}h1{margin:0 0 10px}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.kpi{border:1px solid #ddd;padding:10px}.kpi span{display:block;color:#555}.kpi strong{font-size:20px}table{width:100%;border-collapse:collapse;margin:8px 0 18px}th,td{border:1px solid #ddd;padding:7px;text-align:right;font-size:12px}th{background:#f1f5f5}@media print{button{display:none}}</style></head><body><button onclick="print()">طباعة / حفظ PDF</button><h1>سجل العميل - '+esc(data.name)+'</h1>'+customerLedgerHTML(data,true)+'</body></html>';
    const w=window.open('','_blank'); if(w){w.document.write(html); w.document.close(); setTimeout(()=>w.print(),350);} 
  };
  window.downloadCustomerLedger = function(id,name,phone,type){
    const data = collectCustomerLedger(id,name,phone);
    const rows = [['القسم','التاريخ','الرقم/المصدر','الحالة','طريقة/حساب','الإجمالي/المبلغ','المدفوع','المتبقي','ملاحظة']];
    data.invoices.forEach(r=>rows.push(['فاتورة '+(r._ledgerType||''),r.date||'',r.invoiceNo||'',r.paymentStatus||'',r.paymentMethod||'',safe(r.total),safe(r.paid),safe(r.due),r.note||'']));
    data.debts.forEach(r=>rows.push(['دين',r.date||'',r.source||'',r.status||'',r.partyName||'',safe(r.amount),safe(r.paid),safe(r.remaining!==undefined?r.remaining:(safe(r.amount)-safe(r.paid))),r.note||'']));
    data.payments.forEach(r=>rows.push(['دفعة',r.date||'',r.debtId||'', '', r.accountId||'', safe(r.amount), '', '', r.note||'']));
    const csv = rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');
    const isXls = type === 'xls';
    const blob = new Blob([isXls?'\ufeff'+csv:'\ufeff'+csv], {type:isXls?'application/vnd.ms-excel;charset=utf-8':'text/csv;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='سجل-'+(data.name||'عميل')+(isXls?'.xls':'.csv'); a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  };
  function installCustomerLedger(){ window.openCustomerLedger = window.openCustomerLedger || function(id){return window.openCustomerLedgerSmart(id,'','')}; }

  function installInvoiceEditFix(){
    const oldEdit = window.editInvoice;
    if(typeof oldEdit === 'function'){
      window.editInvoice = function(id){ const r = oldEdit.apply(this,arguments); setTimeout(()=>{ const f=$('editInvoiceForm'); if(f && !f.customerPhone?.value){ const rec=getCollection('sales').find(x=>String(x.id)===String(id)); if(f.customerPhone) f.customerPhone.value = rec?.customerPhone || ''; } applySelectPrefs(); },40); return r; };
      try{ editInvoice = window.editInvoice; }catch(e){}
    }
    window.saveInvoiceEdit = function(id){
      const rec = getCollection('sales').find(x => String(x.id) === String(id)); const f = $('editInvoiceForm'); if(!rec || !f) return;
      const method = f.paymentMethod.value || 'نقدي';
      const name = txt(f.customerName.value) || methodDefaultName(method);
      const phone = txt(f.customerPhone.value);
      if(isMandatoryCustomerMethod(method) && (!name || !phone)){ toastSafe('طريقة الدفع '+method+' تتطلب اسم العميل ورقم الجوال'); if(!name) f.customerName.focus(); else f.customerPhone.focus(); return; }
      try{ if(typeof reverseMovements === 'function') reverseMovements(sourceKeySafe('sale',id)); }catch(e){}
      try{ if(typeof reverseDebts === 'function') reverseDebts(sourceKeySafe('sale',id)); }catch(e){}
      (rec.items||[]).forEach(i=>updateStockSafe(i, stockFactorSafe(i)));
      rec.items = (rec.items||[]).map((i,n)=>{ i.qty=safe(f['qty_'+n]?.value); i.unitPrice=safe(f['price_'+n]?.value); i.discount=safe(f['disc_'+n]?.value); i.total=Math.max(0,i.qty*i.unitPrice-i.discount); return i; });
      rec.total = rec.items.reduce((s,i)=>s+safe(i.total),0); rec.invoiceNo=f.invoiceNo.value; rec.paymentMethod=method; rec.accountId=f.accountId.value||'cash-main'; rec.customerName=name; rec.customerPhone=phone; rec.paid = isMandatoryCustomerMethod(method) ? 0 : safe(f.paid.value); rec.due=Math.max(0,rec.total-rec.paid); rec.paymentStatus=calcStatusSafe(rec.total,rec.paid,method);
      const customer = ensureCustomer(name,phone,rec.customerId); rec.customerId = customer?.id || rec.customerId || '';
      if(rec.paid>0) addMovementSafe(rec.accountId,'in',rec.paid,'فاتورة بيع '+rec.invoiceNo,rec.note,sourceKeySafe('sale',rec.id));
      if(rec.due>0) window.addDebt('customer',rec.customerId||'',rec.customerName,rec.due,method,rec.invoiceNo,sourceKeySafe('sale',rec.id),phone);
      rec.items.forEach(i=>updateStockSafe(i,-stockFactorSafe(i)));
      persistSafe(); try{ if(typeof closeModal === 'function') closeModal(); }catch(e){}
      toastSafe('تم تعديل الفاتورة وإعادة الحسابات'); try{ if(typeof renderPage === 'function') renderPage(); }catch(e){}
    };
    try{ saveInvoiceEdit = window.saveInvoiceEdit; }catch(e){}
  }

  function selectKey(sel){
    if(!sel || sel.dataset.noPersist === '1') return '';
    const id = sel.id || sel.name; if(!id) return '';
    if(/customerId|supplierId|productId|edit/i.test(id) && !/accountId|paymentMethod/.test(id)) return '';
    const global = /^(paymentMethod|accountId|branchSwitcher|deliveryStatus|periodSelect|source|branch)$/.test(id);
    return STORAGE_PREFIX + (global ? 'global:' : decodeURIComponent(location.pathname)+':') + id;
  }
  function loadSelectValue(id){
    const globalKey = STORAGE_PREFIX + 'global:' + id;
    return localStorage.getItem(globalKey) || '';
  }
  function applySelectPrefs(root){
    root = root || document;
    qsa('select',root).forEach(sel => {
      const form = sel.closest('form');
      if(form && form.id === 'editInvoiceForm') return;
      const key = selectKey(sel); if(!key) return;
      const val = localStorage.getItem(key); if(!val) return;
      if(Array.from(sel.options).some(o => String(o.value) === String(val)) && String(sel.value) !== String(val)) sel.value = val;
    });
    enforcePaymentRule();
  }
  function installSelectPersistence(){
    document.addEventListener('change', function(e){
      const sel = e.target && e.target.closest && e.target.closest('select'); if(!sel) return;
      const key = selectKey(sel); if(!key) return;
      localStorage.setItem(key, sel.value || '');
      enforcePaymentRule();
      try{ if(sel.id === 'paymentMethod' && typeof renderCart === 'function') renderCart(); }catch(_){}
    }, true);
    let t = null;
    const mo = new MutationObserver(() => { clearTimeout(t); t = setTimeout(()=>applySelectPrefs(document),60); });
    try{ mo.observe(document.documentElement,{childList:true,subtree:true}); }catch(e){}
    document.addEventListener('DOMContentLoaded',()=>setTimeout(applySelectPrefs,120));
    if(document.readyState !== 'loading') setTimeout(applySelectPrefs,120);
  }

  function wrapRenderCart(){
    const old = window.renderCart || (typeof renderCart === 'function' ? renderCart : null);
    if(typeof old !== 'function' || old.__mobilePolishWrapped) return;
    const wrapped = function(){ const r = old.apply(this,arguments); enforcePaymentRule(); return r; };
    wrapped.__mobilePolishWrapped = true; window.renderCart = wrapped; try{ renderCart = wrapped; }catch(e){}
  }
  function wrapRenderPage(){
    const old = window.renderPage || (typeof renderPage === 'function' ? renderPage : null);
    if(typeof old !== 'function' || old.__mobilePolishWrapped) return;
    const wrapped = function(){ const r = old.apply(this,arguments); setTimeout(()=>{ injectStyle(); applySelectPrefs(); wrapRenderCart(); },70); return r; };
    wrapped.__mobilePolishWrapped = true; window.renderPage = wrapped; try{ renderPage = wrapped; }catch(e){}
  }


  const navIcons = {
    home:'<svg viewBox="0 0 24 24"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/></svg>',
    cashier:'<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 13h8M8 17h3"/></svg>',
    customers:'<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.8"/></svg>',
    products:'<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/></svg>',
    invoices:'<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h6"/></svg>'
  };
  function installBottomNav(){
    const page = decodeURIComponent(location.pathname.split('/').pop() || 'index.html');
    if(page === 'index.html' || page === '') return;
    let nav = document.querySelector('.bottom-nav');
    if(!nav){ nav = document.createElement('nav'); nav.className='bottom-nav'; document.body.appendChild(nav); }
    const items=[['لوحة-المتابعة.html',navIcons.home,'الرئيسية'],['الكاشير.html',navIcons.cashier,'الكاشير'],['العملاء.html',navIcons.customers,'العملاء'],['كل-الأصناف.html',navIcons.products,'الأصناف'],['الفواتير.html',navIcons.invoices,'الفواتير']];
    const path = decodeURIComponent(location.pathname.split('/').pop()||'');
    nav.innerHTML = items.map(([href,icon,label])=>`<a href="${href}" class="${path===href?'active':''}">${icon}<span>${label}</span></a>`).join('');
    nav.classList.add('oskar-nav-ready');
    document.body.classList.add('oskar-ui-ready');
  }


  /* R6 product identity + purchase conversion model */
  function injectR6ProductPurchaseStyle(){
    if($('oskar-r6-product-purchase-style')) return;
    var st=document.createElement('style');
    st.id='oskar-r6-product-purchase-style';
    st.textContent=''
      +'.r6-form-card{background:#fff!important;border:1px solid #dfe9e9!important;border-radius:26px!important;padding:16px!important;box-shadow:0 12px 28px rgba(47,133,132,.10)!important;margin-bottom:14px!important}'
      +'.r6-form-title{font-size:20px!important;font-weight:950!important;color:#304d56!important;margin:0 0 14px!important;display:flex!important;align-items:center!important;gap:8px!important}'
      +'.r6-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:13px!important;align-items:start!important}'
      +'.r6-grid .field{margin:0!important;min-width:0!important}'
      +'.r6-grid .field.full,.r6-field-full{grid-column:1/-1!important}'
      +'.r6-grid label{font-weight:950!important;color:#375762!important;margin-bottom:7px!important;font-size:13px!important}'
      +'.r6-grid input,.r6-grid select,.r6-grid textarea,.purchase-entry-card input,.purchase-entry-card select,.purchase-entry-card textarea{width:100%!important;height:54px!important;min-height:54px!important;border:1px solid #dbe8e8!important;border-radius:17px!important;background:#fff!important;color:#263f4a!important;padding:0 14px!important;font-weight:850!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.75)!important;box-sizing:border-box!important;outline:none!important}'
      +'.r6-grid textarea{height:72px!important;padding-top:12px!important;resize:none!important}'
      +'.r6-grid input:focus,.r6-grid select:focus,.purchase-entry-card input:focus,.purchase-entry-card select:focus{border-color:'+TEAL+'!important;box-shadow:0 0 0 3px rgba(64,152,152,.13)!important}'
      +'.r6-hint{display:block!important;margin-top:7px!important;font-size:12px!important;font-weight:900!important;color:#5f7f86!important;line-height:1.6!important}'
      +'.r6-calc-hint{background:#eef7f7!important;border:1px solid #d4eaea!important;color:#2f8584!important;border-radius:14px!important;padding:9px 11px!important;font-size:13px!important;font-weight:950!important;line-height:1.7!important}'
      +'.r6-unit-box{grid-column:1/-1!important;background:#f7fbfb!important;border:1px solid #dfe9e9!important;border-radius:22px!important;padding:13px!important}'
      +'.r6-tools{display:flex!important;gap:9px!important;flex-wrap:wrap!important;align-items:center!important;justify-content:center!important;margin-top:15px!important}'
      +'.table-wrap{overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-x:contain!important;touch-action:pan-x pan-y!important;scroll-behavior:auto!important;direction:ltr!important}'
      +'.table-wrap table{direction:rtl!important;min-width:920px!important}'
      +'.advanced-cart-table{min-width:980px!important}'
      +'.advanced-cart-table input,.advanced-cart-table select{height:42px!important;min-height:42px!important;border-radius:13px!important}'
      +'.purchase-cost-note{display:block!important;margin-top:6px!important;color:#2f8584!important;font-size:12px!important;font-weight:950!important;line-height:1.6!important}'
      +'.product-results{display:grid!important;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))!important;gap:10px!important}'
      +'#productResults .popular-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}'
      +'#productResults .popular-card{min-width:0!important;min-height:86px!important;padding:10px!important}'
      +'@media(max-width:760px){.r6-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}.r6-grid .field.full,.r6-field-full,.r6-unit-box{grid-column:1/-1!important}#productResults .popular-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important}#productResults .popular-card{padding:8px!important;border-radius:15px!important}#productResults .popular-card b{font-size:12px!important;line-height:1.25!important}#productResults .popular-card small{font-size:11px!important}.product-results{grid-template-columns:repeat(2,minmax(0,1fr))!important}.scan-input-row{grid-template-columns:1fr auto!important}.table-wrap{max-width:100%!important}.advanced-cart-table{min-width:940px!important}}'
      +'@media(max-width:430px){.r6-grid{grid-template-columns:1fr!important}.r6-grid .field{grid-column:1/-1!important}.r6-grid input,.r6-grid select,.r6-grid textarea{height:52px!important;min-height:52px!important}}';
    document.head.appendChild(st);
  }
  var __r6OldInjectR5Style = typeof injectR5Style === 'function' ? injectR5Style : null;
  if(__r6OldInjectR5Style && !__r6OldInjectR5Style.__r6Wrapped){
    injectR5Style=function(){ var r=__r6OldInjectR5Style.apply(this,arguments); injectR6ProductPurchaseStyle(); return r; };
    injectR5Style.__r6Wrapped=true;
  }

  function r6AllUnitOptions(selected){
    var seen={};
    var defaults=[{id:'carton',name:'كرتونة',symbol:'CT',pieces:24},{id:'box',name:'صندوق',symbol:'BX',pieces:12}];
    var rows=[];
    defaults.concat(active(arr('units'))).forEach(function(u){
      var name=txt(u.name||u.unitName||u.label); if(!name || name==='قطعة') return;
      var key=low(name); if(seen[key]) return; seen[key]=true;
      rows.push({id:u.id||name,name:name,symbol:txt(u.symbol||u.code||name.slice(0,2)),pieces:Math.max(1,num(u.pieces||u.piecesPerUnit||u.factor||1))});
    });
    var html='<option value="">اختر وحدة القياس الكبرى</option>';
    rows.forEach(function(u){ var val=u.id||u.name; html+='<option value="'+esc(val)+'" data-name="'+esc(u.name)+'" data-symbol="'+esc(u.symbol)+'" data-pieces="'+esc(u.pieces)+'" '+(String(selected||'')===String(val)?'selected':'')+'>'+esc(u.name)+' ('+num(u.pieces)+' قطعة)</option>'; });
    html+='<option value="custom" '+(selected==='custom'?'selected':'')+'>وحدة مخصصة</option>';
    return html;
  }
  function r6GroupOptions(selected){
    var rows=active(arr('groups')).concat(active(arr('productGroups')));
    var seen={}; var html='<option value="">اختر التصنيف</option>';
    rows.forEach(function(g){ var val=txt(g.name||g.title||g.id); if(!val||seen[low(val)]) return; seen[low(val)]=1; html+='<option value="'+esc(val)+'" '+(String(selected||'')===String(val)?'selected':'')+'>'+esc(val)+'</option>'; });
    return html;
  }
  function r6SupplierOptions(selected){
    return '<option value="">اختر المورد</option>'+active(arr('suppliers')).map(function(s){return '<option value="'+esc(s.id)+'" '+(String(selected||'')===String(s.id)?'selected':'')+'>'+esc(s.name||s.phone||s.id)+'</option>';}).join('');
  }
  function r6ResolveUnitFromForm(f){
    var mode=txt(f.majorUnit&&f.majorUnit.value);
    var name='', symbol='', pieces=Math.max(1,num(f.conversionFactor&&f.conversionFactor.value));
    var existingId='';
    if(mode==='custom'){
      name=txt(f.customUnitName&&f.customUnitName.value); symbol=txt((f.customUnitSymbol&&f.customUnitSymbol.value)||name.slice(0,2));
      if(!name){ toast('أدخل اسم وحدة القياس الكبرى'); return null; }
      if(name==='قطعة'||name==='وحدة'){ toast('اسم الوحدة موجود مسبقاً'); return null; }
      var exists=active(arr('units')).some(function(u){return low(u.name)===low(name);});
      if(exists){ toast('اسم الوحدة موجود، اختر اسمًا فريدًا'); return null; }
    } else {
      var opt=f.majorUnit&&f.majorUnit.options[f.majorUnit.selectedIndex];
      name=txt((opt&&opt.getAttribute('data-name'))|| (opt&&opt.textContent||'').split('(')[0]);
      symbol=txt((opt&&opt.getAttribute('data-symbol'))||name.slice(0,2));
      pieces=Math.max(1,num((f.conversionFactor&&f.conversionFactor.value)|| (opt&&opt.getAttribute('data-pieces')) || 1));
      existingId=mode;
      if(!name){ toast('اختر وحدة القياس الكبرى'); return null; }
    }
    return {id: existingId || uid('u'), name:name, symbol:symbol, pieces:pieces, piecesPerUnit:pieces};
  }
  window.toggleProductUnitR6=function(){
    var f=$('advancedProductForm'); if(!f) return;
    var mode=txt(f.majorUnit&&f.majorUnit.value);
    qsa('.r6-custom-unit',f).forEach(function(el){el.classList.toggle('hide',mode!=='custom');});
    if(mode && mode!=='custom'){
      var opt=f.majorUnit.options[f.majorUnit.selectedIndex];
      if(opt && opt.getAttribute('data-pieces')) f.conversionFactor.value=opt.getAttribute('data-pieces')||'1';
    }
    window.calcProductPricesR6();
  };
  window.calcProductPricesR6=function(){
    var f=$('advancedProductForm'); if(!f) return;
    var factor=Math.max(1,num(f.conversionFactor&&f.conversionFactor.value));
    var piece=num(f.salePricePiece&&f.salePricePiece.value);
    var unit=f.salePriceUnit;
    if(unit && unit.dataset.manual!=='1') unit.value=(piece*factor ? (piece*factor).toFixed(2) : '');
    var unitVal=num(unit&&unit.value);
    var hint=$('productPriceHintR6');
    if(hint) hint.innerHTML='سعر البيع المتوقع للوحدة الكبرى = '+money(piece*factor)+'<br>السعر الحالي للوحدة الكبرى = '+money(unitVal)+' · عامل التحويل = '+factor+' قطعة';
  };

  window.renderProductForm=function(){
    if(!$('mainCard')) return;
    $('mainCard').dataset.r5View='product-form'; $('mainCard').dataset.r6View='product-identity';
    $('mainCard').innerHTML=''
      +'<div class="r6-form-card">'
      +'<h3 class="r6-form-title">تعريف منتج جديد</h3>'
      +'<div class="tools" style="justify-content:flex-start;margin-bottom:12px"><button class="btn ghost" type="button" onclick="startScanner&&startScanner(function(v){var b=document.querySelector(\'#advancedProductForm [name=barcode]\'); if(b)b.value=v;})">مسح باركود بالكاميرا</button></div>'
      +'<form id="advancedProductForm" class="r6-grid">'
      +'<div class="field"><label>اسم المنتج *</label><input name="name" required placeholder="اسم المنتج"></div>'
      +'<div class="field"><label>الباركود</label><input name="barcode" placeholder="باركود / QR"></div>'
      +'<div class="field"><label>التصنيف</label><select name="group">'+r6GroupOptions('')+'</select></div>'
      +'<div class="field"><label>المورد *</label><select name="supplierId">'+r6SupplierOptions('')+'</select></div>'
      +'<div class="r6-unit-box"><div class="r6-grid">'
      +'<div class="field"><label>وحدة القياس الكبرى</label><select name="majorUnit" onchange="toggleProductUnitR6()">'+r6AllUnitOptions('carton')+'</select><span class="r6-hint">مثال: كرتونة، صندوق، باكيت.</span></div>'
      +'<div class="field r6-custom-unit hide"><label>اسم الوحدة المخصصة</label><input name="customUnitName" placeholder="مثال: دستة"></div>'
      +'<div class="field r6-custom-unit hide"><label>رمز الوحدة</label><input name="customUnitSymbol" placeholder="مثال: DZ"></div>'
      +'<div class="field"><label>عامل التحويل</label><input name="conversionFactor" type="number" step="1" min="1" value="24" oninput="calcProductPricesR6()"><span class="r6-hint">كم قطعة داخل الوحدة الكبرى؟</span></div>'
      +'</div></div>'
      +'<div class="field"><label>سعر البيع (قطعة)</label><input name="salePricePiece" type="number" step="0.01" oninput="calcProductPricesR6()"></div>'
      +'<div class="field"><label>سعر البيع للوحدة الكبرى</label><input name="salePriceUnit" type="number" step="0.01" oninput="this.dataset.manual=\'1\';calcProductPricesR6()"><span class="r6-hint">يُحسب تلقائياً ويمكن تعديله لخصم الجملة.</span></div>'
      +'<div class="field full"><div id="productPriceHintR6" class="r6-calc-hint">أدخل سعر القطعة وعامل التحويل ليظهر سعر الوحدة الكبرى.</div></div>'
      +'<div class="field full"><label>ملاحظات</label><textarea name="note" placeholder="اختياري"></textarea></div>'
      +'</form><div class="r6-tools"><button class="btn purple" onclick="saveProductAdvanced()">حفظ المنتج</button></div></div>';
    window.toggleProductUnitR6();
  };
  try{renderProductForm=window.renderProductForm}catch(e){}

  window.saveProductAdvanced=function(){
    var f=$('advancedProductForm'); if(!f) return;
    var data=Object.fromEntries(new FormData(f).entries());
    if(!txt(data.name)){ toast('أدخل اسم المنتج'); return; }
    var supplier=active(arr('suppliers')).find(function(s){return String(s.id)===String(data.supplierId);});
    if(active(arr('suppliers')).length && !supplier){ toast('اختر المورد'); return; }
    var unit=r6ResolveUnitFromForm(f); if(!unit) return;
    var factor=Math.max(1,num(data.conversionFactor));
    var salePiece=num(data.salePricePiece);
    var saleUnit=num(data.salePriceUnit) || salePiece*factor;
    var globalUnit=ensureGlobalUnit({name:unit.name,symbol:unit.symbol,pieces:factor,piecesPerUnit:factor});
    var p={
      id:uid('prod'), name:txt(data.name), sku:txt(data.barcode), barcode:txt(data.barcode),
      group:txt(data.group), category:txt(data.group), supplierId:supplier?supplier.id:'', supplierName:supplier?(supplier.name||supplier.id):'',
      unit:'قطعة', baseUnit:'قطعة', majorUnitName:unit.name, majorUnitSymbol:unit.symbol, conversionFactor:factor,
      purchasePrice:0, costPerPiece:0, salePrice:salePiece, price:salePiece, cartonSize:factor, cartonName:unit.name, cartonPrice:saleUnit,
      stock:0, stockUnits:0, note:txt(data.note), createdAt:now(), createdBy:currentUserName(),
      purchaseUnits:[{id:(globalUnit&&globalUnit.id)||unit.id,name:unit.name,symbol:unit.symbol,pieces:factor,piecesPerUnit:factor,buyPrice:0,salePrice:saleUnit,pieceSalePrice:salePiece}]
    };
    p.unitsMeta=p.purchaseUnits;
    arr('products').unshift(p);
    arr('purchases').unshift({
      id:uid('pur'), date:today(), referenceNo:'PROD-'+Date.now(), supplierId:p.supplierId, supplierName:p.supplierName||'بدون مورد',
      branch:'', items:[{productId:p.id,name:p.name,qty:0,unitName:p.majorUnitName,piecesPerUnit:factor,stockQty:0,purchasePiecePrice:0,unitBuyPrice:0,pieceSalePrice:salePiece,unitSalePrice:saleUnit,type:'تعريف منتج'}],
      total:0, paid:0, due:0, paymentStatus:'مدفوع', purchaseStatus:'تعريف منتج', accountId:'', note:'تم تعريف المنتج من صفحة إضافة منتج', createdAt:now(), createdBy:currentUserName()
    });
    save(); toast('تم حفظ المنتج وتعريف وحدته وحفظه في سجل المشتريات');
    try{location.href='كل-الأصناف.html'}catch(e){window.renderPage&&window.renderPage()}
  };
  try{saveProductAdvanced=window.saveProductAdvanced}catch(e){}

  function r6ProductSaleUnit(p, key){ return findUnit(p,key)||findUnit(p,'piece'); }
  function r6PurchaseUnitOptions(p, selected){
    var html='<option value="piece" '+(!selected||selected==='piece'?'selected':'')+'>قطعة</option>';
    normalizeUnits(p).forEach(function(u){ var key=u.id||u.name; html+='<option value="'+esc(key)+'" '+(String(selected||'')===String(key)?'selected':'')+'>'+esc(u.name)+' - '+num(u.pieces)+' قطعة</option>'; });
    return html;
  }
  function r6ApplyPurchaseUnit(item, key){
    var p=productById(item.productId)||{}; var u=r6ProductSaleUnit(p,key)||r6ProductSaleUnit(p,'piece');
    item.unitChoice=key||'piece'; item.unit=u.name||'قطعة'; item.unitName=item.unit; item.unitSymbol=u.symbol||item.unit;
    item.piecesPerUnit=Math.max(1,num(u.pieces||u.piecesPerUnit||1)); item.factor=item.piecesPerUnit;
    item.unitBuyPrice=num(item.unitBuyPrice||u.buyPrice||0);
    item.purchasePiecePrice=item.piecesPerUnit ? num(item.unitBuyPrice)/item.piecesPerUnit : num(item.unitBuyPrice);
    item.pieceSalePrice=num(p.salePrice||p.price||u.pieceSalePrice||0);
    item.unitSalePrice=num(u.salePrice||item.pieceSalePrice*item.piecesPerUnit);
    item.qty=Math.max(0,num(item.qty||1)); item.stockQty=item.qty*item.piecesPerUnit; item.total=item.qty*num(item.unitBuyPrice||0);
    item.profitPerPiece=item.pieceSalePrice-item.purchasePiecePrice; item.expectedProfit=item.stockQty*item.profitPerPiece;
  }
  window.addPurchaseProductToCart=function(id){
    var p=productById(id); if(!p) return;
    var item={productId:p.id,name:p.name,sku:p.sku,barcode:p.barcode,qty:1,unitChoice:'piece',unitName:'قطعة',piecesPerUnit:1,unitBuyPrice:num(p.purchasePrice||p.costPerPiece||0)};
    r6ApplyPurchaseUnit(item,'piece'); var c=getCart(); c.push(item); setCart(c); window.renderCart&&window.renderCart();
  };
  window.changePurchaseUnit=function(idx,key){ var c=getCart(), i=c[idx]; if(!i) return; i.unitBuyPrice=0; r6ApplyPurchaseUnit(i,key); window.renderCart&&window.renderCart(); };
  window.updatePurchaseItem=function(idx,field,value){ var c=getCart(), i=c[idx]; if(!i)return; i[field]=value; r6ApplyPurchaseUnit(i,i.unitChoice||'piece'); window.renderCart&&window.renderCart(); };
  function renderPurchaseCartR6(){
    var el=$('cartBody'); if(!el) return; var c=getCart(); c.forEach(function(i){r6ApplyPurchaseUnit(i,i.unitChoice||'piece')});
    el.innerHTML=c.map(function(i,idx){ var p=productById(i.productId)||{}; var label=esc(i.unitName||'قطعة'); var costTxt='تكلفة القطعة الواحدة = '+money(i.purchasePiecePrice)+' · ربح القطعة المتوقع = '+money(i.profitPerPiece); return '<tr><td class="name-cell"><b>'+esc(i.name)+'</b><span class="purchase-cost-note">يزيد المخزون: '+num(i.stockQty).toFixed(3).replace(/\.000$/,'')+' قطعة</span></td><td class="unit-cell"><select onchange="changePurchaseUnit('+idx+',this.value)">'+r6PurchaseUnitOptions(p,i.unitChoice)+'</select></td><td><input type="number" step="0.001" value="'+esc(i.qty)+'" onchange="updatePurchaseItem('+idx+',\'qty\',this.value)"></td><td><input type="number" step="0.01" value="'+esc(i.unitBuyPrice)+'" onchange="updatePurchaseItem('+idx+',\'unitBuyPrice\',this.value)" placeholder="سعر شراء '+label+'"><span class="purchase-cost-note">'+costTxt+'</span></td><td class="calc-cell">'+money(i.total)+'</td><td class="calc-cell">'+money(i.expectedProfit)+'</td><td><button class="btn small danger" onclick="removeCartItemR5('+idx+')">×</button></td></tr>'; }).join('') || '<tr><td colspan="7" style="text-align:center;color:#6b7280">لا توجد مشتريات</td></tr>';
    var table=el.closest('table'); if(table){ table.classList.add('advanced-cart-table'); var th=table.querySelector('thead tr'); if(th) th.innerHTML='<th>المنتج</th><th>نوع الوحدة المستلمة</th><th>الكمية</th><th>سعر الشراء</th><th>الإجمالي</th><th>ربح متوقع</th><th>حذف</th>'; }
    updateTotals(); stabilizeTables();
  }
  window.renderPurchaseForm=function(){
    setCart([]); if(!$('mainCard')) return; $('mainCard').dataset.r5View='purchase'; $('mainCard').dataset.r6View='purchase-order';
    $('mainCard').innerHTML=''
      +'<div class="r6-form-card purchase-entry-card"><h3 class="r6-form-title">إضافة مشتريات</h3><div class="r6-grid">'
      +'<div class="field"><label>اختيار المورد *</label><select id="supplierId">'+r6SupplierOptions('')+'</select></div>'
      +'<div class="field"><label>الحساب الذي سيتم الدفع منه</label><select id="accountId">'+accountOptions('')+'</select></div>'
      +'<div class="field"><label>تاريخ الشراء</label><input id="purchaseDate" type="date" value="'+today()+'"></div>'
      +'<div class="field"><label>الرقم المرجعي</label><input id="referenceNo" placeholder="تلقائي عند تركه فارغاً"></div>'
      +'<div class="field"><label>حالة الشراء</label><select id="purchaseStatus"><option>استلام</option><option>في الانتظار</option><option>ملغي</option></select></div>'
      +'<div class="field"><label>الفرع</label><select id="branch">'+branchOptions('')+'</select></div>'
      +'</div></div>'
      +'<div class="card"><div class="table-toolbar"><div class="scan-input-row"><input class="search" id="productSearch" placeholder="اختيار المنتج: بحث يدوي أو QR / باركود" oninput="showPurchaseResults(this.value)"><button class="btn ghost" onclick="startScanner&&startScanner(function(v){document.getElementById(\'productSearch\').value=v;showPurchaseResults(v);})">كاميرا QR</button><button class="btn primary" onclick="location.href=\'إضافة-صنف.html\'">+ منتج</button></div></div><div id="productResults" class="product-results"></div><div class="table-wrap"><table class="data-table advanced-cart-table"><thead><tr><th>المنتج</th><th>نوع الوحدة المستلمة</th><th>الكمية</th><th>سعر الشراء</th><th>الإجمالي</th><th>ربح متوقع</th><th>حذف</th></tr></thead><tbody id="cartBody"></tbody></table></div></div>'
      +'<div class="r6-form-card"><h3 class="r6-form-title">الدفع</h3><div class="r6-grid"><div class="field"><label>الإجمالي</label><b id="grandTotal">0.00</b></div><div class="field"><label>المبلغ المدفوع</label><input id="payAmount" type="number" step="0.01" value="0" oninput="this.dataset.touched=1;renderCart()"></div><div class="field"><label>طريقة الدفع</label><select id="paymentMethod"><option>نقدي</option><option>تحويل بنكي</option><option>تطبيق فوري</option><option>تطبيق لاحق</option></select></div><div class="field"><label>ملاحظة الدفع</label><input id="paymentNote"></div><div class="field full"><label>المبلغ المستحق</label><b id="dueAmount" style="color:#dc2626">0.00</b></div></div></div><div class="r6-tools"><button class="btn purple" onclick="savePurchase()">حفظ المشتريات</button></div>';
    showPurchaseResults(''); renderPurchaseCartR6(); setTimeout(stabilizeTables,60);
  };
  try{renderPurchaseForm=window.renderPurchaseForm}catch(e){}
  window.renderCart=function(){ if(isPurchasePage()) return renderPurchaseCartR6(); return renderSaleCart(); };
  try{renderCart=window.renderCart}catch(e){}
  window.savePurchase=function(){
    var c=getCart(); if(!c.length){ toast('أضف منتجات أولاً'); return; } c.forEach(function(i){r6ApplyPurchaseUnit(i,i.unitChoice||'piece')});
    var total=c.reduce(function(s,i){return s+num(i.total)},0), paid=num($('payAmount')&&$('payAmount').value), due=Math.max(0,total-paid);
    var sup=active(arr('suppliers')).find(function(s){return String(s.id)===String($('supplierId')&&$('supplierId').value)}); var account=($('accountId')&&$('accountId').value)||'';
    if(!sup){ toast('اختر المورد'); return; } if(paid>0&&!account){ toast('اختر الحساب الذي سيتم الدفع منه'); return; }
    var rec={id:uid('pur'),date:($('purchaseDate')&&$('purchaseDate').value)||today(),referenceNo:($('referenceNo')&&$('referenceNo').value)||('PUR-'+Date.now()),supplierId:sup.id,supplierName:sup.name||'مورد',branch:($('branch')&&$('branch').value)||'',items:JSON.parse(JSON.stringify(c)),total:total,paid:paid,due:due,paymentStatus:due>0?'مستحق':'مدفوع',purchaseStatus:($('purchaseStatus')&&$('purchaseStatus').value)||'استلام',accountId:account,note:($('paymentNote')&&$('paymentNote').value)||'',createdAt:now(),createdBy:currentUserName()};
    arr('purchases').unshift(rec);
    if(paid>0&&typeof window.addMovement==='function') window.addMovement(account,'out',paid,'مشتريات '+rec.referenceNo,rec.note,'purchase:'+rec.id);
    if(due>0&&typeof window.addDebt==='function') window.addDebt('supplier',sup.id,rec.supplierName,due,rec.referenceNo,'مستحق مورد','purchase:'+rec.id);
    c.forEach(function(i){ var p=productById(i.productId); if(!p) return; p.stock=num(p.stock)+num(i.stockQty); p.stockUnits=p.stock; p.purchasePrice=num(i.purchasePiecePrice); p.costPerPiece=p.purchasePrice; p.supplierId=p.supplierId||sup.id; p.supplierName=p.supplierName||(sup.name||sup.id); var units=normalizeUnits(p); if(i.unitChoice&&i.unitChoice!=='piece'){ var u=units.find(function(x){return String(x.id)===String(i.unitChoice)||String(x.name)===String(i.unitName)}); if(u){u.pieces=num(i.piecesPerUnit);u.piecesPerUnit=u.pieces;u.buyPrice=num(i.unitBuyPrice);u.salePrice=num(i.unitSalePrice);u.pieceSalePrice=num(i.pieceSalePrice);} setProductUnits(p,units); } arr('stockMovements').unshift({id:uid('stk'),date:now(),type:'شراء',product:p.name,productId:p.id,branch:rec.branch,qty:num(i.stockQty),unitName:i.unitName||'قطعة',piecesPerUnit:num(i.piecesPerUnit),purchasePiecePrice:num(i.purchasePiecePrice),note:rec.referenceNo}); });
    save(); setCart([]); renderPurchaseCartR6(); toast('تم حفظ المشتريات وتحديث المخزون بالقطعة وتكلفة الشراء');
  };
  try{savePurchase=window.savePurchase}catch(e){}

  function r6BetterTableStability(){
    document.querySelectorAll('.table-wrap').forEach(function(w){
      if(w.dataset.r6Stable)return; w.dataset.r6Stable='1'; w.style.overflowX='auto'; w.style.webkitOverflowScrolling='touch'; w.style.overscrollBehaviorX='contain';
      var last=0; w.addEventListener('scroll',function(){last=w.scrollLeft; w.dataset.lastScrollLeft=String(last); window.__oskarTableScrollUntil=Date.now()+8000;},{passive:true});
      ['touchstart','pointerdown','wheel'].forEach(function(ev){w.addEventListener(ev,function(){window.__oskarTableScrollUntil=Date.now()+8000;},{passive:true});});
    });
  }
  var __r6OldStabilizeTables = typeof stabilizeTables === 'function' ? stabilizeTables : null;
  if(__r6OldStabilizeTables && !__r6OldStabilizeTables.__r6Wrapped){
    stabilizeTables=function(){ var r=__r6OldStabilizeTables.apply(this,arguments); r6BetterTableStability(); return r; };
    stabilizeTables.__r6Wrapped=true;
  }
  injectR6ProductPurchaseStyle();

  function install(){
    injectStyle(); installBottomNav(); installCustomerChooser(); installPaymentHTML(); installDebtCore(); installRenderDebts(); installCustomerLedger(); installSaleSave(); installInvoiceEditFix(); wrapRenderCart(); wrapRenderPage(); applySelectPrefs();
  }

  installSelectPersistence();
  [0,80,250,700,1500].forEach(ms => setTimeout(install,ms));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(install,60));
})();

/* Oskar advanced stock units + ledgers + layout fixes - 2026-05-10-r4 */
(function(){
  'use strict';
  if(window.__OSKAR_ADVANCED_UNITS_LEDGER_R4__) return;
  window.__OSKAR_ADVANCED_UNITS_LEDGER_R4__ = true;

  var APP_KEY = 'supermarket_pos_ar_v1';
  var TEAL = '#409898';
  var TEAL_DARK = '#2f8584';
  function $(id){ return document.getElementById(id); }
  function esc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function txt(v){ return String(v==null?'':v).trim(); }
  function low(v){ return txt(v).toLowerCase(); }
  function num(v){ return Number(v||0)||0; }
  function uid(p){ try{ if(typeof window.uid === 'function') return window.uid(p); }catch(e){} return (p||'id')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8); }
  function now(){ try{ if(typeof window.nowText === 'function') return window.nowText(); }catch(e){} return new Date().toLocaleString('ar-EG',{hour12:false}); }
  function today(){ try{ if(typeof window.todayISO === 'function') return window.todayISO(); }catch(e){} return new Date().toISOString().slice(0,10); }
  function money(v){ try{ if(typeof window.money2 === 'function') return window.money2(v); }catch(e){} try{ if(typeof window.money === 'function') return window.money(v); }catch(e){} return num(v).toFixed(2); }
  function db(){ try{ if(window.DB) return window.DB; }catch(e){} try{ window.DB = JSON.parse(localStorage.getItem(APP_KEY)||'{}'); }catch(e){ window.DB = {}; } return window.DB; }
  function save(){ try{ if(typeof window.persist === 'function') return window.persist(); }catch(e){} try{ localStorage.setItem(APP_KEY,JSON.stringify(db())); }catch(e){} }
  function arr(name){ try{ if(typeof window.collection === 'function') return window.collection(name); }catch(e){} var d=db(); if(!Array.isArray(d[name])) d[name]=[]; return d[name]; }
  function active(rows){ return (rows||[]).filter(function(x){ return !x || x.deletedAt || x._deleted ? false : true; }); }
  function toast(m){ try{ if(typeof window.toast === 'function') return window.toast(m); }catch(e){} alert(m); }
  function currentUserName(){ try{ return (window.currentUser&&window.currentUser().name)||'مدير النظام'; }catch(e){ return 'مدير النظام'; } }
  function getCart(){ try{ if(Array.isArray(window.cart)) return window.cart; }catch(e){} try{ if(Array.isArray(cart)) return cart; }catch(e){} window.cart=[]; return window.cart; }
  function setCart(v){ try{ window.cart = v; cart = v; }catch(e){ window.cart = v; } }
  function pageName(){ return decodeURIComponent((location.pathname.split('/').pop()||'').split('?')[0]); }
  function isPurchasePage(){ return pageName()==='إضافة-مشتريات.html' || (window.CFG&&CFG.kind==='purchase_form'); }
  function isProductFormPage(){ return pageName()==='إضافة-صنف.html' || (window.CFG&&CFG.kind==='product_form'); }
  function isCustomersPage(){ return pageName()==='العملاء.html' || (window.CFG&&CFG.collection==='customers'); }
  function isAccountsPage(){ return pageName()==='إدارة-الحسابات.html' || (window.CFG&&CFG.kind==='accounts'); }
  function accountOptions(selected){ return '<option value="">اختر الحساب</option>'+active(arr('accounts')).map(function(a){return '<option value="'+esc(a.id)+'" '+(String(selected||'')===String(a.id)?'selected':'')+'>'+esc(a.name||a.code||a.id)+'</option>';}).join(''); }
  function supplierOptions(selected){ return '<option value="">اختر المورد</option>'+active(arr('suppliers')).map(function(s){return '<option value="'+esc(s.id)+'" '+(String(selected||'')===String(s.id)?'selected':'')+'>'+esc(s.name||s.phone||s.id)+'</option>';}).join(''); }
  function branchOptions(selected){ return '<option value="">اختر الفرع</option>'+active(arr('branches')).map(function(b){var val=b.name||b.id;return '<option value="'+esc(val)+'" '+(String(selected||'')===String(val)?'selected':'')+'>'+esc(b.name||b.id)+'</option>';}).join(''); }

  function injectAdvancedStyle(){
    if($('oskar-advanced-r4-style')) return;
    var st=document.createElement('style');
    st.id='oskar-advanced-r4-style';
    st.textContent = `
body.oskar-advanced-ready textarea[name="address"]{height:54px!important;min-height:54px!important;resize:none!important;overflow:hidden!important;padding-top:14px!important}
#productResults .popular-strip{background:#fff!important;border:1px solid #dfe9e9!important;border-radius:22px!important;padding:12px!important;box-shadow:0 10px 24px rgba(47,133,132,.08)!important;width:100%!important;overflow:hidden!important}
#productResults .popular-title{font-size:15px!important;font-weight:950!important;color:#304d56!important;margin-bottom:9px!important}
#productResults .popular-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(128px,1fr))!important;gap:10px!important;width:100%!important;align-items:stretch!important}
#productResults .popular-card{min-height:82px!important;padding:12px!important;display:flex!important;flex-direction:column!important;justify-content:space-between!important;gap:8px!important;overflow:hidden!important;word-break:break-word!important;background:#fafdfe!important;border:1px solid #dfe9e9!important;border-radius:18px!important;box-shadow:none!important}
#productResults .popular-card b{display:-webkit-box!important;-webkit-line-clamp:2!important;-webkit-box-orient:vertical!important;overflow:hidden!important;font-size:14px!important;line-height:1.35!important;color:#304d56!important}
#productResults .popular-card small{font-size:13px!important;color:${TEAL_DARK}!important;font-weight:950!important}
.product-results{grid-auto-rows:auto!important;align-items:stretch!important}.product-card{min-height:88px!important;overflow:hidden!important}
.unit-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid #dfe9e9;background:#eef7f7;color:#2f8584;border-radius:999px;padding:5px 9px;font-size:12px;font-weight:900}.unit-mini{font-size:12px;color:#71858c;font-weight:800}.advanced-cart-table input,.advanced-cart-table select{min-width:86px!important;height:42px!important;font-size:13px!important}.advanced-cart-table .unit-cell{min-width:140px}.advanced-cart-table .name-cell{min-width:170px;white-space:normal!important}.advanced-cart-table .calc-cell{font-weight:950;color:#304d56}.advanced-cart-table th,.advanced-cart-table td{vertical-align:middle!important}
.advanced-form-card{background:#fff!important;border:1px solid #dfe9e9!important;border-radius:24px!important;padding:15px!important;box-shadow:0 10px 24px rgba(47,133,132,.08)!important}.advanced-form-title{font-weight:950;color:#304d56;margin:0 0 12px;font-size:18px}.unit-definition-box{background:#f7fbfb;border:1px solid #dfe9e9;border-radius:20px;padding:12px;margin-top:10px}.scan-input-row{display:flex;gap:8px;align-items:center}.scan-input-row input{flex:1;min-width:0}.ledger-title-card{background:linear-gradient(135deg,#fff,#f2fafa)!important;border:1px solid #dfe9e9!important;border-radius:24px!important;padding:16px!important;box-shadow:0 10px 24px rgba(47,133,132,.08)!important}.ledger-actions{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.ledger-section{margin-top:14px}.ledger-section h3{margin:12px 0 8px;color:#304d56}.account-row,.customer-row{cursor:pointer}.account-row:hover td,.customer-row:hover td{background:#f2faf9!important}.balance-red{color:#dc2626!important}.balance-ok{color:#2f8584!important}.customer-card,.debt-customer-card{cursor:pointer}.customer-card:hover,.debt-customer-card:hover{border-color:${TEAL}!important}.submenu a[data-oskar-added="1"]{font-weight:950!important;color:${TEAL_DARK}!important}
@media(max-width:760px){#productResults .popular-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.advanced-cart-table{min-width:980px!important}.scan-input-row{display:grid;grid-template-columns:1fr auto}.ledger-actions .btn{flex:1 1 auto}.modal{width:96vw!important}}
@media print{.ledger-actions,.topbar,.drawer,.bottom-nav,.fab,.table-toolbar .tools,.btn{display:none!important}.ledger-title-card,.card{box-shadow:none!important;border:1px solid #ddd!important}.page{padding:0!important;margin:0!important}.data-table{min-width:0!important}}
`;
    document.head.appendChild(st);
    document.body.classList.add('oskar-advanced-ready');
    document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute('content',TEAL);});
  }

  function normalizeUnits(p){
    p = p || {};
    var units=[];
    function push(u){
      if(!u) return;
      var name=txt(u.name||u.unitName||u.label); if(!name || name==='قطعة') return;
      var pieces=Math.max(1,num(u.pieces||u.piecesPerUnit||u.factor||u.qty||u.count));
      if(units.some(function(x){return low(x.name)===low(name);})) return;
      units.push({id:u.id||uid('unit'),name:name,symbol:txt(u.symbol||u.code||name.slice(0,2)),pieces:pieces,piecesPerUnit:pieces,buyPrice:num(u.buyPrice||u.purchasePrice||0),salePrice:num(u.salePrice||u.unitSalePrice||0),pieceSalePrice:num(u.pieceSalePrice||0)});
    }
    (p.purchaseUnits||p.unitsMeta||p.extraUnits||p.saleUnits||[]).forEach(push);
    if(p.cartonSize || p.cartonPrice){ push({name:p.cartonName||'كرتونة',symbol:'CT',pieces:p.cartonSize,buyPrice:p.cartonPurchasePrice||0,salePrice:p.cartonPrice,pieceSalePrice:p.salePrice}); }
    return units;
  }
  function setProductUnits(p, units){ p.purchaseUnits = units; p.unitsMeta = units; }
  function ensureGlobalUnit(u){
    var name=txt(u&&u.name); if(!name || name==='قطعة') return;
    var units=arr('units');
    var ex=units.find(function(x){return low(x.name)===low(name);});
    if(ex){ ex.symbol = ex.symbol || u.symbol || ''; ex.pieces = num(ex.pieces||ex.piecesPerUnit||u.pieces||1); ex.piecesPerUnit = ex.pieces; return ex; }
    ex={id:uid('unit'),name:name,symbol:txt(u.symbol||name.slice(0,2)),pieces:Math.max(1,num(u.pieces||u.piecesPerUnit||1)),piecesPerUnit:Math.max(1,num(u.pieces||u.piecesPerUnit||1)),createdAt:now(),createdBy:currentUserName()};
    units.unshift(ex); return ex;
  }
  function unitOptionsForProduct(p, selected){
    var units=normalizeUnits(p);
    var html='<option value="piece" '+(!selected||selected==='piece'?'selected':'')+'>قطعة</option>';
    units.forEach(function(u){ html += '<option value="'+esc(u.id||u.name)+'" '+(String(selected||'')===String(u.id||u.name)?'selected':'')+'>'+esc(u.name)+' ('+num(u.pieces)+' قطعة)</option>'; });
    html += '<option value="custom" '+(selected==='custom'?'selected':'')+'>وحدة مخصصة</option>';
    return html;
  }
  function findUnit(p, key){
    if(!key || key==='piece') return {id:'piece',name:'قطعة',symbol:'قطعة',pieces:1,piecesPerUnit:1,buyPrice:num(p.purchasePrice),salePrice:num(p.salePrice||p.price),pieceSalePrice:num(p.salePrice||p.price)};
    return normalizeUnits(p).find(function(u){ return String(u.id)===String(key) || String(u.name)===String(key); });
  }
  function productById(id){ return arr('products').find(function(p){return String(p.id)===String(id);}); }
  function addUnitToProduct(productId, data){
    var p=productById(productId); if(!p) return null;
    var units=normalizeUnits(p);
    var name=txt(data.name); if(!name) { toast('أدخل اسم الوحدة'); return null; }
    if(name==='قطعة'){ toast('اسم قطعة موجود مسبقًا'); return null; }
    if(units.some(function(u){return low(u.name)===low(name);}) || arr('units').some(function(u){return low(u.name)===low(name) && String(u.productId||'')===String(productId);})){
      toast('اسم الوحدة موجود، اختر اسمًا فريدًا'); return null;
    }
    var pieces=Math.max(1,num(data.pieces));
    var u={id:uid('u'),name:name,symbol:txt(data.symbol||name.slice(0,2)),pieces:pieces,piecesPerUnit:pieces,buyPrice:num(data.buyPrice),salePrice:num(data.salePrice),pieceSalePrice:num(data.pieceSalePrice)};
    units.push(u); setProductUnits(p,units); ensureGlobalUnit(u); save(); return u;
  }

  function accountName(id){ var a=arr('accounts').find(function(x){return String(x.id)===String(id);}); return a ? (a.name||a.code||id) : (id||''); }
  function customerPhone(c){ return txt(c && (c.phone||c.mobile||c.whatsapp)); }
  function customerMatch(c, r){
    if(!c || !r) return false;
    var id=txt(c.id), name=txt(c.name), phone=customerPhone(c);
    return (!!id && (txt(r.customerId)===id || txt(r.partyId)===id)) || (!!name && (txt(r.customerName)===name || txt(r.partyName)===name)) || (!!phone && (txt(r.customerPhone||r.partyPhone||r.phone||r.mobile)===phone));
  }
  function computedCustomerBalance(c){
    c=c||{};
    var debtRows=active(arr('debts')).filter(function(d){return (d.partyType==='customer'||!d.partyType) && customerMatch(c,d);});
    var debtTotal=debtRows.reduce(function(s,d){return s+Math.max(0,num(d.remaining!==undefined?d.remaining:(num(d.amount)-num(d.paid))));},0);
    var extraDue=active(arr('sales')).filter(function(s){return customerMatch(c,s)&&num(s.due)>0;}).reduce(function(sum,s){
      var linked=debtRows.some(function(d){return (txt(d.sourceId)&&txt(d.sourceId).indexOf(txt(s.id))>-1) || txt(d.note)===txt(s.invoiceNo) || txt(d.invoiceNo)===txt(s.invoiceNo) || txt(d.referenceNo)===txt(s.invoiceNo) || txt(d.source)===txt(s.invoiceNo);});
      return sum + (linked ? 0 : num(s.due));
    },0);
    return num(c.openingBalance) + debtTotal + extraDue;
  }
  function installCustomerBalance(){
    window.customerDebt = computedCustomerBalance;
    try{ customerDebt = computedCustomerBalance; }catch(e){}
    window.renderCustomersFinal = function(){
      var rows=active(arr('customers'));
      rows.forEach(function(c){ c.balance = computedCustomerBalance(c); });
      var total=rows.reduce(function(s,c){return s+num(c.balance);},0);
      var cards=rows.map(function(c){return '<div class="customer-card" onclick="openCustomerLedgerSmart(\''+esc(c.id)+'\',\''+esc(c.name||'')+'\',\''+esc(customerPhone(c))+'\')"><div><b>'+esc(c.name||'-')+'</b><div class="muted">'+esc(customerPhone(c)||'بدون رقم')+'</div><div class="mini-stat">الرصيد: '+money(c.balance)+'</div></div><div class="tools"><button class="btn small success" onclick="event.stopPropagation();openCustomerLedgerSmart(\''+esc(c.id)+'\',\''+esc(c.name||'')+'\',\''+esc(customerPhone(c))+'\')">السجل</button><button class="btn small ghost" onclick="event.stopPropagation();openForm(\''+esc(c.id)+'\')">تعديل</button></div></div>';}).join('')||'<div class="muted">لا توجد بيانات</div>';
      var rowsHtml=rows.map(function(c){return '<tr class="customer-row" onclick="openCustomerLedgerSmart(\''+esc(c.id)+'\',\''+esc(c.name||'')+'\',\''+esc(customerPhone(c))+'\')"><td><b>'+esc(c.name||'')+'</b></td><td>'+esc(customerPhone(c))+'</td><td>'+esc(c.email||'')+'</td><td><b class="'+(num(c.balance)>0?'balance-red':'balance-ok')+'">'+money(c.balance)+'</b></td><td><button class="btn small success" onclick="event.stopPropagation();openCustomerLedgerSmart(\''+esc(c.id)+'\',\''+esc(c.name||'')+'\',\''+esc(customerPhone(c))+'\')">سجل العميل</button> <button class="btn small ghost" onclick="event.stopPropagation();openForm(\''+esc(c.id)+'\')">تعديل</button></td></tr>';}).join('');
      var html='<div class="kpis"><div class="kpi"><span>عدد العملاء</span><strong>'+rows.length+'</strong></div><div class="kpi"><span>إجمالي الأرصدة</span><strong>'+money(total)+'</strong></div><div class="kpi"><span>عملاء عليهم رصيد</span><strong>'+rows.filter(function(c){return num(c.balance)>0;}).length+'</strong></div></div><div class="table-toolbar"><div class="tools"><button class="btn primary" onclick="openForm()">+ عميل جديد</button><button class="btn ghost" onclick="window.print()">طباعة</button></div></div><div class="mobile-card-list">'+cards+'</div><div class="table-wrap" style="margin-top:12px"><table class="data-table"><thead><tr><th>العميل</th><th>الهاتف</th><th>الإيميل</th><th>الرصيد</th><th>خيار</th></tr></thead><tbody>'+rowsHtml+'</tbody><tfoot><tr><td colspan="3">المجموع</td><td>'+money(total)+'</td><td></td></tr></tfoot></table></div>';
      if($('mainCard')) { $('mainCard').dataset.r4View='customers'; $('mainCard').innerHTML=html; }
      save();
    };
    try{ renderCustomersFinal = window.renderCustomersFinal; renderCustomers = window.renderCustomersFinal; }catch(e){}
  }

  function ledgerTable(rows, cols, empty){
    return '<div class="table-wrap"><table class="data-table"><thead><tr>'+cols.map(function(c){return '<th>'+esc(c.label)+'</th>';}).join('')+'</tr></thead><tbody>'+(rows.length?rows.map(function(r){return '<tr>'+cols.map(function(c){return '<td>'+(c.fn?c.fn(r):esc(r[c.key]||''))+'</td>';}).join('')+'</tr>';}).join(''):'<tr><td colspan="'+cols.length+'" style="text-align:center;color:#6b7280">'+esc(empty||'لا توجد بيانات')+'</td></tr>')+'</tbody></table></div>';
  }
  function collectCustomerLedgerR4(id,name,phone){
    var c=arr('customers').find(function(x){return String(x.id)===String(id);}) || arr('customers').find(function(x){return phone && customerPhone(x)===txt(phone);}) || arr('customers').find(function(x){return name && txt(x.name)===txt(name);}) || {id:id||'',name:name||'عميل',phone:phone||''};
    var invoices=active(arr('sales')).filter(function(s){return customerMatch(c,s);}).map(function(x){x._type='فاتورة';return x;});
    var drafts=active(arr('draftSales')).filter(function(s){return customerMatch(c,s);}).map(function(x){x._type='مسودة';return x;});
    var quotes=active(arr('quotations')).filter(function(s){return customerMatch(c,s);}).map(function(x){x._type='عرض سعر';return x;});
    var debts=active(arr('debts')).filter(function(d){return (d.partyType==='customer'||!d.partyType)&&customerMatch(c,d);});
    var payments=active(arr('debtPayments')).filter(function(p){return debts.some(function(d){return String(d.id)===String(p.debtId);}) || txt(p.partyName)===txt(c.name) || txt(p.partyPhone||p.phone)===customerPhone(c);});
    var allInv=invoices.concat(drafts,quotes).sort(function(a,b){return String(b.date||'').localeCompare(String(a.date||''));});
    var balance=computedCustomerBalance(c);
    return {customer:c,name:c.name||name||'عميل',phone:customerPhone(c)||phone||'',invoices:allInv,debts:debts,payments:payments,balance:balance,totalSales:allInv.reduce(function(s,x){return s+num(x.total);},0),totalPaid:allInv.reduce(function(s,x){return s+num(x.paid);},0),totalDue:allInv.reduce(function(s,x){return s+num(x.due);},0)};
  }
  function customerLedgerHTMLR4(data){
    var invCols=[{label:'النوع',key:'_type'},{label:'التاريخ',key:'date'},{label:'رقم الفاتورة',key:'invoiceNo'},{label:'الحالة',key:'paymentStatus'},{label:'الطريقة',key:'paymentMethod'},{label:'الإجمالي',fn:function(r){return money(r.total);}},{label:'المدفوع',fn:function(r){return money(r.paid);}},{label:'المتبقي',fn:function(r){return money(r.due);}}];
    var debtCols=[{label:'التاريخ',key:'date'},{label:'المصدر',key:'source'},{label:'الملاحظة',key:'note'},{label:'المبلغ',fn:function(r){return money(r.amount);}},{label:'المدفوع',fn:function(r){return money(r.paid);}},{label:'المتبقي',fn:function(r){return money(r.remaining!==undefined?r.remaining:(num(r.amount)-num(r.paid)));}},{label:'الحالة',key:'status'}];
    var payCols=[{label:'التاريخ',key:'date'},{label:'المبلغ',fn:function(r){return money(r.amount);}},{label:'الحساب',fn:function(r){return accountName(r.accountId);}},{label:'ملاحظة',key:'note'}];
    return '<div class="kpis"><div class="kpi"><span>رصيد العميل</span><strong>'+money(data.balance)+'</strong></div><div class="kpi"><span>إجمالي الفواتير</span><strong>'+money(data.totalSales)+'</strong></div><div class="kpi"><span>المدفوع</span><strong>'+money(data.totalPaid)+'</strong></div><div class="kpi"><span>المتبقي بالفواتير</span><strong>'+money(data.totalDue)+'</strong></div></div><div class="ledger-section"><h3>سجل الفواتير مكتملة وغير مكتملة</h3>'+ledgerTable(data.invoices,invCols,'لا توجد فواتير')+'</div><div class="ledger-section"><h3>سجل الديون</h3>'+ledgerTable(data.debts,debtCols,'لا توجد ديون')+'</div><div class="ledger-section"><h3>سجل دفعات السداد</h3>'+ledgerTable(data.payments,payCols,'لا توجد دفعات')+'</div>';
  }
  window.openCustomerLedgerSmart = function(id,name,phone){
    var data=collectCustomerLedgerR4(id,name,phone);
    var html='<div class="ledger-title-card"><h2 style="margin:0;color:#304d56">سجل العميل - '+esc(data.name)+'</h2><div class="muted">'+esc(data.phone||'بدون رقم')+'</div><div class="ledger-actions"><button class="btn ghost" onclick="renderPage&&renderPage()">رجوع</button><button class="btn primary" onclick="printCustomerLedgerR4(\''+esc(id||data.customer.id||'')+'\',\''+esc(data.name)+'\',\''+esc(data.phone)+'\')">طباعة / PDF</button><button class="btn success" onclick="downloadCustomerLedgerR4(\''+esc(id||data.customer.id||'')+'\',\''+esc(data.name)+'\',\''+esc(data.phone)+'\',\'csv\')">CSV</button><button class="btn success" onclick="downloadCustomerLedgerR4(\''+esc(id||data.customer.id||'')+'\',\''+esc(data.name)+'\',\''+esc(data.phone)+'\',\'xls\')">Excel</button></div></div>'+customerLedgerHTMLR4(data);
    if($('mainCard')) { $('mainCard').dataset.r4View='customer-ledger'; $('mainCard').innerHTML=html; } else if(window.openModal) window.openModal('سجل العميل',html);
  };
  window.openCustomerLedger = function(id){ return window.openCustomerLedgerSmart(id,'',''); };
  try{ openCustomerLedger = window.openCustomerLedger; }catch(e){}
  window.printCustomerLedgerR4 = function(id,name,phone){
    var data=collectCustomerLedgerR4(id,name,phone);
    var w=window.open('','_blank'); if(!w) return;
    w.document.write('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>سجل العميل</title><style>body{font-family:Cairo,Arial;margin:0;padding:18px;color:#111}button{padding:10px 18px;margin-bottom:12px}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.kpi{border:1px solid #ddd;padding:10px}.kpi span{display:block;color:#555}.kpi strong{font-size:20px}table{width:100%;border-collapse:collapse;margin:8px 0 18px}th,td{border:1px solid #ddd;padding:7px;text-align:right;font-size:12px}th{background:#f1f5f5}@media print{button{display:none}}</style></head><body><button onclick="print()">طباعة / حفظ PDF</button><h1>سجل العميل - '+esc(data.name)+'</h1><p>'+esc(data.phone||'')+'</p>'+customerLedgerHTMLR4(data)+'</body></html>');
    w.document.close(); setTimeout(function(){w.print();},350);
  };
  function csvDownload(rows, filename, excel){
    var csv=rows.map(function(row){return row.map(function(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"';}).join(',');}).join('\n');
    var blob=new Blob(['\ufeff'+csv],{type:excel?'application/vnd.ms-excel;charset=utf-8':'text/csv;charset=utf-8'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(function(){URL.revokeObjectURL(a.href);},1200);
  }
  window.downloadCustomerLedgerR4 = function(id,name,phone,type){
    var d=collectCustomerLedgerR4(id,name,phone); var rows=[['القسم','التاريخ','الرقم/المصدر','الحالة','طريقة/حساب','الإجمالي/المبلغ','المدفوع','المتبقي','ملاحظة']];
    d.invoices.forEach(function(r){rows.push(['فاتورة '+(r._type||''),r.date||'',r.invoiceNo||'',r.paymentStatus||'',r.paymentMethod||'',num(r.total),num(r.paid),num(r.due),r.note||'']);});
    d.debts.forEach(function(r){rows.push(['دين',r.date||'',r.source||'',r.status||'',r.partyName||'',num(r.amount),num(r.paid),num(r.remaining!==undefined?r.remaining:(num(r.amount)-num(r.paid))),r.note||'']);});
    d.payments.forEach(function(r){rows.push(['دفعة',r.date||'',r.debtId||'', '', accountName(r.accountId), num(r.amount), '', '', r.note||'']);});
    csvDownload(rows,'سجل-'+(d.name||'عميل')+(type==='xls'?'.xls':'.csv'),type==='xls');
  };

  function addProductRowHTML(p){ return '<div class="product-card" onclick="addProductToCart(\''+esc(p.id)+'\')"><b>'+esc(p.name||'صنف')+'</b><div class="muted">'+esc(p.sku||p.barcode||'')+'</div><div>'+money(p.salePrice||p.price||0)+' · المخزون: '+num(p.stockUnits!==undefined?p.stockUnits:p.stock).toFixed(3).replace(/\.000$/,'')+' قطعة</div></div>'; }
  function salesCount(pid){ var n=0; active(arr('sales')).forEach(function(s){(s.items||[]).forEach(function(i){ if(String(i.productId)===String(pid)) n+=num(i.qty); });}); return n; }
  function installProductResults(){
    window.showProductResults = function(q){
      var el=$('productResults'); if(!el) return;
      var text=txt(q), rows=active(arr('products'));
      if(text){ var l=low(text); rows=rows.filter(function(p){return low([p.name,p.sku,p.barcode,p.group,p.brand].join(' ')).indexOf(l)>-1;}); }
      else rows=rows.sort(function(a,b){return salesCount(b.id)-salesCount(a.id);}).slice(0, window.innerWidth<=760 ? 4 : 6);
      if(!rows.length){ el.innerHTML='<div class="muted">لا نتائج</div>'; return; }
      if(!text){
        el.innerHTML='<div class="popular-strip"><div class="popular-title">الأكثر طلبًا</div><div class="popular-grid">'+rows.map(function(p){return '<div class="popular-card" onclick="addProductToCart(\''+esc(p.id)+'\')"><b>'+esc(p.name||'صنف')+'</b><small>'+money(p.salePrice||p.price||0)+'</small></div>';}).join('')+'</div></div>';
      }else el.innerHTML=rows.map(addProductRowHTML).join('');
    };
    try{ showProductResults = window.showProductResults; }catch(e){}
  }

  function applyUnitToSaleItem(item,key){
    var p=productById(item.productId)||{}; var u=findUnit(p,key) || findUnit(p,'piece');
    item.unitChoice = key || 'piece'; item.saleUnitId = u.id||u.name||'piece'; item.unit = u.name || 'قطعة'; item.unitName = item.unit; item.factor = Math.max(1,num(u.pieces||u.piecesPerUnit||1)); item.piecesPerUnit=item.factor;
    var pieceCost=num(p.purchasePrice||item.purchasePrice||0);
    item.purchasePrice=pieceCost; item.costPerPiece=pieceCost;
    if(item.unitChoice==='piece'){ item.unitPrice=num(p.salePrice||p.price||item.unitPrice||0); }
    else { item.unitPrice=num(u.salePrice||item.unitPrice||num(p.salePrice||p.price||0)*item.factor); }
    item.qty=num(item.qty||1); item.discount=num(item.discount||0); item.stockQty=item.qty*item.factor; item.total=Math.max(0,item.qty*item.unitPrice-item.discount); item.cost=item.stockQty*pieceCost; item.profit=item.total-item.cost;
  }
  window.addProductToCart = function(id){
    var p=productById(id); if(!p) return;
    var item={productId:p.id,name:p.name,sku:p.sku,barcode:p.barcode,qty:1,discount:0,unitChoice:'piece'};
    applyUnitToSaleItem(item,'piece');
    var c=getCart(); c.push(item); setCart(c); window.renderCart&&window.renderCart();
  };
  try{ addProductToCart = window.addProductToCart; }catch(e){}
  window.changeSaleUnit = function(idx,key){ var c=getCart(), item=c[idx]; if(!item) return; if(key==='custom'){ openCustomUnitModal(item.productId, function(u){ item.unitChoice=u.id; applyUnitToSaleItem(item,u.id); renderCart(); }); return; } applyUnitToSaleItem(item,key); renderCart(); };
  window.updateSaleItem = function(idx,field,value){ var c=getCart(), item=c[idx]; if(!item) return; item[field]=value; applyUnitToSaleItem(item,item.unitChoice||'piece'); renderCart(); };

  function renderSaleCart(){
    var c=getCart(); c.forEach(function(i){applyUnitToSaleItem(i,i.unitChoice||'piece');});
    var el=$('cartBody'); if(!el) return;
    var rows=c.map(function(i,idx){ var p=productById(i.productId)||{}; return '<tr><td class="name-cell"><b>'+esc(i.name)+'</b><div class="unit-mini">المخزون المحسوب: '+num(i.stockQty).toFixed(3).replace(/\.000$/,'')+' قطعة</div></td><td class="unit-cell"><select onchange="changeSaleUnit('+idx+',this.value)">'+unitOptionsForProduct(p,i.unitChoice)+'</select></td><td><input type="number" step="0.001" value="'+esc(i.qty)+'" onchange="updateSaleItem('+idx+',\'qty\',this.value)"></td><td><input type="number" step="0.01" value="'+esc(i.unitPrice)+'" onchange="updateSaleItem('+idx+',\'unitPrice\',this.value)"></td><td><input type="number" step="0.01" value="'+esc(i.discount)+'" onchange="updateSaleItem('+idx+',\'discount\',this.value)"></td><td class="calc-cell">'+money(i.total)+'</td><td><button class="btn small danger" onclick="cart.splice('+idx+',1);renderCart()">×</button></td></tr>'; }).join('') || '<tr><td colspan="7" style="text-align:center;color:#6b7280">لا توجد أصناف</td></tr>';
    el.innerHTML=rows;
    var table=el.closest('table'); if(table){ table.classList.add('advanced-cart-table'); var th=table.querySelector('thead tr'); if(th && th.children.length!==7) th.innerHTML='<th>الصنف</th><th>وحدة البيع</th><th>الكمية</th><th>سعر البيع</th><th>خصم</th><th>المجموع</th><th>حذف</th>'; }
    updateTotalsFromCart();
  }
  function updateTotalsFromCart(){
    var total=getCart().reduce(function(s,i){return s+num(i.total);},0); var disc=num($('discountAmount')&&$('discountAmount').value); var ship=num($('shippingAmount')&&$('shippingAmount').value); var grand=Math.max(0,total-disc+ship);
    if($('grandTotal')) $('grandTotal').textContent=money(grand);
    var pay=$('payAmount'); if(pay && !pay.dataset.touched) pay.value=grand.toFixed(2);
    if($('dueAmount')) $('dueAmount').textContent=money(Math.max(0,grand-num(pay&&pay.value)));
  }

  function openCustomUnitModal(productId, cb){
    var p=productById(productId)||{};
    var html='<form id="customUnitForm" class="grid"><div class="field"><label>اسم الوحدة الفريد</label><input name="name" required placeholder="مثال: كرتونة / كيلو"></div><div class="field"><label>رمز الوحدة</label><input name="symbol" placeholder="مثال: CT"></div><div class="field"><label>كم قطعة تحتوي</label><input name="pieces" type="number" step="0.001" value="1" required></div><div class="field"><label>سعر شراء الوحدة</label><input name="buyPrice" type="number" step="0.01"></div><div class="field"><label>سعر بيع الوحدة</label><input name="salePrice" type="number" step="0.01"></div><div class="field"><label>سعر بيع القطعة</label><input name="pieceSalePrice" type="number" step="0.01" value="'+esc(p.salePrice||p.price||0)+'"></div></form><div class="tools" style="margin-top:12px"><button class="btn success" id="saveCustomUnitBtn">حفظ الوحدة</button></div>';
    if($('modalTitle')) $('modalTitle').textContent='وحدة مخصصة'; if($('modalBody')) $('modalBody').innerHTML=html; if($('modalBack')) $('modalBack').style.display='flex';
    setTimeout(function(){ var b=$('saveCustomUnitBtn'); if(!b) return; b.onclick=function(){ var f=$('customUnitForm'); var data=Object.fromEntries(new FormData(f).entries()); var u=addUnitToProduct(productId,data); if(!u) return; if($('modalBack')) $('modalBack').style.display='none'; if(typeof cb==='function') cb(u); toast('تم حفظ الوحدة وإضافتها لوحدات الصنف'); }; },0);
  }

  function addPurchaseProduct(id){
    var p=productById(id); if(!p) return;
    var item={context:'purchase',productId:p.id,name:p.name,sku:p.sku,qty:1,discount:0,unitChoice:'piece',unit:'قطعة',unitName:'قطعة',piecesPerUnit:1,factor:1,unitBuyPrice:num(p.purchasePrice),unitSalePrice:num(p.salePrice||p.price),pieceSalePrice:num(p.salePrice||p.price)};
    calcPurchaseItem(item); var c=getCart(); c.push(item); setCart(c); renderCart();
  }
  window.addPurchaseProductToCart = addPurchaseProduct;
  function calcPurchaseItem(i){
    i.qty=num(i.qty||1); i.piecesPerUnit=Math.max(1,num(i.piecesPerUnit||i.factor||1)); i.factor=i.piecesPerUnit; i.unitBuyPrice=num(i.unitBuyPrice); i.unitSalePrice=num(i.unitSalePrice); i.pieceSalePrice = i.piecesPerUnit ? num(i.unitSalePrice)/i.piecesPerUnit : num(i.pieceSalePrice); if(num(i.pieceSalePrice)) i.unitSalePrice = num(i.unitSalePrice)||num(i.pieceSalePrice)*i.piecesPerUnit; i.stockQty=i.qty*i.piecesPerUnit; i.unitPrice=i.unitBuyPrice; i.total=Math.max(0,i.qty*i.unitBuyPrice-num(i.discount)); i.purchasePiecePrice=i.piecesPerUnit?i.unitBuyPrice/i.piecesPerUnit:i.unitBuyPrice;
  }
  window.changePurchaseUnit = function(idx,key){ var c=getCart(), i=c[idx]; if(!i) return; var p=productById(i.productId)||{}; if(key==='custom'){ openCustomUnitModal(i.productId,function(u){ i.unitChoice=u.id; i.unit=u.name; i.unitName=u.name; i.piecesPerUnit=num(u.pieces); i.factor=i.piecesPerUnit; i.unitBuyPrice=num(u.buyPrice); i.unitSalePrice=num(u.salePrice); i.pieceSalePrice=num(u.pieceSalePrice)||num(u.salePrice)/Math.max(1,num(u.pieces)); calcPurchaseItem(i); renderCart(); }); return; } var u=findUnit(p,key)||findUnit(p,'piece'); i.unitChoice=key||'piece'; i.unit=u.name; i.unitName=u.name; i.piecesPerUnit=Math.max(1,num(u.pieces)); i.factor=i.piecesPerUnit; i.unitBuyPrice=num(u.buyPrice)||num(p.purchasePrice)*i.piecesPerUnit; i.unitSalePrice=num(u.salePrice)||num(p.salePrice||p.price)*i.piecesPerUnit; i.pieceSalePrice=num(u.pieceSalePrice)||num(p.salePrice||p.price); calcPurchaseItem(i); renderCart(); };
  window.updatePurchaseItem=function(idx,field,value){ var c=getCart(), i=c[idx]; if(!i) return; i[field]=value; if(field==='pieceSalePrice') i.unitSalePrice=num(value)*Math.max(1,num(i.piecesPerUnit)); calcPurchaseItem(i); renderCart(); };
  function renderPurchaseCart(){
    var c=getCart(); c.forEach(calcPurchaseItem); var el=$('cartBody'); if(!el) return;
    el.innerHTML=c.map(function(i,idx){ var p=productById(i.productId)||{}; var label=esc(i.unitName||i.unit||'قطعة'); return '<tr><td class="name-cell"><b>'+esc(i.name)+'</b><div class="unit-mini">إضافة للمخزون: '+num(i.stockQty).toFixed(3).replace(/\.000$/,'')+' قطعة</div></td><td class="unit-cell"><select onchange="changePurchaseUnit('+idx+',this.value)">'+unitOptionsForProduct(p,i.unitChoice)+'</select></td><td><input type="number" step="0.001" value="'+esc(i.qty)+'" onchange="updatePurchaseItem('+idx+',\'qty\',this.value)"></td><td><input type="number" step="0.01" value="'+esc(i.unitBuyPrice)+'" onchange="updatePurchaseItem('+idx+',\'unitBuyPrice\',this.value)" placeholder="شراء '+label+'"></td><td><input type="number" step="0.01" value="'+esc(i.unitSalePrice)+'" onchange="updatePurchaseItem('+idx+',\'unitSalePrice\',this.value)" placeholder="بيع '+label+'"></td><td><input type="number" step="0.01" value="'+esc(i.pieceSalePrice)+'" onchange="updatePurchaseItem('+idx+',\'pieceSalePrice\',this.value)" placeholder="بيع القطعة"></td><td><input type="number" step="0.01" value="'+esc(i.discount||0)+'" onchange="updatePurchaseItem('+idx+',\'discount\',this.value)"></td><td class="calc-cell">'+money(i.total)+'</td><td><button class="btn small danger" onclick="cart.splice('+idx+',1);renderCart()">×</button></td></tr>'; }).join('') || '<tr><td colspan="9" style="text-align:center;color:#6b7280">لا توجد مشتريات</td></tr>';
    var table=el.closest('table'); if(table){ table.classList.add('advanced-cart-table'); var th=table.querySelector('thead tr'); if(th) th.innerHTML='<th>المنتج</th><th>الوحدة</th><th>الكمية</th><th>سعر شراء الوحدة</th><th>سعر بيع الوحدة</th><th>سعر بيع القطعة</th><th>خصم</th><th>المجموع</th><th>حذف</th>'; }
    updateTotalsFromCart();
  }
  window.renderCart = function(){ if(isPurchasePage()) return renderPurchaseCart(); return renderSaleCart(); };
  try{ renderCart = window.renderCart; }catch(e){}

  function showPurchaseResults(q){
    var el=$('productResults'); if(!el) return; var text=txt(q), rows=active(arr('products'));
    if(text){ var l=low(text); rows=rows.filter(function(p){return low([p.name,p.sku,p.barcode,p.group,p.brand].join(' ')).indexOf(l)>-1;}); } else rows=rows.slice(0,8);
    el.innerHTML = rows.length ? rows.map(function(p){return '<div class="product-card" onclick="addPurchaseProductToCart(\''+esc(p.id)+'\')"><b>'+esc(p.name||'صنف')+'</b><div class="muted">'+esc(p.sku||p.barcode||'')+'</div><div>شراء: '+money(p.purchasePrice||0)+' · بيع القطعة: '+money(p.salePrice||p.price||0)+'</div></div>';}).join('') : '<div class="muted">لا نتائج</div>';
  }
  window.renderPurchaseForm = function(){
    setCart([]);
    if(!$('mainCard')) return;
    $('mainCard').dataset.r4View='purchase';
    $('mainCard').innerHTML='<div class="advanced-form-card"><h3 class="advanced-form-title">إضافة مشتريات</h3><div class="grid"><div class="field"><label>اختر المورد</label><select id="supplierId">'+supplierOptions('')+'</select></div><div class="field"><label>الحساب الذي سيتم الدفع منه</label><select id="accountId">'+accountOptions('')+'</select></div><div class="field"><label>الفرع</label><select id="branch">'+branchOptions('')+'</select></div><div class="field"><label>تاريخ الشراء</label><input id="purchaseDate" type="date" value="'+today()+'"></div><div class="field"><label>الرقم المرجعي</label><input id="referenceNo" placeholder="اتركه فارغًا للإنشاء التلقائي"></div><div class="field"><label>حالة الشراء</label><select id="purchaseStatus"><option>استلام</option><option>في الانتظار</option><option>ملغي</option></select></div></div></div><div class="card"><div class="table-toolbar"><div class="scan-input-row"><input class="search" id="productSearch" placeholder="ابحث عن المنتج يدويًا أو امسح QR / باركود" oninput="showPurchaseResults(this.value)"><button class="btn ghost" onclick="startScanner&&startScanner(v=>{document.getElementById(\'productSearch\').value=v;showPurchaseResults(v);})">كاميرا QR</button><button class="btn primary" onclick="location.href=\'إضافة-صنف.html\'">+ منتج</button></div></div><div id="productResults" class="product-results"></div><div class="table-wrap"><table class="data-table advanced-cart-table"><thead><tr><th>المنتج</th><th>الوحدة</th><th>الكمية</th><th>سعر شراء الوحدة</th><th>سعر بيع الوحدة</th><th>سعر بيع القطعة</th><th>خصم</th><th>المجموع</th><th>حذف</th></tr></thead><tbody id="cartBody"></tbody></table></div></div><div class="card"><h3>إضافة الدفع</h3><div class="grid"><div class="field"><label>الإجمالي</label><b id="grandTotal">0.00</b></div><div class="field"><label>المبلغ المدفوع</label><input id="payAmount" type="number" step="0.01" value="0" oninput="this.dataset.touched=1;renderCart()"></div><div class="field"><label>طريقة الدفع</label><select id="paymentMethod"><option>نقدي</option><option>تحويل بنكي</option><option>تطبيق فوري</option><option>تطبيق لاحق</option></select></div><div class="field"><label>ملاحظة الدفع</label><input id="paymentNote"></div><div class="field"><label>المبلغ المستحق</label><b id="dueAmount" style="color:#dc2626">0.00</b></div></div></div><div class="tools" style="justify-content:center"><button class="btn purple" onclick="savePurchase()">حفظ المشتريات</button></div>';
    window.showPurchaseResults = showPurchaseResults; try{ showProductResults = showPurchaseResults; window.showProductResults=showPurchaseResults; }catch(e){}
    showPurchaseResults(''); renderCart();
  };
  try{ renderPurchaseForm = window.renderPurchaseForm; }catch(e){}
  window.savePurchase=function(){
    var c=getCart(); if(!c.length){ toast('أضف منتجات أولاً'); return; }
    c.forEach(calcPurchaseItem);
    var total=c.reduce(function(s,i){return s+num(i.total);},0), paid=num($('payAmount')&&$('payAmount').value), due=Math.max(0,total-paid);
    var sup=arr('suppliers').find(function(s){return String(s.id)===String($('supplierId')&&$('supplierId').value);}); var account=($('accountId')&&$('accountId').value)||'cash-main';
    if(!sup){ toast('اختر المورد'); return; } if(paid>0 && !account){ toast('اختر الحساب الذي سيتم الدفع منه'); return; }
    var rec={id:uid('pur'),date:($('purchaseDate')&&$('purchaseDate').value)||today(),referenceNo:($('referenceNo')&&$('referenceNo').value)||('PUR-'+Date.now()),supplierId:sup.id,supplierName:sup.name||'مورد',branch:($('branch')&&$('branch').value)||'',items:JSON.parse(JSON.stringify(c)),total:total,paid:paid,due:due,paymentStatus:due>0?'مستحق':'مدفوع',purchaseStatus:($('purchaseStatus')&&$('purchaseStatus').value)||'استلام',accountId:account,note:($('paymentNote')&&$('paymentNote').value)||'',createdAt:now(),createdBy:currentUserName()};
    arr('purchases').unshift(rec);
    if(paid>0 && typeof window.addMovement==='function') window.addMovement(account,'out',paid,'مشتريات '+rec.referenceNo,rec.note,'purchase:'+rec.id);
    if(due>0 && typeof window.addDebt==='function') window.addDebt('supplier',sup.id,rec.supplierName,due,rec.referenceNo,'مستحق مورد','purchase:'+rec.id);
    c.forEach(function(i){ var p=productById(i.productId); if(!p) return; p.stock=num(p.stock)+num(i.stockQty); p.stockUnits=p.stock; p.purchasePrice=num(i.purchasePiecePrice); p.salePrice=num(i.pieceSalePrice)||num(p.salePrice); p.price=p.salePrice; var units=normalizeUnits(p); if(i.unitChoice && i.unitChoice!=='piece'){ var u=units.find(function(x){return String(x.id)===String(i.unitChoice)||String(x.name)===String(i.unitName);}); if(u){ u.buyPrice=num(i.unitBuyPrice); u.salePrice=num(i.unitSalePrice); u.pieceSalePrice=num(i.pieceSalePrice); u.pieces=num(i.piecesPerUnit); u.piecesPerUnit=u.pieces; } setProductUnits(p,units); }
      arr('stockMovements').unshift({id:uid('stk'),date:now(),type:'شراء',product:p.name,productId:p.id,branch:rec.branch,qty:num(i.stockQty),unitName:i.unitName||'قطعة',piecesPerUnit:num(i.piecesPerUnit),note:rec.referenceNo});
    });
    save(); setCart([]); renderCart(); toast('تم حفظ المشتريات وتحديث الوحدات والمخزون');
  };
  try{ savePurchase=window.savePurchase; }catch(e){}

  window.renderProductForm=function(){
    if(!$('mainCard')) return;
    $('mainCard').dataset.r4View='product-form';
    $('mainCard').innerHTML='<div class="tools" style="justify-content:flex-start;margin-bottom:12px"><button class="btn ghost" onclick="startScanner&&startScanner(v=>{document.querySelector(\'[name=barcode]\').value=v;document.querySelector(\'[name=sku]\').value=v;})">مسح باركود بالكاميرا</button></div><form id="advancedProductForm" class="grid"><div class="field"><label>اسم المنتج *</label><input name="name" required></div><div class="field"><label>SKU / باركود</label><input name="sku"></div><div class="field"><label>باركود</label><input name="barcode"></div><div class="field"><label>الفرع</label><select name="branch">'+branchOptions('')+'</select></div><div class="field"><label>الوحدة الأساسية</label><input name="unit" value="قطعة"></div><div class="field"><label>المجموعة</label><select name="group"><option value="">اختر المجموعة</option>'+active(arr('groups')).map(function(g){return '<option>'+esc(g.name||g.id)+'</option>';}).join('')+'</select></div><div class="field"><label>الماركة</label><select name="brand"><option value="">اختر الماركة</option>'+active(arr('brands')).map(function(b){return '<option>'+esc(b.name||b.id)+'</option>';}).join('')+'</select></div><div class="field"><label>سعر شراء القطعة</label><input name="purchasePrice" type="number" step="0.01"></div><div class="field"><label>سعر بيع القطعة</label><input name="salePrice" type="number" step="0.01"></div><div class="field"><label>المخزون الافتتاحي بالقطعة</label><input name="stock" type="number" step="0.001"></div><div class="field full-row" style="grid-column:1/-1"><div class="unit-definition-box"><h3 style="margin:0 0 10px;color:#304d56">وحدة إضافية للمنتج</h3><div class="grid"><div class="field"><label>نوع الوحدة</label><select name="unitMode" onchange="toggleProductCustomUnit(this.value)"><option value="none">بدون</option><option value="existing">من وحدات الأصناف</option><option value="custom">وحدة مخصصة</option></select></div><div class="field existing-unit-field hide"><label>اختر وحدة</label><select name="existingUnit">'+active(arr('units')).map(function(u){return '<option value="'+esc(u.id)+'">'+esc(u.name)+' ('+num(u.pieces||u.piecesPerUnit||1)+' قطعة)</option>';}).join('')+'</select></div><div class="field custom-unit-field hide"><label>اسم الوحدة</label><input name="customUnitName" placeholder="مثال: كرتونة"></div><div class="field custom-unit-field hide"><label>رمز الوحدة</label><input name="customUnitSymbol" placeholder="CT"></div><div class="field unit-any-field hide"><label>كم قطعة تحتوي</label><input name="customUnitPieces" type="number" step="0.001" value="1"></div><div class="field unit-any-field hide"><label>سعر شراء الوحدة</label><input name="customUnitBuy" type="number" step="0.01"></div><div class="field unit-any-field hide"><label>سعر بيع الوحدة</label><input name="customUnitSale" type="number" step="0.01"></div></div></div></div><div class="field" style="grid-column:1/-1"><label>ملاحظات</label><textarea name="note"></textarea></div></form><div class="tools" style="justify-content:center;margin-top:14px"><button class="btn purple" onclick="saveProductAdvanced()">حفظ المنتج</button></div>';
  };
  try{ renderProductForm=window.renderProductForm; }catch(e){}
  window.toggleProductCustomUnit=function(mode){ document.querySelectorAll('.existing-unit-field').forEach(function(x){x.classList.toggle('hide',mode!=='existing');}); document.querySelectorAll('.custom-unit-field').forEach(function(x){x.classList.toggle('hide',mode!=='custom');}); document.querySelectorAll('.unit-any-field').forEach(function(x){x.classList.toggle('hide',mode==='none');}); };
  window.saveProductAdvanced=function(){
    var f=$('advancedProductForm'); if(!f) return; var data=Object.fromEntries(new FormData(f).entries()); if(!txt(data.name)){ toast('أدخل اسم المنتج'); return; }
    var p={id:uid('prod'),name:txt(data.name),sku:txt(data.sku),barcode:txt(data.barcode),branch:txt(data.branch),unit:txt(data.unit)||'قطعة',group:txt(data.group),brand:txt(data.brand),purchasePrice:num(data.purchasePrice),salePrice:num(data.salePrice),price:num(data.salePrice),stock:num(data.stock),stockUnits:num(data.stock),note:txt(data.note),createdAt:now(),createdBy:currentUserName(),purchaseUnits:[]};
    if(data.unitMode==='existing'){
      var gu=arr('units').find(function(u){return String(u.id)===String(data.existingUnit);}); if(gu){ p.purchaseUnits.push({id:uid('u'),name:gu.name,symbol:gu.symbol||'',pieces:Math.max(1,num(data.customUnitPieces||gu.pieces||gu.piecesPerUnit||1)),piecesPerUnit:Math.max(1,num(data.customUnitPieces||gu.pieces||gu.piecesPerUnit||1)),buyPrice:num(data.customUnitBuy),salePrice:num(data.customUnitSale),pieceSalePrice:num(data.customUnitSale)/Math.max(1,num(data.customUnitPieces||gu.pieces||gu.piecesPerUnit||1))}); }
    } else if(data.unitMode==='custom'){
      var name=txt(data.customUnitName); if(!name){ toast('أدخل اسم الوحدة المخصصة'); return; }
      if(arr('units').some(function(u){return low(u.name)===low(name);}) || name==='قطعة'){ toast('اسم الوحدة موجود، اختر اسمًا فريدًا'); return; }
      var u={id:uid('u'),name:name,symbol:txt(data.customUnitSymbol||name.slice(0,2)),pieces:Math.max(1,num(data.customUnitPieces)),piecesPerUnit:Math.max(1,num(data.customUnitPieces)),buyPrice:num(data.customUnitBuy),salePrice:num(data.customUnitSale),pieceSalePrice:num(data.customUnitSale)/Math.max(1,num(data.customUnitPieces))}; p.purchaseUnits.push(u); ensureGlobalUnit(u);
    }
    p.unitsMeta=p.purchaseUnits; arr('products').unshift(p); if(p.stock) arr('stockMovements').unshift({id:uid('stk'),date:now(),type:'رصيد افتتاحي',product:p.name,productId:p.id,branch:p.branch,qty:p.stock,note:'إضافة منتج'});
    save(); toast('تم حفظ المنتج مع نظام الوحدات'); try{ location.href='كل-الأصناف.html'; }catch(e){ window.renderPage&&window.renderPage(); }
  };

  function renderAccountsR4(){
    var rows=active(arr('accounts')); var html='<div class="table-toolbar"><div class="tools"><button class="btn primary" onclick="openAccountForm&&openAccountForm()">+ إضافة</button><input id="searchBox" class="search" placeholder="بحث..." oninput="renderAccounts()"></div><div class="tools"><button class="btn ghost small" onclick="window.exportCSV&&window.exportCSV()">تصدير CSV</button><button class="btn ghost small" onclick="window.print()">طباعة</button></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>اسم الحساب</th><th>نوع الحساب</th><th>رقم الحساب</th><th>الرصيد</th><th>وارد</th><th>صادر</th><th>إجراء</th></tr></thead><tbody>';
    html += rows.map(function(a){ var mov=active(arr('accountMovements')).filter(function(m){return String(m.accountId)===String(a.id);}); var incoming=mov.filter(function(m){return /وارد|in/i.test(m.type);}).reduce(function(s,m){return s+num(m.amount);},0); var outgoing=mov.filter(function(m){return /صادر|out/i.test(m.type);}).reduce(function(s,m){return s+num(m.amount);},0); return '<tr class="account-row" onclick="openAccountLedger(\''+esc(a.id)+'\')"><td><b>'+esc(a.name||'')+'</b><br><span class="status '+(a.active==='غير نشط'?'bad':'ok')+'">'+esc(a.active||'نشط')+'</span></td><td>'+esc(a.type||'')+'</td><td>'+esc(a.code||'')+'</td><td><b>'+money(a.balance)+'</b></td><td>'+money(incoming)+'</td><td>'+money(outgoing)+'</td><td><button class="btn small success" onclick="event.stopPropagation();openAccountLedger(\''+esc(a.id)+'\')">سجل</button> <button class="btn small ghost" onclick="event.stopPropagation();openAccountForm&&openAccountForm(\''+esc(a.id)+'\')">تعديل</button> <button class="btn small success" onclick="event.stopPropagation();quickMovement&&quickMovement(\''+esc(a.id)+'\',\'in\')">إيداع</button> <button class="btn small danger" onclick="event.stopPropagation();quickMovement&&quickMovement(\''+esc(a.id)+'\',\'out\')">سحب</button></td></tr>'; }).join('');
    html += '</tbody><tfoot><tr><td colspan="3">المجموع</td><td>'+money(rows.reduce(function(s,a){return s+num(a.balance);},0))+'</td><td colspan="3"></td></tr></tfoot></table></div>';
    if($('mainCard')) { $('mainCard').dataset.r4View='accounts'; $('mainCard').innerHTML=html; }
  }
  window.renderAccounts=renderAccountsR4; try{ renderAccounts=renderAccountsR4; }catch(e){}
  window.openAccountLedger=function(id){
    var a=arr('accounts').find(function(x){return String(x.id)===String(id);}); if(!a) return;
    var rows=active(arr('accountMovements')).filter(function(m){return String(m.accountId)===String(id);}).sort(function(x,y){return String(y.date||'').localeCompare(String(x.date||''));});
    var incoming=rows.filter(function(m){return /وارد|in/i.test(m.type);}).reduce(function(s,m){return s+num(m.amount);},0); var outgoing=rows.filter(function(m){return /صادر|out/i.test(m.type);}).reduce(function(s,m){return s+num(m.amount);},0);
    var cols=[{label:'التاريخ',key:'date'},{label:'النوع',key:'type'},{label:'المبلغ',fn:function(r){return money(r.amount);}},{label:'الرصيد قبل',fn:function(r){return money(r.balanceBefore);}},{label:'الرصيد بعد',fn:function(r){return money(r.balanceAfter);}},{label:'المصدر',key:'source'},{label:'ملاحظة',key:'note'}];
    var html='<div class="ledger-title-card"><h2 style="margin:0;color:#304d56">سجل الحساب - '+esc(a.name||'')+'</h2><div class="muted">وارد وصادر الحساب</div><div class="ledger-actions"><button class="btn ghost" onclick="renderAccounts()">رجوع</button><button class="btn primary" onclick="window.print()">طباعة / PDF</button><button class="btn success" onclick="downloadAccountLedger(\''+esc(id)+'\',\'csv\')">CSV</button><button class="btn success" onclick="downloadAccountLedger(\''+esc(id)+'\',\'xls\')">Excel</button></div></div><div class="kpis"><div class="kpi"><span>الرصيد الحالي</span><strong>'+money(a.balance)+'</strong></div><div class="kpi"><span>الوارد</span><strong>'+money(incoming)+'</strong></div><div class="kpi"><span>الصادر</span><strong>'+money(outgoing)+'</strong></div><div class="kpi"><span>عدد الحركات</span><strong>'+rows.length+'</strong></div></div><div class="ledger-section"><h3>سجل الوارد والصادر</h3>'+ledgerTable(rows,cols,'لا توجد حركات')+'</div>';
    if($('mainCard')) { $('mainCard').dataset.r4View='account-ledger'; $('mainCard').innerHTML=html; }
  };
  window.downloadAccountLedger=function(id,type){ var a=arr('accounts').find(function(x){return String(x.id)===String(id);})||{}; var rows=[['التاريخ','النوع','المبلغ','الرصيد قبل','الرصيد بعد','المصدر','ملاحظة']]; active(arr('accountMovements')).filter(function(m){return String(m.accountId)===String(id);}).forEach(function(m){rows.push([m.date||'',m.type||'',num(m.amount),num(m.balanceBefore),num(m.balanceAfter),m.source||'',m.note||'']);}); csvDownload(rows,'سجل-الحساب-'+(a.name||id)+(type==='xls'?'.xls':'.csv'),type==='xls'); };

  function installMenuPurchaseLink(){
    document.querySelectorAll('.menu-group').forEach(function(g){ var head=g.querySelector('.menu-head'); var sub=g.querySelector('.submenu'); if(!head||!sub) return; if((head.textContent||'').indexOf('الأصناف')>-1 && !sub.querySelector('a[href="إضافة-مشتريات.html"]')){ var a=document.createElement('a'); a.className='sub'; a.href='إضافة-مشتريات.html'; a.setAttribute('data-oskar-added','1'); a.innerHTML='<span class="sub-icon">＋</span> إضافة مشتريات'; sub.insertBefore(a,sub.firstChild); } });
  }

  function wrapRenderPageR4(){
    var old=window.renderPage;
    if(typeof old!=='function' || old.__oskarR4Wrapped) return;
    window.renderPage=function(){
      var r;
      if(isCustomersPage()){ try{ if(typeof window.renderCommon==='function') window.renderCommon(); }catch(e){} installCustomerBalance(); window.renderCustomersFinal(); r=null; }
      else if(isAccountsPage()){ try{ if(typeof window.renderCommon==='function') window.renderCommon(); }catch(e){} renderAccountsR4(); r=null; }
      else if(isPurchasePage()){ try{ if(typeof window.renderCommon==='function') window.renderCommon(); }catch(e){} window.renderPurchaseForm(); r=null; }
      else if(isProductFormPage()){ try{ if(typeof window.renderCommon==='function') window.renderCommon(); }catch(e){} window.renderProductForm(); r=null; }
      else { r=old.apply(this,arguments); }
      setTimeout(function(){ injectAdvancedStyle(); installMenuPurchaseLink(); installProductResults(); if(isCustomersPage()) installCustomerBalance(); },60);
      return r;
    };
    window.renderPage.__oskarR4Wrapped=true; try{ renderPage=window.renderPage; }catch(e){}
  }

  function install(){ injectAdvancedStyle(); installCustomerBalance(); installProductResults(); installMenuPurchaseLink(); wrapRenderPageR4(); var mc=$('mainCard'); if(isCustomersPage() && (!mc || !/customer/.test(mc.dataset.r4View||''))) window.renderCustomersFinal(); if(isAccountsPage() && (!mc || !/account/.test(mc.dataset.r4View||''))) renderAccountsR4(); if(isPurchasePage() && (!mc || mc.dataset.r4View!=='purchase')) window.renderPurchaseForm(); if(isProductFormPage() && (!mc || mc.dataset.r4View!=='product-form')) window.renderProductForm(); }
  [0,120,450,1000,1800].forEach(function(ms){ setTimeout(install,ms); });
  document.addEventListener('DOMContentLoaded',function(){ setTimeout(install,80); });
})();

/* Oskar R5: ordered fields, stable ledgers, 3-up popular products, robust units/purchases/sync badge - 2026-05-10 */
(function(){
  'use strict';
  if(window.__OSKAR_R5_UNITS_PURCHASE_SYNC__) return;
  window.__OSKAR_R5_UNITS_PURCHASE_SYNC__ = true;

  var APP_KEY='supermarket_pos_ar_v1';
  var TEAL='#409898';
  var TEAL_DARK='#2f8584';
  var PENDING_KEY='oskar_pending_sync_operations_v1';
  var lastPendingMark=0;

  function $(id){return document.getElementById(id)}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function txt(v){return String(v==null?'':v).trim()}
  function low(v){return txt(v).toLowerCase()}
  function num(v){return Number(v||0)||0}
  function uid(p){try{if(typeof window.uid==='function')return window.uid(p)}catch(e){} return (p||'id')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
  function now(){try{if(typeof window.nowText==='function')return window.nowText()}catch(e){} return new Date().toLocaleString('ar-EG',{hour12:false})}
  function today(){try{if(typeof window.todayISO==='function')return window.todayISO()}catch(e){} return new Date().toISOString().slice(0,10)}
  function money(v){try{if(typeof window.money2==='function')return window.money2(v)}catch(e){} try{if(typeof window.money==='function')return window.money(v)}catch(e){} return num(v).toFixed(2)}
  function db(){try{if(window.DB)return window.DB}catch(e){} try{window.DB=JSON.parse(localStorage.getItem(APP_KEY)||'{}')||{}}catch(e){window.DB={}} return window.DB}
  function arr(name){try{if(typeof window.collection==='function')return window.collection(name)}catch(e){} var d=db(); if(!Array.isArray(d[name]))d[name]=[]; return d[name]}
  function active(rows){return (rows||[]).filter(function(x){return x && !x.deletedAt && !x._deleted})}
  function save(){try{if(typeof window.persist==='function')return window.persist()}catch(e){} try{localStorage.setItem(APP_KEY,JSON.stringify(db()))}catch(e){} }
  function toast(m){try{if(typeof window.toast==='function')return window.toast(m)}catch(e){} alert(m)}
  function currentUserName(){try{return (window.currentUser&&window.currentUser().name)||'مدير النظام'}catch(e){return 'مدير النظام'}}
  function pageName(){return decodeURIComponent((location.pathname.split('/').pop()||'').split('?')[0])}
  function isPurchasePage(){return pageName()==='إضافة-مشتريات.html'||(window.CFG&&window.CFG.kind==='purchase_form')}
  function isProductFormPage(){return pageName()==='إضافة-صنف.html'||(window.CFG&&window.CFG.kind==='product_form')}
  function isCashierLike(){return !!$('cartBody') && !isPurchasePage()}
  function getCart(){try{if(Array.isArray(window.cart))return window.cart}catch(e){} try{if(Array.isArray(cart))return cart}catch(e){} window.cart=[]; return window.cart}
  function setCart(v){try{window.cart=v; cart=v}catch(e){window.cart=v}}
  function productById(id){return arr('products').find(function(p){return String(p.id)===String(id)})}
  function accountOptions(selected){return '<option value="">اختر الحساب</option>'+active(arr('accounts')).map(function(a){return '<option value="'+esc(a.id)+'" '+(String(selected||'')===String(a.id)?'selected':'')+'>'+esc(a.name||a.code||a.id)+'</option>'}).join('')}
  function supplierOptions(selected){return '<option value="">اختر المورد</option>'+active(arr('suppliers')).map(function(s){return '<option value="'+esc(s.id)+'" '+(String(selected||'')===String(s.id)?'selected':'')+'>'+esc(s.name||s.phone||s.id)+'</option>'}).join('')}
  function branchOptions(selected){return '<option value="">اختر الفرع</option>'+active(arr('branches')).map(function(b){var val=b.name||b.id;return '<option value="'+esc(val)+'" '+(String(selected||'')===String(val)?'selected':'')+'>'+esc(b.name||b.id)+'</option>'}).join('')}
  function groupOptions(selected){return '<option value="">اختر المجموعة</option>'+active(arr('groups')).map(function(g){var val=g.name||g.id;return '<option value="'+esc(val)+'" '+(String(selected||'')===String(val)?'selected':'')+'>'+esc(val)+'</option>'}).join('')}
  function brandOptions(selected){return '<option value="">اختر الماركة</option>'+active(arr('brands')).map(function(b){var val=b.name||b.id;return '<option value="'+esc(val)+'" '+(String(selected||'')===String(val)?'selected':'')+'>'+esc(val)+'</option>'}).join('')}

  function injectR5Style(){
    if($('oskar-r5-style')) return;
    var st=document.createElement('style');
    st.id='oskar-r5-style';
    st.textContent=`
body.oskar-r5-ready .advanced-form-card,
body.oskar-r5-ready #advancedProductForm,
body.oskar-r5-ready .purchase-entry-card{max-width:100%!important}
body.oskar-r5-ready .advanced-form-card .grid,
body.oskar-r5-ready #advancedProductForm.grid,
body.oskar-r5-ready .purchase-entry-card .grid,
body.oskar-r5-ready .unit-definition-box .grid,
body.oskar-r5-ready .card .grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;align-items:end!important}
body.oskar-r5-ready .field{min-width:0!important;align-self:stretch!important}
body.oskar-r5-ready .field label{min-height:18px!important;display:flex!important;align-items:center!important}
body.oskar-r5-ready .field input,
body.oskar-r5-ready .field select,
body.oskar-r5-ready .field textarea,
body.oskar-r5-ready .search{width:100%!important;min-width:0!important;height:54px!important;min-height:54px!important;border-radius:16px!important;font-size:15px!important;box-sizing:border-box!important}
body.oskar-r5-ready .field textarea{height:54px!important;min-height:54px!important;resize:none!important;overflow:hidden!important;padding-top:15px!important}
body.oskar-r5-ready .field.full-row,
body.oskar-r5-ready .full-row,
body.oskar-r5-ready .field[style*="grid-column:1/-1"]{grid-column:1/-1!important}
body.oskar-r5-ready .scan-input-row{display:grid!important;grid-template-columns:1fr auto auto!important;gap:8px!important;align-items:center!important;width:100%!important}
body.oskar-r5-ready .table-wrap{direction:ltr!important;overflow-x:auto!important;overflow-y:hidden!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-x:contain!important;touch-action:pan-x pan-y!important;scrollbar-gutter:stable!important;overflow-anchor:none!important;max-width:100%!important}
body.oskar-r5-ready .table-wrap .data-table{direction:rtl!important;min-width:920px!important;width:max-content!important;min-width:max(920px,100%)!important}
body.oskar-r5-ready .table-wrap .data-table th,
body.oskar-r5-ready .table-wrap .data-table td{white-space:nowrap!important}
body.oskar-r5-ready .ledger-section .table-wrap .data-table{min-width:980px!important}
body.oskar-r5-ready #productResults .popular-grid{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:8px!important;width:100%!important}
body.oskar-r5-ready #productResults .popular-card{min-width:0!important;min-height:86px!important;padding:10px 8px!important;border-radius:17px!important;align-items:stretch!important}
body.oskar-r5-ready #productResults .popular-card b{font-size:12.5px!important;line-height:1.28!important;-webkit-line-clamp:2!important}
body.oskar-r5-ready #productResults .popular-card small{font-size:12px!important;white-space:nowrap!important}
body.oskar-r5-ready .unit-definition-box{background:#f7fbfb!important;border:1px solid #dfe9e9!important;border-radius:22px!important;padding:12px!important;margin:10px 0!important}
body.oskar-r5-ready .unit-hint{font-size:12px!important;color:#607d82!important;font-weight:800!important;margin-top:5px!important}
body.oskar-r5-ready .sync-pending-badge{position:absolute!important;top:-6px!important;left:-6px!important;min-width:20px!important;height:20px!important;border-radius:999px!important;background:#dc2626!important;color:#fff!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;font-size:11px!important;font-weight:950!important;border:2px solid #fff!important;box-shadow:0 8px 16px rgba(220,38,38,.25)!important;line-height:1!important;padding:0 5px!important}
body.oskar-r5-ready .sync-has-pending{position:relative!important;background:#fff0f0!important;color:#dc2626!important;border-color:#fecaca!important;box-shadow:0 8px 18px rgba(220,38,38,.16)!important}
body.oskar-r5-ready .sync-has-pending svg{stroke:#dc2626!important}
@media(max-width:760px){
  body.oskar-r5-ready .advanced-form-card .grid,
  body.oskar-r5-ready #advancedProductForm.grid,
  body.oskar-r5-ready .purchase-entry-card .grid,
  body.oskar-r5-ready .unit-definition-box .grid,
  body.oskar-r5-ready .card .grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}
  body.oskar-r5-ready .field label{font-size:12px!important}
  body.oskar-r5-ready .field input,
  body.oskar-r5-ready .field select,
  body.oskar-r5-ready .field textarea,
  body.oskar-r5-ready .search{height:50px!important;min-height:50px!important;font-size:14px!important;border-radius:15px!important}
  body.oskar-r5-ready .scan-input-row{grid-template-columns:1fr!important}.scan-input-row .btn{width:100%!important}
  body.oskar-r5-ready #productResults .popular-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important}
  body.oskar-r5-ready #productResults .popular-card{min-height:82px!important;padding:9px 6px!important}
  body.oskar-r5-ready #productResults .popular-card b{font-size:11.5px!important}
}
@media(max-width:380px){body.oskar-r5-ready #productResults .popular-card b{font-size:10.8px!important}body.oskar-r5-ready #productResults .popular-card{padding:8px 5px!important}}
`;
    document.head.appendChild(st);
    document.body.classList.add('oskar-r5-ready');
  }

  function normalizeUnits(p){
    p=p||{}; var out=[];
    function add(u,source){
      if(!u) return;
      var name=txt(u.name||u.unitName||u.label); if(!name||name==='قطعة'||name==='وحدة') return;
      if(out.some(function(x){return low(x.name)===low(name)})) return;
      var pieces=Math.max(1,num(u.pieces||u.piecesPerUnit||u.factor||u.qty||u.count||1));
      out.push({id:u.id||uid('unit'),name:name,symbol:txt(u.symbol||u.code||name.slice(0,2)),pieces:pieces,piecesPerUnit:pieces,buyPrice:num(u.buyPrice||u.purchasePrice||u.unitBuyPrice||0),salePrice:num(u.salePrice||u.unitSalePrice||0),pieceSalePrice:num(u.pieceSalePrice||0),source:source||''});
    }
    (p.purchaseUnits||p.unitsMeta||p.extraUnits||p.saleUnits||[]).forEach(function(u){add(u,'product')});
    if(p.cartonSize||p.cartonPrice)add({name:p.cartonName||'كرتونة',symbol:'CT',pieces:p.cartonSize,buyPrice:p.cartonPurchasePrice||0,salePrice:p.cartonPrice,pieceSalePrice:p.salePrice},'product');
    active(arr('units')).forEach(function(u){add(u,'global')});
    return out;
  }
  function setProductUnits(p,units){p.purchaseUnits=units; p.unitsMeta=units}
  function ensureGlobalUnit(u){
    var name=txt(u&&u.name); if(!name||name==='قطعة'||name==='وحدة')return null;
    var units=arr('units'); var ex=units.find(function(x){return low(x.name)===low(name)});
    var pieces=Math.max(1,num(u.pieces||u.piecesPerUnit||1));
    if(ex){ex.symbol=txt(ex.symbol||u.symbol||name.slice(0,2)); ex.pieces=pieces||num(ex.pieces||ex.piecesPerUnit||1); ex.piecesPerUnit=ex.pieces; return ex;}
    ex={id:uid('unit'),name:name,symbol:txt(u.symbol||name.slice(0,2)),pieces:pieces,piecesPerUnit:pieces,createdAt:now(),createdBy:currentUserName()};
    units.unshift(ex); return ex;
  }
  function findUnit(p,key){
    if(!key||key==='piece') return {id:'piece',name:'قطعة',symbol:'قطعة',pieces:1,piecesPerUnit:1,buyPrice:num(p&&p.purchasePrice),salePrice:num((p&& (p.salePrice||p.price))||0),pieceSalePrice:num((p&&(p.salePrice||p.price))||0)};
    return normalizeUnits(p).find(function(u){return String(u.id)===String(key)||String(u.name)===String(key)});
  }
  function unitOptionsForProduct(p,selected,withCustom){
    var html='<option value="piece" '+(!selected||selected==='piece'?'selected':'')+'>قطعة</option>';
    normalizeUnits(p).forEach(function(u){var key=u.id||u.name; html+='<option value="'+esc(key)+'" '+(String(selected||'')===String(key)?'selected':'')+'>'+esc(u.name)+' - '+num(u.pieces)+' قطعة</option>';});
    if(withCustom!==false) html+='<option value="custom" '+(selected==='custom'?'selected':'')+'>وحدة مخصصة</option>';
    return html;
  }
  function addUnitToProduct(productId,data){
    var p=productById(productId); if(!p)return null;
    var name=txt(data.name); if(!name){toast('أدخل اسم الوحدة'); return null;}
    if(name==='قطعة'||name==='وحدة'){toast('هذا الاسم مستخدم، اختر اسمًا مختلفًا'); return null;}
    var productUnits=(p.purchaseUnits||p.unitsMeta||[]).slice();
    if(productUnits.some(function(u){return low(u.name)===low(name)})){toast('اسم الوحدة موجود داخل الصنف'); return null;}
    var pieces=Math.max(1,num(data.pieces));
    var u={id:uid('u'),name:name,symbol:txt(data.symbol||name.slice(0,2)),pieces:pieces,piecesPerUnit:pieces,buyPrice:num(data.buyPrice),salePrice:num(data.salePrice),pieceSalePrice:num(data.pieceSalePrice)};
    productUnits.push(u); setProductUnits(p,productUnits); ensureGlobalUnit(u); save(); return u;
  }

  function applyUnitToSaleItem(item,key){
    var p=productById(item.productId)||{}; var u=findUnit(p,key)||findUnit(p,'piece');
    item.unitChoice=key||'piece'; item.saleUnitId=u.id||u.name||'piece'; item.unit=u.name||'قطعة'; item.unitName=item.unit;
    item.factor=Math.max(1,num(u.pieces||u.piecesPerUnit||1)); item.piecesPerUnit=item.factor;
    var pieceCost=num(p.purchasePrice||item.purchasePrice||0); var pieceSale=num(p.salePrice||p.price||item.unitPrice||0);
    item.purchasePrice=pieceCost; item.costPerPiece=pieceCost;
    if(item.unitChoice==='piece') item.unitPrice=num(item.unitPrice||pieceSale);
    else item.unitPrice=num(u.salePrice||item.unitPrice||pieceSale*item.factor);
    item.qty=num(item.qty||1); item.discount=num(item.discount||0); item.stockQty=item.qty*item.factor; item.total=Math.max(0,item.qty*item.unitPrice-item.discount); item.cost=item.stockQty*pieceCost; item.profit=item.total-item.cost;
  }
  window.addProductToCart=function(id){
    var p=productById(id); if(!p)return;
    var item={productId:p.id,name:p.name,sku:p.sku,barcode:p.barcode,qty:1,discount:0,unitChoice:'piece',unit:'قطعة',unitName:'قطعة'};
    applyUnitToSaleItem(item,'piece'); var c=getCart(); c.push(item); setCart(c); window.renderCart&&window.renderCart();
  };
  try{addProductToCart=window.addProductToCart}catch(e){}
  window.changeSaleUnit=function(idx,key){var c=getCart(), item=c[idx]; if(!item)return; if(key==='custom'){openCustomUnitModal(item.productId,function(u){item.unitChoice=u.id; applyUnitToSaleItem(item,u.id); window.renderCart&&window.renderCart();});return;} applyUnitToSaleItem(item,key); window.renderCart&&window.renderCart();};
  window.updateSaleItem=function(idx,field,value){var c=getCart(), item=c[idx]; if(!item)return; item[field]=value; applyUnitToSaleItem(item,item.unitChoice||'piece'); window.renderCart&&window.renderCart();};
  window.removeCartItemR5=function(idx){var c=getCart(); c.splice(idx,1); setCart(c); window.renderCart&&window.renderCart();};

  function updateTotals(){
    var total=getCart().reduce(function(s,i){return s+num(i.total)},0);
    var disc=num($('discountAmount')&&$('discountAmount').value), ship=num($('shippingAmount')&&$('shippingAmount').value), grand=Math.max(0,total-disc+ship);
    if($('grandTotal')) $('grandTotal').textContent=money(grand);
    var pay=$('payAmount'); if(pay && !pay.dataset.touched) pay.value=grand.toFixed(2);
    if($('dueAmount')) $('dueAmount').textContent=money(Math.max(0,grand-num(pay&&pay.value)));
  }
  function renderSaleCart(){
    var el=$('cartBody'); if(!el)return; var c=getCart(); c.forEach(function(i){applyUnitToSaleItem(i,i.unitChoice||'piece')});
    el.innerHTML=c.map(function(i,idx){var p=productById(i.productId)||{}; return '<tr><td class="name-cell"><b>'+esc(i.name)+'</b><div class="unit-mini">يخصم من المخزون: '+num(i.stockQty).toFixed(3).replace(/\.000$/,'')+' قطعة</div></td><td class="unit-cell"><select onchange="changeSaleUnit('+idx+',this.value)">'+unitOptionsForProduct(p,i.unitChoice,true)+'</select></td><td><input type="number" step="0.001" value="'+esc(i.qty)+'" onchange="updateSaleItem('+idx+',\'qty\',this.value)"></td><td><input type="number" step="0.01" value="'+esc(i.unitPrice)+'" onchange="updateSaleItem('+idx+',\'unitPrice\',this.value)"></td><td><input type="number" step="0.01" value="'+esc(i.discount)+'" onchange="updateSaleItem('+idx+',\'discount\',this.value)"></td><td class="calc-cell">'+money(i.total)+'</td><td><button class="btn small danger" onclick="removeCartItemR5('+idx+')">×</button></td></tr>'}).join('') || '<tr><td colspan="7" style="text-align:center;color:#6b7280">لا توجد أصناف</td></tr>';
    var table=el.closest('table'); if(table){table.classList.add('advanced-cart-table'); var th=table.querySelector('thead tr'); if(th)th.innerHTML='<th>الصنف</th><th>وحدة البيع</th><th>الكمية</th><th>سعر البيع</th><th>خصم</th><th>المجموع</th><th>حذف</th>';}
    updateTotals(); stabilizeTables();
  }

  function openCustomUnitModal(productId,cb){
    var p=productById(productId)||{};
    var html='<form id="customUnitForm" class="grid"><div class="field"><label>اسم الوحدة الفريد</label><input name="name" required placeholder="مثال: كرتونة / كيلو"></div><div class="field"><label>رمز الوحدة</label><input name="symbol" placeholder="مثال: CT"></div><div class="field"><label>كم قطعة تحتوي</label><input name="pieces" type="number" step="0.001" value="1" required></div><div class="field"><label>سعر شراء الوحدة</label><input name="buyPrice" type="number" step="0.01"></div><div class="field"><label>سعر بيع الوحدة</label><input name="salePrice" type="number" step="0.01"></div><div class="field"><label>سعر بيع القطعة</label><input name="pieceSalePrice" type="number" step="0.01" value="'+esc(p.salePrice||p.price||0)+'"></div></form><div class="tools" style="margin-top:12px"><button class="btn success" id="saveCustomUnitBtn">حفظ الوحدة</button></div>';
    if($('modalTitle'))$('modalTitle').textContent='وحدة مخصصة'; if($('modalBody'))$('modalBody').innerHTML=html; if($('modalBack'))$('modalBack').style.display='flex';
    setTimeout(function(){var b=$('saveCustomUnitBtn'); if(!b)return; b.onclick=function(){var f=$('customUnitForm'); var data=Object.fromEntries(new FormData(f).entries()); var u=addUnitToProduct(productId,data); if(!u)return; if($('modalBack'))$('modalBack').style.display='none'; if(typeof cb==='function')cb(u); toast('تم حفظ الوحدة وإضافتها للصنف');};},0);
  }

  function salesCount(pid){var n=0; active(arr('sales')).forEach(function(s){(s.items||[]).forEach(function(i){if(String(i.productId)===String(pid))n+=num(i.qty)})}); return n}
  window.showProductResults=function(q){
    var el=$('productResults'); if(!el)return; var text=txt(q); var rows=active(arr('products'));
    if(text){var l=low(text); rows=rows.filter(function(p){return low([p.name,p.sku,p.barcode,p.group,p.brand].join(' ')).indexOf(l)>-1});}
    else rows=rows.sort(function(a,b){return salesCount(b.id)-salesCount(a.id)}).slice(0, window.innerWidth<=760?6:6);
    if(!rows.length){el.innerHTML='<div class="muted">لا نتائج</div>'; return;}
    if(!text) el.innerHTML='<div class="popular-strip"><div class="popular-title">الأكثر طلبًا</div><div class="popular-grid">'+rows.map(function(p){return '<div class="popular-card" onclick="addProductToCart(\''+esc(p.id)+'\')"><b>'+esc(p.name||'صنف')+'</b><small>'+money(p.salePrice||p.price||0)+'</small></div>'}).join('')+'</div></div>';
    else el.innerHTML=rows.map(function(p){return '<div class="product-card" onclick="addProductToCart(\''+esc(p.id)+'\')"><b>'+esc(p.name||'صنف')+'</b><div class="muted">'+esc(p.sku||p.barcode||'')+'</div><div>'+money(p.salePrice||p.price||0)+' · المخزون: '+num(p.stockUnits!==undefined?p.stockUnits:p.stock).toFixed(3).replace(/\.000$/,'')+' قطعة</div></div>'}).join('');
  };
  try{showProductResults=window.showProductResults}catch(e){}

  function calcPurchaseItem(i){
    i.qty=num(i.qty||1); i.piecesPerUnit=Math.max(1,num(i.piecesPerUnit||i.factor||1)); i.factor=i.piecesPerUnit;
    i.unitBuyPrice=num(i.unitBuyPrice); i.unitSalePrice=num(i.unitSalePrice); i.pieceSalePrice=num(i.pieceSalePrice);
    if(i.unitChoice==='piece'){ i.piecesPerUnit=1; i.factor=1; i.unitName='قطعة'; i.unit='قطعة'; i.unitSalePrice=num(i.pieceSalePrice||i.unitSalePrice); i.pieceSalePrice=i.unitSalePrice; }
    else { if(!i.pieceSalePrice && i.unitSalePrice)i.pieceSalePrice=i.unitSalePrice/i.piecesPerUnit; if(!i.unitSalePrice && i.pieceSalePrice)i.unitSalePrice=i.pieceSalePrice*i.piecesPerUnit; }
    i.stockQty=i.qty*i.piecesPerUnit; i.unitPrice=i.unitBuyPrice; i.total=Math.max(0,i.qty*i.unitBuyPrice-num(i.discount)); i.purchasePiecePrice=i.piecesPerUnit?i.unitBuyPrice/i.piecesPerUnit:i.unitBuyPrice;
  }
  function addPurchaseProduct(id){
    var p=productById(id); if(!p)return;
    var item={context:'purchase',productId:p.id,name:p.name,sku:p.sku,qty:1,discount:0,unitChoice:'piece',unit:'قطعة',unitName:'قطعة',piecesPerUnit:1,factor:1,unitBuyPrice:num(p.purchasePrice),unitSalePrice:num(p.salePrice||p.price),pieceSalePrice:num(p.salePrice||p.price)};
    calcPurchaseItem(item); var c=getCart(); c.push(item); setCart(c); window.renderCart&&window.renderCart();
  }
  window.addPurchaseProductToCart=addPurchaseProduct;
  window.changePurchaseUnit=function(idx,key){
    var c=getCart(), i=c[idx]; if(!i)return; var p=productById(i.productId)||{};
    if(key==='custom'){openCustomUnitModal(i.productId,function(u){i.unitChoice=u.id; i.unit=u.name; i.unitName=u.name; i.piecesPerUnit=num(u.pieces); i.factor=i.piecesPerUnit; i.unitBuyPrice=num(u.buyPrice); i.unitSalePrice=num(u.salePrice); i.pieceSalePrice=num(u.pieceSalePrice)||num(u.salePrice)/Math.max(1,num(u.pieces)); calcPurchaseItem(i); window.renderCart&&window.renderCart();}); return;}
    var u=findUnit(p,key)||findUnit(p,'piece'); i.unitChoice=key||'piece'; i.unit=u.name; i.unitName=u.name; i.piecesPerUnit=Math.max(1,num(u.pieces)); i.factor=i.piecesPerUnit; i.unitBuyPrice=num(u.buyPrice)||num(p.purchasePrice)*i.piecesPerUnit; i.unitSalePrice=num(u.salePrice)||num(p.salePrice||p.price)*i.piecesPerUnit; i.pieceSalePrice=num(u.pieceSalePrice)||num(p.salePrice||p.price); calcPurchaseItem(i); window.renderCart&&window.renderCart();
  };
  window.updatePurchaseItem=function(idx,field,value){var c=getCart(), i=c[idx]; if(!i)return; i[field]=value; if(field==='pieceSalePrice')i.unitSalePrice=num(value)*Math.max(1,num(i.piecesPerUnit)); if(field==='unitSalePrice')i.pieceSalePrice=num(value)/Math.max(1,num(i.piecesPerUnit)); calcPurchaseItem(i); window.renderCart&&window.renderCart();};
  function renderPurchaseCart(){
    var el=$('cartBody'); if(!el)return; var c=getCart(); c.forEach(calcPurchaseItem);
    el.innerHTML=c.map(function(i,idx){var p=productById(i.productId)||{}; var label=esc(i.unitName||i.unit||'قطعة'); return '<tr><td class="name-cell"><b>'+esc(i.name)+'</b><div class="unit-mini">إضافة للمخزون: '+num(i.stockQty).toFixed(3).replace(/\.000$/,'')+' قطعة</div></td><td class="unit-cell"><select onchange="changePurchaseUnit('+idx+',this.value)">'+unitOptionsForProduct(p,i.unitChoice,true)+'</select></td><td><input type="number" step="0.001" value="'+esc(i.qty)+'" onchange="updatePurchaseItem('+idx+',\'qty\',this.value)"></td><td><input type="number" step="0.01" value="'+esc(i.unitBuyPrice)+'" onchange="updatePurchaseItem('+idx+',\'unitBuyPrice\',this.value)" placeholder="شراء '+label+'"></td><td><input type="number" step="0.01" value="'+esc(i.unitSalePrice)+'" onchange="updatePurchaseItem('+idx+',\'unitSalePrice\',this.value)" placeholder="بيع '+label+'"></td><td><input type="number" step="0.01" value="'+esc(i.pieceSalePrice)+'" onchange="updatePurchaseItem('+idx+',\'pieceSalePrice\',this.value)" placeholder="بيع القطعة"></td><td><input type="number" step="0.01" value="'+esc(i.discount||0)+'" onchange="updatePurchaseItem('+idx+',\'discount\',this.value)"></td><td class="calc-cell">'+money(i.total)+'</td><td><button class="btn small danger" onclick="removeCartItemR5('+idx+')">×</button></td></tr>'}).join('') || '<tr><td colspan="9" style="text-align:center;color:#6b7280">لا توجد مشتريات</td></tr>';
    var table=el.closest('table'); if(table){table.classList.add('advanced-cart-table'); var th=table.querySelector('thead tr'); if(th)th.innerHTML='<th>المنتج</th><th>طريقة الشراء</th><th>الكمية</th><th>سعر شراء الاختيار</th><th>سعر بيع الاختيار</th><th>سعر بيع القطعة</th><th>خصم</th><th>المجموع</th><th>حذف</th>';}
    updateTotals(); stabilizeTables();
  }
  window.renderCart=function(){if(isPurchasePage())return renderPurchaseCart(); return renderSaleCart();};
  try{renderCart=window.renderCart}catch(e){}

  function showPurchaseResults(q){
    var el=$('productResults'); if(!el)return; var text=txt(q), rows=active(arr('products'));
    if(text){var l=low(text); rows=rows.filter(function(p){return low([p.name,p.sku,p.barcode,p.group,p.brand].join(' ')).indexOf(l)>-1});}
    else rows=rows.slice(0,12);
    el.innerHTML=rows.length?rows.map(function(p){return '<div class="product-card" onclick="addPurchaseProductToCart(\''+esc(p.id)+'\')"><b>'+esc(p.name||'صنف')+'</b><div class="muted">'+esc(p.sku||p.barcode||'')+'</div><div>شراء القطعة: '+money(p.purchasePrice||0)+' · بيع القطعة: '+money(p.salePrice||p.price||0)+'</div></div>'}).join(''):'<div class="muted">لا نتائج</div>';
  }
  window.showPurchaseResults=showPurchaseResults;

  window.renderPurchaseForm=function(){
    setCart([]); if(!$('mainCard'))return; $('mainCard').dataset.r5View='purchase'; $('mainCard').dataset.r4View='purchase';
    $('mainCard').innerHTML='<div class="advanced-form-card purchase-entry-card"><h3 class="advanced-form-title">إضافة مشتريات</h3><div class="grid"><div class="field"><label>اختر المورد</label><select id="supplierId">'+supplierOptions('')+'</select></div><div class="field"><label>الحساب الذي سيتم الدفع منه</label><select id="accountId">'+accountOptions('')+'</select></div><div class="field"><label>الفرع</label><select id="branch">'+branchOptions('')+'</select></div><div class="field"><label>تاريخ الشراء</label><input id="purchaseDate" type="date" value="'+today()+'"></div><div class="field"><label>الرقم المرجعي</label><input id="referenceNo" placeholder="تلقائي عند تركه فارغًا"></div><div class="field"><label>حالة الشراء</label><select id="purchaseStatus"><option>استلام</option><option>في الانتظار</option><option>ملغي</option></select></div></div></div><div class="card"><div class="table-toolbar"><div class="scan-input-row"><input class="search" id="productSearch" placeholder="بحث يدوي أو QR / باركود" oninput="showPurchaseResults(this.value)"><button class="btn ghost" onclick="startScanner&&startScanner(v=>{document.getElementById(\'productSearch\').value=v;showPurchaseResults(v);})">كاميرا QR</button><button class="btn primary" onclick="location.href=\'إضافة-صنف.html\'">+ منتج</button></div></div><div id="productResults" class="product-results"></div><div class="table-wrap"><table class="data-table advanced-cart-table"><thead><tr><th>المنتج</th><th>طريقة الشراء</th><th>الكمية</th><th>سعر شراء الاختيار</th><th>سعر بيع الاختيار</th><th>سعر بيع القطعة</th><th>خصم</th><th>المجموع</th><th>حذف</th></tr></thead><tbody id="cartBody"></tbody></table></div></div><div class="card"><h3>الدفع</h3><div class="grid"><div class="field"><label>الإجمالي</label><b id="grandTotal">0.00</b></div><div class="field"><label>المبلغ المدفوع</label><input id="payAmount" type="number" step="0.01" value="0" oninput="this.dataset.touched=1;renderCart()"></div><div class="field"><label>طريقة الدفع</label><select id="paymentMethod"><option>نقدي</option><option>تحويل بنكي</option><option>تطبيق فوري</option><option>تطبيق لاحق</option></select></div><div class="field"><label>ملاحظة الدفع</label><input id="paymentNote"></div><div class="field"><label>المبلغ المستحق</label><b id="dueAmount" style="color:#dc2626">0.00</b></div></div></div><div class="tools" style="justify-content:center"><button class="btn purple" onclick="savePurchase()">حفظ المشتريات</button></div>';
    showPurchaseResults(''); renderPurchaseCart(); setTimeout(stabilizeTables,60);
  };
  try{renderPurchaseForm=window.renderPurchaseForm}catch(e){}

  window.savePurchase=function(){
    var c=getCart(); if(!c.length){toast('أضف منتجات أولاً'); return;} c.forEach(calcPurchaseItem);
    var total=c.reduce(function(s,i){return s+num(i.total)},0), paid=num($('payAmount')&&$('payAmount').value), due=Math.max(0,total-paid);
    var sup=arr('suppliers').find(function(s){return String(s.id)===String($('supplierId')&&$('supplierId').value)}); var account=($('accountId')&&$('accountId').value)||'';
    if(!sup){toast('اختر المورد'); return;} if(paid>0&&!account){toast('اختر الحساب الذي سيتم الدفع منه'); return;}
    var rec={id:uid('pur'),date:($('purchaseDate')&&$('purchaseDate').value)||today(),referenceNo:($('referenceNo')&&$('referenceNo').value)||('PUR-'+Date.now()),supplierId:sup.id,supplierName:sup.name||'مورد',branch:($('branch')&&$('branch').value)||'',items:JSON.parse(JSON.stringify(c)),total:total,paid:paid,due:due,paymentStatus:due>0?'مستحق':'مدفوع',purchaseStatus:($('purchaseStatus')&&$('purchaseStatus').value)||'استلام',accountId:account,note:($('paymentNote')&&$('paymentNote').value)||'',createdAt:now(),createdBy:currentUserName()};
    arr('purchases').unshift(rec);
    if(paid>0&&typeof window.addMovement==='function')window.addMovement(account,'out',paid,'مشتريات '+rec.referenceNo,rec.note,'purchase:'+rec.id);
    if(due>0&&typeof window.addDebt==='function')window.addDebt('supplier',sup.id,rec.supplierName,due,rec.referenceNo,'مستحق مورد','purchase:'+rec.id);
    c.forEach(function(i){var p=productById(i.productId); if(!p)return; p.stock=num(p.stock)+num(i.stockQty); p.stockUnits=p.stock; p.purchasePrice=num(i.purchasePiecePrice); p.salePrice=num(i.pieceSalePrice)||num(p.salePrice); p.price=p.salePrice; var units=(p.purchaseUnits||p.unitsMeta||[]).slice(); if(i.unitChoice&&i.unitChoice!=='piece'){var u=units.find(function(x){return String(x.id)===String(i.unitChoice)||String(x.name)===String(i.unitName)}); if(!u){u={id:i.unitChoice||uid('u'),name:i.unitName,symbol:txt(i.unitSymbol||String(i.unitName||'').slice(0,2))}; units.push(u);} u.pieces=num(i.piecesPerUnit); u.piecesPerUnit=u.pieces; u.buyPrice=num(i.unitBuyPrice); u.salePrice=num(i.unitSalePrice); u.pieceSalePrice=num(i.pieceSalePrice); setProductUnits(p,units); ensureGlobalUnit(u);} arr('stockMovements').unshift({id:uid('stk'),date:now(),type:'شراء',product:p.name,productId:p.id,branch:rec.branch,qty:num(i.stockQty),unitName:i.unitName||'قطعة',piecesPerUnit:num(i.piecesPerUnit),note:rec.referenceNo});});
    save(); setCart([]); renderPurchaseCart(); toast('تم حفظ المشتريات وتحديث المخزون والوحدات');
  };
  try{savePurchase=window.savePurchase}catch(e){}

  window.renderProductForm=function(){
    if(!$('mainCard'))return; $('mainCard').dataset.r5View='product-form'; $('mainCard').dataset.r4View='product-form';
    $('mainCard').innerHTML='<div class="tools" style="justify-content:flex-start;margin-bottom:12px"><button class="btn ghost" onclick="startScanner&&startScanner(v=>{document.querySelector(\'[name=barcode]\').value=v;document.querySelector(\'[name=sku]\').value=v;})">مسح باركود بالكاميرا</button></div><form id="advancedProductForm" class="grid"><div class="field"><label>اسم المنتج *</label><input name="name" required></div><div class="field"><label>SKU / باركود</label><input name="sku"></div><div class="field"><label>باركود</label><input name="barcode"></div><div class="field"><label>الفرع</label><select name="branch">'+branchOptions('')+'</select></div><div class="field"><label>المجموعة</label><select name="group">'+groupOptions('')+'</select></div><div class="field"><label>الماركة</label><select name="brand">'+brandOptions('')+'</select></div><div class="field"><label>سعر شراء القطعة</label><input name="purchasePrice" type="number" step="0.01"></div><div class="field"><label>سعر بيع القطعة</label><input name="salePrice" type="number" step="0.01"></div><div class="field"><label>المخزون الافتتاحي بالقطعة</label><input name="stock" type="number" step="0.001"></div><div class="field"><label>طريقة الشراء/البيع</label><select name="unitChoice" onchange="toggleProductUnitR5(this.value)">'+unitOptionsForProduct({},'piece',true)+'</select><div class="unit-hint">الاختيار الافتراضي قطعة، ويمكن اختيار كرتونة/كيلو/أي وحدة معرفة.</div></div><div class="field product-custom-unit hide"><label>اسم الوحدة المخصصة</label><input name="customUnitName" placeholder="مثال: كرتونة"></div><div class="field product-custom-unit hide"><label>رمز الوحدة</label><input name="customUnitSymbol" placeholder="CT"></div><div class="field product-unit-extra hide"><label>كم قطعة تحتوي</label><input name="unitPieces" type="number" step="0.001" value="1"></div><div class="field product-unit-extra hide"><label>سعر شراء الاختيار</label><input name="unitBuy" type="number" step="0.01"></div><div class="field product-unit-extra hide"><label>سعر بيع الاختيار</label><input name="unitSale" type="number" step="0.01"></div><div class="field full-row"><label>ملاحظات</label><textarea name="note"></textarea></div></form><div class="tools" style="justify-content:center;margin-top:14px"><button class="btn purple" onclick="saveProductAdvanced()">حفظ المنتج</button></div>';
    setTimeout(function(){toggleProductUnitR5('piece')},20);
  };
  try{renderProductForm=window.renderProductForm}catch(e){}
  window.toggleProductUnitR5=function(value){
    var isPiece=value==='piece'||!value, isCustom=value==='custom';
    document.querySelectorAll('.product-unit-extra').forEach(function(x){x.classList.toggle('hide',isPiece)});
    document.querySelectorAll('.product-custom-unit').forEach(function(x){x.classList.toggle('hide',!isCustom)});
    var f=$('advancedProductForm'); if(!f||isPiece||isCustom)return; var u=active(arr('units')).find(function(x){return String(x.id)===String(value)||String(x.name)===String(value)}); if(u){f.unitPieces.value=num(u.pieces||u.piecesPerUnit||1)}
  };
  window.saveProductAdvanced=function(){
    var f=$('advancedProductForm'); if(!f)return; var data=Object.fromEntries(new FormData(f).entries()); if(!txt(data.name)){toast('أدخل اسم المنتج'); return;}
    var p={id:uid('prod'),name:txt(data.name),sku:txt(data.sku),barcode:txt(data.barcode),branch:txt(data.branch),unit:'قطعة',group:txt(data.group),brand:txt(data.brand),purchasePrice:num(data.purchasePrice),salePrice:num(data.salePrice),price:num(data.salePrice),stock:num(data.stock),stockUnits:num(data.stock),note:txt(data.note),createdAt:now(),createdBy:currentUserName(),purchaseUnits:[]};
    var choice=txt(data.unitChoice||'piece');
    if(choice&&choice!=='piece'){
      var name='', symbol='', pieces=Math.max(1,num(data.unitPieces));
      if(choice==='custom'){
        name=txt(data.customUnitName); symbol=txt(data.customUnitSymbol||name.slice(0,2)); if(!name){toast('أدخل اسم الوحدة المخصصة'); return;} if(name==='قطعة'||name==='وحدة'||active(arr('units')).some(function(u){return low(u.name)===low(name)})){toast('اسم الوحدة موجود، اختر اسمًا فريدًا'); return;}
      } else { var gu=active(arr('units')).find(function(u){return String(u.id)===String(choice)||String(u.name)===String(choice)}); if(gu){name=gu.name; symbol=gu.symbol||gu.code||name.slice(0,2); pieces=pieces||num(gu.pieces||gu.piecesPerUnit||1);} }
      if(name){var u={id:choice==='custom'?uid('u'):choice,name:name,symbol:symbol,pieces:pieces,piecesPerUnit:pieces,buyPrice:num(data.unitBuy),salePrice:num(data.unitSale),pieceSalePrice:pieces?num(data.unitSale)/pieces:num(data.salePrice)}; p.purchaseUnits.push(u); ensureGlobalUnit(u);}
    }
    p.unitsMeta=p.purchaseUnits; arr('products').unshift(p); if(p.stock)arr('stockMovements').unshift({id:uid('stk'),date:now(),type:'رصيد افتتاحي',product:p.name,productId:p.id,branch:p.branch,qty:p.stock,note:'إضافة منتج'});
    save(); toast('تم حفظ المنتج'); try{location.href='كل-الأصناف.html'}catch(e){window.renderPage&&window.renderPage()}
  };
  try{saveProductAdvanced=window.saveProductAdvanced}catch(e){}

  function stabilizeTables(){
    document.querySelectorAll('.table-wrap').forEach(function(w){
      if(w.dataset.r5Stable)return; w.dataset.r5Stable='1'; w.setAttribute('dir','ltr');
      var t=w.querySelector('table'); if(t)t.setAttribute('dir','rtl');
      ['touchstart','pointerdown','scroll','wheel'].forEach(function(ev){w.addEventListener(ev,function(){window.__oskarTableScrollUntil=Date.now()+5000;}, {passive:true});});
    });
  }
  function installScrollGuard(){
    if(window.__oskarR5ScrollGuard)return; window.__oskarR5ScrollGuard=true;
    var old=window.oskarIsUserEditing;
    window.oskarIsUserEditing=function(){if(Date.now()<(window.__oskarTableScrollUntil||0))return true; try{return old&&old.apply(this,arguments)}catch(e){return false}};
    document.addEventListener('scroll',function(e){if(e.target&&e.target.closest&&e.target.closest('.table-wrap'))window.__oskarTableScrollUntil=Date.now()+5000;},true);
  }

  function findSyncButton(){return Array.from(document.querySelectorAll('button,.icon-btn,.top-pill')).find(function(b){return /syncNow|مزامنة|↻/i.test((b.getAttribute('onclick')||'')+' '+(b.title||'')+' '+(b.textContent||''))})}
  function pendingCount(){return Math.max(0,parseInt(localStorage.getItem(PENDING_KEY)||'0',10)||0)}
  function setPendingCount(n){localStorage.setItem(PENDING_KEY,String(Math.max(0,n||0))); updateSyncBadge()}
  function markPendingOperation(){
    if(navigator.onLine) return;
    var nowTs=Date.now(); if(nowTs-lastPendingMark<700)return; lastPendingMark=nowTs;
    setPendingCount(pendingCount()+1);
  }
  function updateSyncBadge(){
    var b=findSyncButton(); if(!b)return; var n=pendingCount(); b.classList.toggle('sync-has-pending',n>0); var badge=b.querySelector('.sync-pending-badge');
    if(n>0){ if(!badge){badge=document.createElement('span'); badge.className='sync-pending-badge'; b.appendChild(badge);} badge.textContent=n>99?'99+':String(n); b.title='مزامنة - عمليات غير مرفوعة: '+n; }
    else { if(badge)badge.remove(); if(!b.title)b.title='مزامنة'; }
  }
  function installSyncBadge(){
    if(window.__oskarR5SyncBadge)return; window.__oskarR5SyncBadge=true;
    function wrapPersist(){
      if(typeof window.persist==='function'&&!window.persist.__r5PendingWrapped){var oldP=window.persist; window.persist=function(){var r=oldP.apply(this,arguments); markPendingOperation(); updateSyncBadge(); return r}; window.persist.__r5PendingWrapped=true; try{persist=window.persist}catch(e){}}
      if(typeof window.saveDB==='function'&&!window.saveDB.__r5PendingWrapped){var oldS=window.saveDB; window.saveDB=function(){var r=oldS.apply(this,arguments); markPendingOperation(); updateSyncBadge(); return r}; window.saveDB.__r5PendingWrapped=true; try{saveDB=window.saveDB}catch(e){}}
      if(typeof window.syncNow==='function'&&!window.syncNow.__r5PendingWrapped){var oldSync=window.syncNow; window.syncNow=async function(show){var b=findSyncButton(); try{if(b)b.classList.add('syncing'); if(!navigator.onLine){updateSyncBadge(); if(show&&window.toast)toast('لا يوجد اتصال، سيتم رفع '+pendingCount()+' عملية عند عودة الإنترنت'); return;} var r=await oldSync.apply(this,arguments); setPendingCount(0); return r;}catch(e){console.warn(e); updateSyncBadge(); if(show&&window.toast)toast('تعذرت المزامنة، بقيت العمليات محفوظة محليًا');}finally{if(b)b.classList.remove('syncing'); updateSyncBadge();}}; window.syncNow.__r5PendingWrapped=true; try{syncNow=window.syncNow}catch(e){}}
    }
    [0,120,500,1200].forEach(function(ms){setTimeout(wrapPersist,ms)});
    window.addEventListener('online',function(){updateSyncBadge(); if(pendingCount()>0&&typeof window.syncNow==='function')setTimeout(function(){window.syncNow(false)},700)});
    window.addEventListener('offline',updateSyncBadge);
    setInterval(updateSyncBadge,2000); updateSyncBadge();
  }

  function install(){
    injectR5Style(); installScrollGuard(); installSyncBadge(); stabilizeTables();
    if(isProductFormPage()&&(!$('mainCard')||$('mainCard').dataset.r5View!=='product-form')) window.renderProductForm();
    if(isPurchasePage()&&(!$('mainCard')||$('mainCard').dataset.r5View!=='purchase')) window.renderPurchaseForm();
    if($('productResults')&&!isPurchasePage()) window.showProductResults(($('productSearch')&&$('productSearch').value)||'');
    if($('cartBody')) window.renderCart&&window.renderCart();
  }
  var oldRender=window.renderPage;
  if(typeof oldRender==='function'&&!oldRender.__r5Wrapped){
    window.renderPage=function(){var r=oldRender.apply(this,arguments); setTimeout(install,50); return r}; window.renderPage.__r5Wrapped=true; try{renderPage=window.renderPage}catch(e){}
  }
  [0,80,260,700,1500].forEach(function(ms){setTimeout(install,ms)});
  document.addEventListener('DOMContentLoaded',function(){setTimeout(install,90)});
})();

/* Oskar R7: restore old product entry unit/carton/supplier form; keep purchase page unchanged - 2026-05-10 */
(function(){
  'use strict';
  if(window.__OSKAR_R7_RESTORE_OLD_PRODUCT_ENTRY__) return;
  window.__OSKAR_R7_RESTORE_OLD_PRODUCT_ENTRY__ = true;

  var APP_KEY='supermarket_pos_ar_v1';
  function $(id){return document.getElementById(id);}
  function pageName(){try{return decodeURIComponent((location.pathname.split('/').pop()||''));}catch(e){return location.pathname.split('/').pop()||'';}}
  function isProductPage(){var p=pageName(); return /إضافة-صنف|اضافة-صنف|add-product/i.test(p) || (window.CFG && (CFG.kind==='product_form' || CFG.filename==='إضافة-صنف.html'));}
  function txt(v){return String(v==null?'':v).trim();}
  function num(v){var n=Number(v||0); return isFinite(n)?n:0;}
  function esc(v){return txt(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  var dbCache=null;
  function data(){
    try{if(window.DB && typeof DB==='object'){dbCache=DB; return DB;}}catch(e){}
    if(dbCache) return dbCache;
    try{dbCache=JSON.parse(localStorage.getItem(APP_KEY)||'{}')||{};}catch(e){dbCache={};}
    return dbCache;
  }
  function arr(name){try{if(typeof window.collection==='function') return window.collection(name);}catch(e){} var d=data(); if(!Array.isArray(d[name])) d[name]=[]; return d[name];}
  function active(rows){return (rows||[]).filter(function(x){return x && x.active!=='غير نشط' && x.status!=='محذوف' && x.deleted!==true;});}
  function save(){var d=data(); try{if(typeof window.persist==='function') return window.persist();}catch(e){} try{if(typeof window.saveDB==='function') return window.saveDB(d);}catch(e){} try{localStorage.setItem(APP_KEY,JSON.stringify(d));}catch(e){} }
  function toast(m){try{if(typeof window.toast==='function') return window.toast(m);}catch(e){} alert(m);}
  function uid(p){try{if(typeof window.uid==='function') return window.uid(p);}catch(e){} return (p||'id')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);}
  function now(){try{if(typeof window.nowText==='function') return window.nowText();}catch(e){} return new Date().toLocaleString('ar-EG',{hour12:false});}
  function currentUserName(){try{return (window.currentUser&&window.currentUser().name)||'مدير النظام';}catch(e){return 'مدير النظام';}}
  function money(n){try{if(typeof window.money2==='function') return window.money2(n);}catch(e){} try{if(typeof window.money==='function') return window.money(n);}catch(e){} return num(n).toFixed(2);}
  function activeBranch(){try{if(typeof window.activeBranch==='function') return window.activeBranch();}catch(e){} var b=active(arr('branches'))[0]; return (b&&(b.name||b.id))||'';}
  function opts(rows,label,value,empty,selected){
    var html='<option value="">'+esc(empty||'اختر')+'</option>';
    active(rows).forEach(function(x){var val=txt(x[value]||x.id||x.name), lab=txt(x[label]||x.name||x.id); html+='<option value="'+esc(val)+'" '+(String(selected||'')===String(val)?'selected':'')+'>'+esc(lab)+'</option>';});
    return html;
  }
  function groupOptions(){var rows=active(arr('groups')).concat(active(arr('productGroups'))); var seen={}; var html='<option value="">اختر المجموعة</option>'; rows.forEach(function(g){var n=txt(g.name||g.title||g.id); if(!n||seen[n])return; seen[n]=1; html+='<option value="'+esc(n)+'">'+esc(n)+'</option>';}); return html;}
  function brandOptions(){return '<option value="">اختر الماركة</option>'+active(arr('brands')).map(function(b){var n=txt(b.name||b.id); return '<option value="'+esc(n)+'">'+esc(n)+'</option>';}).join('');}
  function supplierName(id){var s=active(arr('suppliers')).find(function(x){return String(x.id)===String(id)||String(x.name)===String(id);}); return s?txt(s.name||s.id):'';}
  function field(label,html,cls){return '<div class="field '+(cls||'')+'"><label>'+label+'</label>'+html+'</div>';}
  function addMovement(accountId,type,amount,source,note,sourceId){
    if(!accountId||num(amount)<=0) return;
    try{if(typeof window.addMovement==='function') return window.addMovement(accountId,type,amount,source,note,sourceId);}catch(e){}
    var accounts=arr('accounts'), a=accounts.find(function(x){return String(x.id)===String(accountId)||String(x.name)===String(accountId);});
    var before=num(a && a.balance), after=before+(type==='out'?-num(amount):num(amount)); if(a) a.balance=after;
    arr('accountMovements').unshift({id:uid('mov'),date:now(),accountId:accountId,accountName:(a&&(a.name||a.id))||accountId,type:type,amount:num(amount),balanceBefore:before,balanceAfter:after,source:source||'',note:note||'',sourceId:sourceId||''});
  }
  function ensureCartonUnit(p,size,buy,sale,pieceSale){
    size=Math.max(1,num(size));
    var units=(p.purchaseUnits||p.unitsMeta||[]).slice();
    var u=units.find(function(x){return txt(x.name)==='كرتونة'||String(x.id)==='carton'||String(x.id)==='unit-carton';});
    if(!u){u={id:'carton',name:'كرتونة',symbol:'CT'}; units.push(u);}
    u.pieces=size; u.piecesPerUnit=size; u.buyPrice=num(buy); u.salePrice=num(sale); u.pieceSalePrice=num(pieceSale); p.purchaseUnits=units; p.unitsMeta=units;
    var g=active(arr('units')).find(function(x){return txt(x.name)==='كرتونة'||String(x.id)==='unit-carton'||String(x.id)==='carton';});
    if(!g){arr('units').unshift({id:'unit-carton',name:'كرتونة',short:'كرتونة',symbol:'CT',allowFraction:'لا',ratio:size,pieces:size,piecesPerUnit:size,baseUnit:'وحدة'});} else {g.ratio=size; g.pieces=size; g.piecesPerUnit=size;}
  }

  function installStyle(){
    if($('oskar-r7-old-product-style')) return;
    var st=document.createElement('style'); st.id='oskar-r7-old-product-style';
    st.textContent='.product-old-entry-form{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;align-items:start!important}.product-old-entry-form .full-row,#cartonProductBox,#unitProductBox{grid-column:1/-1!important}.product-old-entry-form .section-label{grid-column:1/-1!important;background:#eef7f7!important;border:1px solid #d8eceb!important;color:#2f8584!important;border-radius:16px!important;padding:12px 14px!important;font-weight:950!important}.product-old-entry-form .field{margin:0!important;min-width:0!important}.product-old-entry-form label{font-weight:950!important;color:#304d56!important;margin-bottom:7px!important;font-size:13px!important}.product-old-entry-form input,.product-old-entry-form select,.product-old-entry-form textarea{width:100%!important;height:54px!important;min-height:54px!important;border:1px solid #dbe8e8!important;border-radius:17px!important;background:#fff!important;color:#263f4a!important;padding:0 14px!important;font-weight:850!important;box-sizing:border-box!important;outline:none!important}.product-old-entry-form textarea{height:78px!important;padding-top:12px!important;resize:none!important}.product-old-entry-form input[readonly]{background:#f6fbfb!important;color:#2f8584!important}.barcode-wrap{display:flex!important;gap:8px!important;align-items:center!important}.barcode-wrap input{flex:1!important}.product-calc-hint{display:block!important;background:#eef7f7!important;border:1px solid #d4eaea!important;color:#2f8584!important;border-radius:14px!important;padding:10px 12px!important;font-size:13px!important;font-weight:950!important;line-height:1.7!important}.hide{display:none!important}@media(max-width:520px){.product-old-entry-form{grid-template-columns:1fr!important}.product-old-entry-form .field{grid-column:1/-1!important}}';
    document.head.appendChild(st);
  }

  window.toggleCartonProductFields=function(){ window.calcProductUnitPrices&&window.calcProductUnitPrices(); };
  window.calcProductUnitPrices=function(){
    var f=$('crudForm') || $('productFinalForm') || $('advancedProductForm'); if(!f) return;
    var unit=(f.inputUnit&&f.inputUnit.value)||(f.unit&&f.unit.value)||'وحدة';
    var qty=num((f.stockInput&&f.stockInput.value)||(f.stock&&f.stock.value));
    var size=Math.max(1,num((f.cartonSize&&f.cartonSize.value)||24));
    var cartonBox=$('cartonProductBox'), unitBox=$('unitProductBox'), stockLabel=$('stockInputLabel');
    if(cartonBox) cartonBox.classList.toggle('hide',unit!=='كرتونة');
    if(unitBox) unitBox.classList.toggle('hide',unit==='كرتونة');
    if(stockLabel) stockLabel.textContent=unit==='كرتونة'?'عدد الكراتين المدخلة':'المخزون الافتتاحي';
    var stockUnits=unit==='كرتونة'?qty*size:qty;
    var buyCarton=num((f.cartonPurchasePrice&&f.cartonPurchasePrice.value)||(f.cartonWholesalePrice&&f.cartonWholesalePrice.value));
    var saleCarton=num((f.cartonSalePrice&&f.cartonSalePrice.value)||(f.cartonPrice&&f.cartonPrice.value));
    var unitBuy=unit==='كرتونة'?(buyCarton/size):num((f.purchasePrice&&f.purchasePrice.value)||(f.unitPurchaseManual&&f.unitPurchaseManual.value));
    var unitSale=unit==='كرتونة'?(saleCarton/size):num((f.salePrice&&f.salePrice.value)||(f.unitSaleManual&&f.unitSaleManual.value));
    if(f.unitPurchasePrice) f.unitPurchasePrice.value=(unitBuy||0).toFixed(3);
    if(f.unitSalePrice) f.unitSalePrice.value=(unitSale||0).toFixed(3);
    if(f.stockUnitsPreview) f.stockUnitsPreview.value=(stockUnits||0).toFixed(3).replace(/\.000$/,'');
    if(unit==='كرتونة'){
      if(f.purchasePrice) f.purchasePrice.value=(unitBuy||0).toFixed(3);
      if(f.salePrice) f.salePrice.value=(unitSale||0).toFixed(3);
      if(f.unitSaleFromCarton) f.unitSaleFromCarton.value=(unitSale||0).toFixed(3);
    }
    var hint=$('productCalcHint');
    if(hint){var total=unit==='كرتونة'?qty*buyCarton:qty*unitBuy; hint.textContent='المخزون سيُحسب: '+(stockUnits||0).toFixed(3).replace(/\.000$/,'')+' قطعة · تكلفة القطعة: '+money(unitBuy)+' · إجمالي تكلفة الإدخال: '+money(total);}
  };
  window.checkExistingBarcodeForProduct=function(v){
    v=txt(v); var h=$('productCalcHint'); if(!h||!v){return;}
    var found=arr('products').find(function(p){return txt(p.sku)===v||txt(p.barcode)===v;});
    h.textContent=found?'تنبيه: هذا الباركود موجود. عند الحفظ سيتم تحديث الصنف وزيادة المخزون.':'يتم الاحتساب بالوحدات.';
  };

  window.renderProductForm=function(){
    var main=$('mainCard'); if(!main) return;
    installStyle(); main.dataset.r5View='product-form'; main.dataset.r4View='product-form'; main.dataset.r7View='old-product-entry';
    main.innerHTML='<div class="form-section-title">بيانات الصنف والباركود</div>'+
      '<form id="crudForm" class="product-old-entry-form">'+
      field('اسم الصنف *','<input name="name" required placeholder="اسم الصنف">')+
      field('SKU / باركود','<div class="barcode-wrap"><input name="sku" placeholder="SKU أو باركود" oninput="checkExistingBarcodeForProduct(this.value)"><button type="button" class="btn ghost" onclick="startScanner&&startScanner(function(v){var f=document.getElementById(\'crudForm\');if(f){f.sku.value=v;}checkExistingBarcodeForProduct(v);})">كاميرا</button></div>')+
      field('المورد','<select name="supplierId">'+opts(arr('suppliers'),'name','id','بدون مورد')+'</select>')+
      field('الحساب للخصم','<select name="accountId">'+opts(arr('accounts'),'name','id','بدون خصم من حساب')+'</select>')+
      field('الفرع','<select name="branch">'+opts(arr('branches'),'name','name','اختر الفرع',activeBranch())+'</select>')+
      field('وحدة إدخال المخزون','<select name="inputUnit" id="prodUnit" onchange="toggleCartonProductFields()"><option selected>وحدة</option><option>كرتونة</option><option>كيلو</option><option>لتر</option></select>')+
      field('كمية الإدخال','<input name="stockInput" id="stockInput" type="number" step="0.001" value="0" oninput="calcProductUnitPrices()">')+
      field('المجموعة','<select name="group">'+groupOptions()+'</select>')+
      field('الماركة','<select name="brand">'+brandOptions()+'</select>')+
      '<div id="cartonProductBox" class="product-old-entry-form hide">'+
        field('كم وحدة في الكرتونة','<input name="cartonSize" id="cartonSize" type="number" step="1" value="24" oninput="calcProductUnitPrices()">')+
        field('عدد الوحدات المحسوب بالمخزون','<input id="stockUnitsPreview" readonly>')+
        field('سعر الشراء للكرتونة','<input name="cartonPurchasePrice" id="cartonPurchasePrice" type="number" step="0.01" value="0" oninput="calcProductUnitPrices()">')+
        field('سعر البيع للكرتونة','<input name="cartonSalePrice" id="cartonSalePrice" type="number" step="0.01" value="0" oninput="calcProductUnitPrices()">')+
        field('سعر الشراء للوحدة تلقائي','<input name="unitPurchasePrice" id="unitPurchasePrice" readonly>')+
        field('سعر البيع للوحدة تلقائي','<input name="unitSalePrice" id="unitSalePrice" readonly>')+
      '</div>'+ 
      '<div id="unitProductBox" class="product-old-entry-form">'+
        field('سعر الشراء للوحدة','<input name="purchasePrice" type="number" step="0.01" value="0" oninput="calcProductUnitPrices()">')+
        field('سعر البيع للوحدة','<input name="salePrice" type="number" step="0.01" value="0" oninput="calcProductUnitPrices()">')+
      '</div>'+ 
      field('يدعم البيع بالكسور؟','<select name="allowFraction"><option>لا</option><option>نعم</option></select>')+
      field('حد تنبيه المخزون','<input name="alertQty" type="number" step="0.001" value="0">')+
      field('ملاحظات','<textarea name="note"></textarea>','full-row')+
      '<div class="field full-row"><b id="productCalcHint" class="product-calc-hint">يتم الاحتساب بالوحدات.</b></div>'+ 
      '</form><div class="tools" style="justify-content:center;margin-top:16px"><button class="btn purple" onclick="saveProductAdvanced()">حفظ الصنف</button></div>';
    window.calcProductUnitPrices();
  };

  window.saveProductAdvanced=function(){
    var f=$('crudForm') || $('productFinalForm'); if(!f) return;
    var fd=new FormData(f), d={}; fd.forEach(function(v,k){d[k]=v;});
    d.name=txt(d.name); if(!d.name){toast('اكتب اسم الصنف'); return;}
    var inputUnit=txt(d.inputUnit||d.unit||'وحدة');
    var qty=num(d.stockInput||d.stock), size=Math.max(1,num(d.cartonSize||24));
    var purchasePiece=0, salePiece=0, stockUnits=qty, purchaseTotal=0, cartonPurchase=0, cartonSale=0;
    if(inputUnit==='كرتونة'){
      cartonPurchase=num(d.cartonPurchasePrice||d.cartonWholesalePrice); cartonSale=num(d.cartonSalePrice||d.cartonPrice);
      purchasePiece=cartonPurchase/size; salePiece=cartonSale/size; stockUnits=qty*size; purchaseTotal=qty*cartonPurchase;
    } else {
      purchasePiece=num(d.purchasePrice||d.unitPurchaseManual); salePiece=num(d.salePrice||d.unitSaleManual); stockUnits=qty; purchaseTotal=qty*purchasePiece;
      cartonPurchase=purchasePiece*size; cartonSale=salePiece*size;
    }
    var products=arr('products');
    var code=txt(d.barcode||d.sku);
    var existing=code?products.find(function(p){return txt(p.sku)===code||txt(p.barcode)===code;}):null;
    var supplier=supplierName(d.supplierId), before=num(existing&&(existing.stockUnits!=null?existing.stockUnits:existing.stock));
    var p=existing || {id:uid('products'),createdAt:now(),createdBy:currentUserName()};
    Object.assign(p,{name:d.name,sku:txt(d.sku),barcode:txt(d.barcode),supplierId:txt(d.supplierId),supplierName:supplier,accountId:txt(d.accountId),branch:txt(d.branch),inputUnit:inputUnit,unit:inputUnit==='كرتونة'?'وحدة':inputUnit,group:txt(d.group),brand:txt(d.brand),purchasePrice:purchasePiece,salePrice:salePiece,price:salePiece,cartonSize:size,cartonWholesalePrice:cartonPurchase,cartonPurchasePrice:cartonPurchase,cartonSalePrice:cartonSale,cartonPrice:cartonSale,unitSaleFromCarton:salePiece,hasCarton:inputUnit==='كرتونة'?'نعم':'لا',allowFraction:txt(d.allowFraction),alertQty:num(d.alertQty),note:txt(d.note),openingInputQty:qty,openingInputUnit:inputUnit,updatedAt:now(),updatedBy:currentUserName()});
    if(inputUnit==='كرتونة') ensureCartonUnit(p,size,cartonPurchase,cartonSale,salePiece);
    p.stock=before+stockUnits; p.stockUnits=p.stock;
    if(!existing) products.unshift(p);
    arr('stockMovements').unshift({id:uid('stk'),date:now(),type:existing?'إضافة كمية على صنف موجود':'مخزون افتتاحي',product:p.name,productId:p.id,branch:p.branch,qty:stockUnits,balanceBefore:before,balanceAfter:p.stock,unitName:inputUnit,piecesPerUnit:inputUnit==='كرتونة'?size:1,note:existing?'تحديث حسب باركود '+code:'إضافة صنف جديد'});
    if(d.accountId && purchaseTotal>0) addMovement(d.accountId,'out',purchaseTotal,(existing?'تحديث مخزون صنف ':'إضافة صنف ')+p.name,(supplier?'المورد: '+supplier:''),'product:'+p.id+':'+Date.now());
    save();
    toast(existing?'تم تحديث الصنف وزيادة المخزون':'تم حفظ الصنف');
    try{f.reset(); window.calcProductUnitPrices();}catch(e){}
  };
  window.saveProductFinal=window.saveProductAdvanced;

  function hookRenderPage(){
    var old=window.renderPage; if(typeof old!=='function' || old.__oskarR7ProductWrapped) return;
    window.renderPage=function(){ if(isProductPage()){try{ if(typeof window.renderCommon==='function') window.renderCommon(); }catch(e){} window.renderProductForm(); return null;} return old.apply(this,arguments); };
    window.renderPage.__oskarR7ProductWrapped=true; try{renderPage=window.renderPage;}catch(e){}
  }
  function install(){installStyle(); hookRenderPage(); if(isProductPage() && (!$('mainCard') || $('mainCard').dataset.r7View!=='old-product-entry')) window.renderProductForm();}
  [0,80,260,700,1500,2600].forEach(function(ms){setTimeout(install,ms);});
  document.addEventListener('DOMContentLoaded',function(){setTimeout(install,90);});
})();


/* Oskar R8: form layout, robust offline save, stable sync badge - 2026-05-10 */
(function(){
  'use strict';
  if(window.__OSKAR_R8_FORM_SAVE_SYNC__) return;
  window.__OSKAR_R8_FORM_SAVE_SYNC__ = true;
  var APP_KEY='supermarket_pos_ar_v1';
  function $(id){return document.getElementById(id);}
  function txt(v){return String(v==null?'':v).trim();}
  function esc(v){return txt(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function getDB(){try{if(window.DB&&typeof window.DB==='object')return window.DB;}catch(e){} try{window.DB=JSON.parse(localStorage.getItem(APP_KEY)||'{}')||{};return window.DB;}catch(e){window.DB={};return window.DB;}}
  function saveDBLocal(d){d=d||getDB();try{window.DB=d;}catch(e){} try{if(typeof window.saveDB==='function')window.saveDB(d);else localStorage.setItem(APP_KEY,JSON.stringify(d||{}));}catch(e){try{localStorage.setItem(APP_KEY,JSON.stringify(d||{}));}catch(_){}} return d;}
  function arr(name){var d=getDB(); if(!Array.isArray(d[name])) d[name]=[]; return d[name];}
  function uid(p){try{if(typeof window.uid==='function')return window.uid(p);}catch(e){} return (p||'id')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);}
  function now(){try{if(typeof window.nowText==='function')return window.nowText();}catch(e){} return new Date().toLocaleString('ar-EG',{hour12:false});}
  function userName(){try{return (window.currentUser&&window.currentUser().name)||'مدير النظام';}catch(e){return 'مدير النظام';}}
  function toast(m){try{if(typeof window.toast==='function')return window.toast(m);}catch(e){} try{alert(m);}catch(_){}}
  var PENDING_KEY='oskar_pending_sync_operations_v1';
  function pendingCount(){try{return Math.max(0,parseInt(localStorage.getItem(PENDING_KEY)||'0',10)||0);}catch(e){return 0;}}
  function setPending(n){try{localStorage.setItem(PENDING_KEY,String(Math.max(0,n||0)));}catch(e){} updateSyncBadge();}
  function bumpPending(){setPending(pendingCount()+1);}
  function findSyncButton(){return Array.from(document.querySelectorAll('button,.icon-btn,.top-pill')).find(function(b){return /syncNow|مزامنة|↻/i.test((b.getAttribute('onclick')||'')+' '+(b.title||'')+' '+(b.textContent||''));});}
  function updateSyncBadge(){
    var b=findSyncButton(); if(!b)return; var n=pendingCount(); b.classList.toggle('sync-has-pending',n>0);
    var badge=b.querySelector('.sync-pending-badge');
    if(n>0){if(!badge){badge=document.createElement('span');badge.className='sync-pending-badge';b.appendChild(badge);} badge.textContent=n>99?'99+':String(n); badge.title='عمليات غير مزامنة'; b.title='مزامنة - عمليات غير مرفوعة: '+n;}
    else {if(badge)badge.remove(); b.title='مزامنة';}
  }
  function injectStyle(){
    if($('oskar-r8-form-save-sync-style')) return;
    var st=document.createElement('style'); st.id='oskar-r8-form-save-sync-style';
    st.textContent='body.oskar-r8-ready #crudForm.grid,body.oskar-r8-ready #modalBody .grid,body.oskar-r8-ready .advanced-form-card .grid,body.oskar-r8-ready .purchase-entry-card .grid,body.oskar-r8-ready form.product-old-entry-form{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:12px!important;align-items:start!important}body.oskar-r8-ready .field{min-width:0!important}body.oskar-r8-ready .field.full-row,body.oskar-r8-ready .full-row,body.oskar-r8-ready #crudForm textarea[name="note"],body.oskar-r8-ready .field[style*="grid-column:1/-1"]{grid-column:1/-1!important}body.oskar-r8-ready input,body.oskar-r8-ready select,body.oskar-r8-ready textarea{box-sizing:border-box!important;max-width:100%!important}body.oskar-r8-ready textarea{min-height:78px!important;resize:vertical!important}body.oskar-r8-ready .purchase-entry-card+.card .table-wrap,body.oskar-r8-ready .table-wrap{overflow-x:auto!important;overflow-y:visible!important;-webkit-overflow-scrolling:touch!important;overscroll-behavior-x:contain!important;touch-action:pan-x pan-y!important;scroll-behavior:auto!important}body.oskar-r8-ready .table-wrap table{min-width:max-content!important}body.oskar-r8-ready button.syncing,body.oskar-r8-ready .icon-btn.syncing,body.oskar-r8-ready .top-pill.syncing{animation:none!important;transform:none!important}body.oskar-r8-ready button.syncing>svg,body.oskar-r8-ready .icon-btn.syncing>svg,body.oskar-r8-ready .top-pill.syncing>svg{animation:spinSync .9s linear infinite!important;transform-origin:center!important}body.oskar-r8-ready .sync-pending-badge{animation:none!important;transform:none!important;position:absolute!important;top:-7px!important;left:-7px!important;z-index:5!important;pointer-events:none!important}body.oskar-r8-ready .sync-has-pending{position:relative!important}@media(max-width:380px){body.oskar-r8-ready #crudForm.grid,body.oskar-r8-ready #modalBody .grid,body.oskar-r8-ready .advanced-form-card .grid,body.oskar-r8-ready .purchase-entry-card .grid,body.oskar-r8-ready form.product-old-entry-form{grid-template-columns:1fr!important}}';
    document.head.appendChild(st);
  }
  function robustPersist(){
    var old=window.__OSKAR_R8_OLD_PERSIST__;
    try{ if(typeof old==='function') old(); else saveDBLocal(getDB()); }
    catch(e){ console.warn('persist fallback',e); saveDBLocal(getDB()); if(!(old&&old.__r5PendingWrapped)) bumpPending(); }
    try{ if(navigator.onLine && typeof window.syncNow==='function') setTimeout(function(){window.syncNow(false);},700); }catch(e){}
    updateSyncBadge();
  }
  function installPersistWrapper(){
    if(window.persist && window.persist.__oskarR8Wrapped) return;
    window.__OSKAR_R8_OLD_PERSIST__ = window.persist;
    window.persist=function(){return robustPersist();};
    window.persist.__oskarR8Wrapped=true;
    window.persist.__r5PendingWrapped=true;
    try{persist=window.persist;}catch(e){}
  }
  function closeModalSafe(){try{if(typeof window.closeModal==='function')return window.closeModal();}catch(e){} var m=$('modalBack'); if(m)m.style.display='none';}
  function renderSafe(){try{if(typeof window.renderPage==='function')return window.renderPage();}catch(e){}}
  function logSafe(action,title,note){try{if(typeof window.logAction==='function')return window.logAction(action,title,note);}catch(e){} try{arr('activityLog').unshift({id:uid('act'),date:now(),action:action,subjectType:title||'',by:userName(),note:note||''});}catch(e){}}
  function isSimpleCrudPage(){try{return window.CFG && CFG.collection && $('crudForm') && !/products|sales|purchases|purchaseItems|stockMovements|accountMovements/i.test(CFG.collection);}catch(e){return false;}}
  function robustSaveCrud(){
    if(!isSimpleCrudPage()) { if(typeof window.__OSKAR_R8_OLD_SAVECRUD__==='function') return window.__OSKAR_R8_OLD_SAVECRUD__.apply(this,arguments); return; }
    var form=$('crudForm'); if(!form)return;
    var data={}; try{new FormData(form).forEach(function(v,k){ if(k!=='perm' && k!=='allPerms') data[k]=v; });}catch(e){toast('تعذر قراءة النموذج');return;}
    var coll=String(CFG.collection||''); var rows=arr(coll);
    if(coll==='employees'){
      var all=form.querySelector('[name="allPerms"]:checked');
      data.permissions=all?['*']:Array.from(form.querySelectorAll('[name="perm"]:checked')).map(function(x){return x.value;});
      if(!txt(data.name)){toast('اكتب اسم الموظف');return;}
      if(!txt(data.username)){data.username=txt(data.email||data.phone||data.mobile||data.name);}
      if(!txt(data.password)){toast('اكتب كلمة مرور الموظف');return;}
    }
    if(coll==='customers'){
      if(!txt(data.name)){toast('اكتب اسم العميل');return;}
      if(data.mobile && !data.phone) data.phone=data.mobile;
      if(data.phone && !data.mobile) data.mobile=data.phone;
    }
    try{
      if(txt(data.id)){
        var i=rows.findIndex(function(x){return String(x.id)===String(data.id);});
        if(i>=0) rows[i]=Object.assign({},rows[i],data,{updatedAt:now(),updatedBy:userName()});
        else {data.id=txt(data.id)||uid(coll);data.createdAt=now();data.createdBy=userName();rows.unshift(data);}
        logSafe('تعديل',CFG.title||coll,data.name||data.id);
      } else {
        data.id=uid(coll);data.createdAt=now();data.createdBy=userName();rows.unshift(data);logSafe('إضافة',CFG.title||coll,data.name||data.id);
      }
      saveDBLocal(getDB());
      if(window.persist && window.persist.__oskarR8Wrapped) window.persist(); else {saveDBLocal(getDB()); bumpPending();}
      closeModalSafe(); renderSafe(); toast(coll==='employees'?'تم حفظ الموظف':coll==='customers'?'تم حفظ العميل':'تم الحفظ');
    }catch(e){console.error(e); saveDBLocal(getDB()); toast('تم الحفظ محليًا، وسيتم رفعه عند توفر الإنترنت'); try{bumpPending();}catch(_){}}
  }
  function installSaveCrudWrapper(){
    if(window.saveCrud && window.saveCrud.__oskarR8Wrapped) return;
    window.__OSKAR_R8_OLD_SAVECRUD__=window.saveCrud;
    window.saveCrud=robustSaveCrud;
    window.saveCrud.__oskarR8Wrapped=true;
    try{saveCrud=window.saveCrud;}catch(e){}
  }
  function installSyncWrapper(){
    if(window.syncNow && window.syncNow.__oskarR8Wrapped) return;
    var old=window.syncNow;
    if(typeof old==='function'){
      window.syncNow=async function(show){var b=findSyncButton(); try{if(b)b.classList.add('syncing'); if(!navigator.onLine){updateSyncBadge(); if(show)toast('لا يوجد اتصال، البيانات محفوظة محليًا'); return;} var r=await old.apply(this,arguments); setPending(0); return r;}catch(e){console.warn(e); updateSyncBadge(); if(show)toast('تعذرت المزامنة، بقيت البيانات محفوظة محليًا');}finally{if(b)b.classList.remove('syncing'); updateSyncBadge();}};
      window.syncNow.__oskarR8Wrapped=true; window.syncNow.__r5PendingWrapped=true; try{syncNow=window.syncNow;}catch(e){}
    }
  }
  function install(){document.body&&document.body.classList.add('oskar-r8-ready'); injectStyle(); installPersistWrapper(); installSaveCrudWrapper(); installSyncWrapper(); updateSyncBadge();}
  [0,80,250,700,1500,2800].forEach(function(ms){setTimeout(install,ms);});
  document.addEventListener('DOMContentLoaded',function(){setTimeout(install,60);});
  window.addEventListener('online',function(){updateSyncBadge(); if(pendingCount()>0&&typeof window.syncNow==='function')setTimeout(function(){window.syncNow(false);},600);});
  window.addEventListener('offline',updateSyncBadge);
})();

/* Oskar R9: fix PAGE_CONFIG binding + users-section save/offline sync - 2026-05-10 */
(function(){
  'use strict';
  if(window.__OSKAR_R9_USERS_SAVE_FIX__) return;
  window.__OSKAR_R9_USERS_SAVE_FIX__ = true;

  var APP_KEY = 'supermarket_pos_ar_v1';
  var PENDING_KEY = 'oskar_pending_sync_operations_v1';
  var USER_COLLECTIONS = new Set(['employees','customers','suppliers','customerGroups']);

  function cfg(){
    var c = null;
    try{ if(typeof CFG !== 'undefined' && CFG) c = CFG; }catch(e){}
    c = c || window.CFG || window.PAGE_CONFIG || {};
    try{ if(c && !window.CFG) window.CFG = c; }catch(e){}
    return c || {};
  }
  cfg();

  function $(id){ return document.getElementById(id); }
  function val(v){ return String(v == null ? '' : v).trim(); }
  function nowISO(){ return new Date().toISOString(); }
  function nowText(){ try{ if(typeof window.nowText === 'function') return window.nowText(); }catch(e){} return new Date().toLocaleString('ar-EG',{hour12:false}); }
  function currentUserName(){ try{ return (typeof window.currentUser === 'function' && window.currentUser() && window.currentUser().name) || 'مدير النظام'; }catch(e){ return 'مدير النظام'; } }
  function toast(msg){ try{ if(typeof window.toast === 'function') return window.toast(msg); }catch(e){} try{ alert(msg); }catch(_){} }
  function uid(prefix){ try{ if(typeof window.uid === 'function') return window.uid(prefix || 'id'); }catch(e){} return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8); }

  function readDB(){
    try{ if(window.DB && typeof window.DB === 'object') return window.DB; }catch(e){}
    try{ window.DB = JSON.parse(localStorage.getItem(APP_KEY) || '{}') || {}; return window.DB; }
    catch(e){ window.DB = {}; return window.DB; }
  }
  function rowsOf(name){ var db=readDB(); if(!Array.isArray(db[name])) db[name]=[]; return db[name]; }
  function writeDB(db){
    db = db || readDB();
    db.lastLocalUpdate = nowISO();
    try{ window.DB = db; }catch(e){}
    try{ localStorage.setItem(APP_KEY, JSON.stringify(db)); }catch(e){ console.warn('local save failed', e); }
    try{ if(typeof window.updateSyncState === 'function') window.updateSyncState(); }catch(e){}
    return db;
  }
  function pendingCount(){ try{ return Math.max(0, parseInt(localStorage.getItem(PENDING_KEY) || '0', 10) || 0); }catch(e){ return 0; } }
  function setPending(n){ try{ localStorage.setItem(PENDING_KEY, String(Math.max(0, n || 0))); }catch(e){} updateSyncBadge(); }
  function bumpPending(){ setPending(pendingCount() + 1); }
  function findSyncButton(){
    return Array.from(document.querySelectorAll('button,.icon-btn,.top-pill')).find(function(b){
      return /syncNow|مزامنة|↻/i.test((b.getAttribute('onclick')||'') + ' ' + (b.title||'') + ' ' + (b.textContent||''));
    });
  }
  function updateSyncBadge(){
    var b = findSyncButton(); if(!b) return;
    var n = pendingCount(); b.classList.toggle('sync-has-pending', n > 0);
    var badge = b.querySelector('.sync-pending-badge');
    if(n > 0){
      if(!badge){ badge = document.createElement('span'); badge.className = 'sync-pending-badge'; b.appendChild(badge); }
      badge.textContent = n > 99 ? '99+' : String(n);
      badge.title = 'عمليات غير مزامنة';
    }else if(badge){ badge.remove(); }
  }
  function addStyle(){
    if($('oskar-r9-users-save-style')) return;
    var st=document.createElement('style'); st.id='oskar-r9-users-save-style';
    st.textContent='.sync-pending-badge{animation:none!important;transform:none!important;position:absolute!important;top:-7px!important;left:-7px!important;z-index:9!important;min-width:18px;height:18px;padding:0 5px;border-radius:999px;background:#ef4444!important;color:#fff!important;font-size:11px!important;font-weight:900!important;line-height:18px!important;text-align:center!important;box-shadow:0 4px 10px rgba(239,68,68,.35)!important;pointer-events:none!important}.sync-has-pending{position:relative!important}.syncing .sync-pending-badge{animation:none!important;transform:none!important}';
    (document.head||document.documentElement).appendChild(st);
  }
  function syncLater(show){
    updateSyncBadge();
    var db=readDB();
    try{ if(window.FirebaseBridge && typeof window.FirebaseBridge.queueSync === 'function') window.FirebaseBridge.queueSync(db); }catch(e){}
    if(navigator.onLine && typeof window.syncNow === 'function'){
      setTimeout(function(){
        try{ var p = window.syncNow(!!show); if(p && typeof p.then === 'function') p.then(function(){ setPending(0); }).catch(function(){ updateSyncBadge(); }); }
        catch(e){ updateSyncBadge(); }
      }, 350);
    }
  }
  function log(action,subject,note){
    try{
      var a = rowsOf('activityLog');
      a.unshift({id:uid('act'),date:nowText(),action:action,subjectType:subject||'',by:currentUserName(),note:note||''});
    }catch(e){}
  }
  function formData(form){
    var out={};
    try{ new FormData(form).forEach(function(v,k){ if(k !== 'perm' && k !== 'allPerms') out[k]=v; }); }catch(e){}
    return out;
  }
  function isUsersCrud(){
    var c = cfg();
    return !!($('crudForm') && c && USER_COLLECTIONS.has(String(c.collection||'')));
  }
  function saveUsersCrud(){
    var c = cfg();
    var form = $('crudForm');
    if(!form || !c.collection) return false;
    try{ if(form.reportValidity && !form.reportValidity()) return true; }catch(e){}

    var data = formData(form);
    var coll = String(c.collection || '');
    var rows = rowsOf(coll);
    var isEdit = !!val(data.id);
    var id = val(data.id);

    if(coll === 'employees'){
      var all = form.querySelector('[name="allPerms"]:checked');
      data.permissions = all ? ['*'] : Array.from(form.querySelectorAll('[name="perm"]:checked')).map(function(x){return x.value;});
      if(!val(data.name)){ toast('اكتب اسم الموظف'); return true; }
      if(!val(data.username)) data.username = val(data.email || data.phone || data.name);
      if(!isEdit && !val(data.password)){ toast('اكتب كلمة مرور الموظف'); return true; }
      if(isEdit && !val(data.password)){
        var oldEmp = rows.find(function(x){ return String(x.id) === id; });
        data.password = oldEmp && oldEmp.password || '';
      }
      data.active = data.active || 'نشط';
    }
    if(coll === 'customers'){
      if(!val(data.name)){ toast('اكتب اسم العميل'); return true; }
      if(data.mobile && !data.phone) data.phone = data.mobile;
      if(data.phone && !data.mobile) data.mobile = data.phone;
      data.balance = Number(data.balance || data.openingBalance || 0) || 0;
    }
    if(coll === 'suppliers'){
      if(!val(data.name)){ toast('اكتب اسم المورد'); return true; }
      if(data.mobile && !data.phone) data.phone = data.mobile;
      if(data.phone && !data.mobile) data.mobile = data.phone;
    }
    if(coll === 'customerGroups' && !val(data.name)){
      toast('اكتب اسم المجموعة'); return true;
    }

    var stamp = nowISO();
    data._updatedAt = stamp;
    data.updatedAt = nowText();
    if(isEdit){
      var i = rows.findIndex(function(x){ return String(x.id) === id; });
      if(i >= 0) rows[i] = Object.assign({}, rows[i], data);
      else { data.id = id || uid(coll); data.createdAt = nowText(); data.createdBy = currentUserName(); rows.unshift(data); }
      log('تعديل', c.title || coll, data.name || data.id);
    }else{
      data.id = uid(coll);
      data.createdAt = nowText();
      data.createdBy = currentUserName();
      data._createdAt = stamp;
      rows.unshift(data);
      log('إضافة', c.title || coll, data.name || data.id);
    }

    writeDB(readDB());
    bumpPending();
    try{ if(typeof window.closeModal === 'function') window.closeModal(); else if($('modalBack')) $('modalBack').style.display='none'; }catch(e){}
    try{ if(typeof window.renderPage === 'function') window.renderPage(); }catch(e){}
    toast(coll === 'employees' ? 'تم حفظ الموظف' : coll === 'customers' ? 'تم حفظ العميل' : coll === 'suppliers' ? 'تم حفظ المورد' : 'تم الحفظ');
    syncLater(false);
    return true;
  }

  function installSaveOverride(){
    cfg(); addStyle(); updateSyncBadge();
    if(!window.__OSKAR_R9_OLD_SAVECRUD__ && typeof window.saveCrud === 'function') window.__OSKAR_R9_OLD_SAVECRUD__ = window.saveCrud;
    var fn=function(){
      if(isUsersCrud()) return saveUsersCrud();
      if(typeof window.__OSKAR_R9_OLD_SAVECRUD__ === 'function') return window.__OSKAR_R9_OLD_SAVECRUD__.apply(this, arguments);
    };
    fn.__oskarR9Wrapped = true;
    fn.__oskarR8Wrapped = true;
    fn.__r5PendingWrapped = true;
    window.saveCrud = fn;
    try{ saveCrud = window.saveCrud; }catch(e){}
  }

  document.addEventListener('click', function(e){
    var btn = e.target && e.target.closest && e.target.closest('button');
    if(!btn || !isUsersCrud()) return;
    var modal = btn.closest && btn.closest('#modalBack,.modal');
    if(!modal) return;
    var text = val(btn.textContent);
    var onclick = btn.getAttribute('onclick') || '';
    if(text === 'حفظ' || /saveCrud\s*\(/.test(onclick)){
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      saveUsersCrud();
    }
  }, true);

  window.addEventListener('online', function(){ updateSyncBadge(); if(pendingCount() > 0) syncLater(false); });
  window.addEventListener('offline', updateSyncBadge);
  [0,40,120,350,900,1800,3200].forEach(function(ms){ setTimeout(installSaveOverride, ms); });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(installSaveOverride, 20); });
  else setTimeout(installSaveOverride, 20);
})();

/* Oskar R13: direct manual invoicing, invoice/customer payments, non-inventory sales report - 2026-05-11 */
(function(){
  'use strict';
  if(window.__OSKAR_R13_DIRECT_INVOICE_PAYMENTS__) return;
  window.__OSKAR_R13_DIRECT_INVOICE_PAYMENTS__ = true;

  var APP_KEY = 'supermarket_pos_ar_v1';
  var PENDING_KEY = 'oskar_pending_sync_operations_v1';
  var TEAL = '#409898';

  function $(id){ return document.getElementById(id); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function txt(v){ return String(v == null ? '' : v).trim(); }
  function num(v){ return Number(v || 0) || 0; }
  function money(v){ try{ if(typeof window.money2 === 'function') return window.money2(v); }catch(e){} try{ if(typeof window.money === 'function') return window.money(v); }catch(e){} return num(v).toFixed(2); }
  function uid(p){ try{ if(typeof window.uid === 'function') return window.uid(p); }catch(e){} return (p || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8); }
  function now(){ try{ if(typeof window.nowText === 'function') return window.nowText(); }catch(e){} return new Date().toLocaleString('ar-EG',{hour12:false}); }
  function today(){ try{ if(typeof window.todayISO === 'function') return window.todayISO(); }catch(e){} return new Date().toISOString().slice(0,10); }
  function toast(m){ try{ if(typeof window.toast === 'function') return window.toast(m); }catch(e){} try{ alert(m); }catch(_){} }
  function currentUserName(){ try{ return (window.currentUser && window.currentUser().name) || 'مدير النظام'; }catch(e){ return 'مدير النظام'; } }
  function pageName(){ return decodeURIComponent((location.pathname.split('/').pop() || 'index.html').split('?')[0]); }

  function db(){
    try{ if(window.DB && typeof window.DB === 'object') return window.DB; }catch(e){}
    try{ window.DB = JSON.parse(localStorage.getItem(APP_KEY) || '{}') || {}; }catch(e){ window.DB = {}; }
    return window.DB;
  }
  function arr(name){
    try{ if(typeof window.collection === 'function') return window.collection(name); }catch(e){}
    var d = db(); if(!Array.isArray(d[name])) d[name] = []; return d[name];
  }
  function active(rows){ return (rows || []).filter(function(x){ return x && !x.deletedAt && !x._deleted; }); }
  function write(){
    var d = db();
    try{ if(typeof window.persist === 'function') window.persist(); else if(typeof window.saveDB === 'function') window.saveDB(d); else localStorage.setItem(APP_KEY, JSON.stringify(d)); }
    catch(e){ try{ localStorage.setItem(APP_KEY, JSON.stringify(d)); }catch(_){} }
  }
  function pendingCount(){ try{ return Math.max(0, parseInt(localStorage.getItem(PENDING_KEY) || '0', 10) || 0); }catch(e){ return 0; } }
  function bumpPending(){ try{ localStorage.setItem(PENDING_KEY, String(pendingCount() + 1)); }catch(e){} try{ if(typeof window.updateSyncBadge === 'function') window.updateSyncBadge(); }catch(e){} }
  function saveAndSync(){
    write(); bumpPending();
    try{ if(navigator.onLine && typeof window.syncNow === 'function') setTimeout(function(){ window.syncNow(false); }, 500); }catch(e){}
  }
  function accountOptions(selected){
    return '<option value="">اختر الحساب</option>' + active(arr('accounts')).map(function(a){
      return '<option value="'+esc(a.id)+'" '+(String(selected||'')===String(a.id)?'selected':'')+'>'+esc(a.name || a.code || a.id)+'</option>';
    }).join('');
  }
  function customerOptions(selected){
    return '<option value="">اختر العميل</option>' + active(arr('customers')).map(function(c){
      var phone = c.phone || c.mobile || '';
      return '<option value="'+esc(c.id)+'" '+(String(selected||'')===String(c.id)?'selected':'')+'>'+esc(c.name || 'عميل')+(phone?' - '+esc(phone):'')+'</option>';
    }).join('');
  }
  function customerPhone(c){ return txt(c && (c.phone || c.mobile || c.whatsapp)); }
  function findCustomer(id,name,phone){
    var rows = arr('customers');
    return rows.find(function(c){ return id && String(c.id) === String(id); }) ||
           rows.find(function(c){ return phone && customerPhone(c) === txt(phone); }) ||
           rows.find(function(c){ return name && txt(c.name) === txt(name); });
  }
  function ensureCustomer(name, phone, id){
    name = txt(name); phone = txt(phone);
    var c = findCustomer(id, name, phone);
    if(c){
      if(name && !c.name) c.name = name;
      if(phone && !customerPhone(c)){ c.phone = phone; c.mobile = phone; }
      c.updatedAt = c.updatedAt || now();
      return c;
    }
    if(!name && !phone) return null;
    c = {id: uid('cust'), name: name || ('عميل '+phone), phone: phone, mobile: phone, createdAt: now(), createdBy: currentUserName(), source: 'تلقائي من فاتورة مباشرة'};
    arr('customers').unshift(c);
    return c;
  }
  function customerMatch(c, r){
    if(!c || !r) return false;
    var id = txt(c.id), name = txt(c.name), phone = customerPhone(c);
    return (!!id && (txt(r.customerId) === id || txt(r.partyId) === id)) ||
           (!!name && (txt(r.customerName) === name || txt(r.partyName) === name)) ||
           (!!phone && txt(r.customerPhone || r.partyPhone || r.phone || r.mobile) === phone);
  }
  function paymentStatus(total, paid, method){
    var due = Math.max(0, num(total) - num(paid));
    if(due <= 0) return 'مدفوع';
    if(num(paid) > 0) return 'جزئي';
    return method === 'تطبيق لاحق' ? 'تطبيق لاحق' : 'مستحق';
  }
  function accountMovement(accountId, type, amount, source, note, sourceId){
    amount = num(amount); if(!accountId || amount <= 0) return;
    try{ if(typeof window.addMovement === 'function') return window.addMovement(accountId, type, amount, source, note, sourceId); }catch(e){}
    var a = arr('accounts').find(function(x){ return String(x.id) === String(accountId); });
    var before = num(a && a.balance);
    var after = before + (/out|صادر/i.test(type) ? -amount : amount);
    if(a){ a.balance = after; a.updatedAt = now(); }
    arr('accountMovements').unshift({id:uid('mov'), date:now(), accountId:accountId, type:type, amount:amount, balanceBefore:before, balanceAfter:after, source:source||'', note:note||'', sourceId:sourceId||'', createdBy:currentUserName()});
  }
  function linkedDebtsForInvoice(rec){
    var sid = txt(rec && rec.id), inv = txt(rec && rec.invoiceNo);
    return active(arr('debts')).filter(function(d){
      return (sid && txt(d.sourceId).indexOf(sid) >= 0) || (inv && (txt(d.note) === inv || txt(d.invoiceNo) === inv || txt(d.referenceNo) === inv || txt(d.source) === inv));
    });
  }
  function createDebtForInvoice(rec, amount){
    amount = num(amount); if(!rec || amount <= 0) return null;
    var d = {id:uid('debt'), date:now(), partyType:'customer', partyId:rec.customerId||'', partyName:rec.customerName||'عميل', partyPhone:rec.customerPhone||'', customerPhone:rec.customerPhone||'', amount:amount, paid:0, remaining:amount, source:rec.isDirectInvoice?'فاتورة مباشرة':'فاتورة غير مكتملة', note:rec.invoiceNo||'', sourceId:(rec.isDirectInvoice?'directSale:':'sale:')+rec.id, invoiceId:rec.id, status:'مستحق', createdBy:currentUserName()};
    arr('debts').unshift(d); return d;
  }
  function applyDebtPaymentForInvoice(rec, amount, accountId, note){
    amount = num(amount); if(!rec || amount <= 0) return;
    var debts = linkedDebtsForInvoice(rec);
    var oldDue = num(rec.__oldDue != null ? rec.__oldDue : (num(rec.due) + amount));
    if(!debts.length && oldDue > 0) debts = [createDebtForInvoice(rec, oldDue)];
    var left = amount;
    debts.forEach(function(d){
      if(left <= 0) return;
      var rem = Math.max(0, num(d.remaining !== undefined ? d.remaining : num(d.amount) - num(d.paid)));
      var part = Math.min(rem, left);
      if(part <= 0) return;
      d.paid = num(d.paid) + part;
      d.remaining = Math.max(0, num(d.amount) - num(d.paid));
      d.status = d.remaining <= 0 ? 'مدفوع' : 'جزئي';
      d.paidAt = now(); d.paidAccountId = accountId;
      arr('debtPayments').unshift({id:uid('dp'), date:now(), debtId:d.id, invoiceId:rec.id, partyName:d.partyName||rec.customerName||'', partyPhone:d.partyPhone||rec.customerPhone||'', amount:part, accountId:accountId, note:note || ('دفعة على فاتورة '+(rec.invoiceNo||'')), createdBy:currentUserName()});
      left -= part;
    });
    if(left > 0){
      arr('debtPayments').unshift({id:uid('dp'), date:now(), debtId:'', invoiceId:rec.id, partyName:rec.customerName||'', partyPhone:rec.customerPhone||'', amount:left, accountId:accountId, note:note || ('دفعة زائدة على فاتورة '+(rec.invoiceNo||'')), createdBy:currentUserName()});
    }
  }

  function addStyle(){
    if($('oskar-r13-style')) return;
    var st = document.createElement('style'); st.id = 'oskar-r13-style';
    st.textContent = `
.r13-direct-toolbar{display:flex;gap:10px;align-items:center;justify-content:flex-start;flex-wrap:wrap;margin:0 0 14px!important;padding:12px;background:#f2fbfa;border:1px solid #d7eaea;border-radius:20px}.r13-report-card{margin:12px 0!important;background:#fff!important;border:1px solid #dfe9e9!important;border-radius:22px!important;padding:14px!important;box-shadow:0 10px 24px rgba(47,133,132,.08)!important}.r13-report-card h3{margin:0 0 10px!important;color:#304d56!important}.r13-report-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.r13-mini-kpi{background:#f5fbfb;border:1px solid #dcecec;border-radius:18px;padding:12px}.r13-mini-kpi span{display:block;font-size:12px;color:#607d82;font-weight:900}.r13-mini-kpi b{display:block;font-size:22px;color:#2f8584;font-weight:950}.direct-invoice-form{direction:rtl;color:#111}.direct-paper{background:#fff;border:2px solid #111;border-radius:24px;padding:16px;max-height:72vh;overflow:auto}.direct-paper-head{display:grid;grid-template-columns:1fr 190px 1fr;gap:12px;align-items:center;text-align:center;margin-bottom:10px}.direct-paper-logo{font-weight:950;font-size:28px;line-height:1}.direct-paper-logo small{display:block;font-size:12px;letter-spacing:2px}.direct-paper-note{font-size:14px;font-weight:900;border-bottom:2px solid #111;padding-bottom:5px}.direct-meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}.direct-meta .field,.direct-pay-grid .field{margin:0}.direct-meta input,.direct-pay-grid input,.direct-pay-grid select{height:46px;border:1px solid #cfdada;border-radius:14px;padding:0 12px;font-weight:850;width:100%;box-sizing:border-box}.direct-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}.direct-table{width:100%;min-width:760px;border-collapse:collapse;border:2px solid #111}.direct-table th,.direct-table td{border:2px solid #111;padding:3px;text-align:center}.direct-table th{font-weight:950;font-size:17px}.direct-table input{width:100%;border:0;outline:0;height:30px;text-align:center;font-weight:850;background:transparent}.direct-table input[name^="itemName"]{text-align:right;padding-right:8px}.direct-pay-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px;align-items:end}.direct-total-line{font-size:18px;font-weight:950;color:#2f8584}.invoice-pay-btn{background:#eaf8f7!important;color:#2f8584!important}.r13-ledger-extra{background:#fff7ed!important;color:#9a3412!important;border-color:#fed7aa!important}@media(max-width:760px){.r13-report-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.direct-paper{padding:10px;border-radius:18px}.direct-paper-head{grid-template-columns:1fr}.direct-meta,.direct-pay-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.direct-pay-grid .full{grid-column:1/-1}.direct-table{min-width:700px}.direct-table th{font-size:14px}.direct-table input{height:28px}}@media(max-width:390px){.direct-meta,.direct-pay-grid{grid-template-columns:1fr}}`;
    document.head.appendChild(st);
  }

  function directRowsHTML(){
    var rows = '';
    for(var i=1;i<=20;i++){
      rows += '<tr><td>'+i+'</td><td><input name="itemName_'+i+'" placeholder=""></td><td><input name="qty_'+i+'" type="number" step="0.001" oninput="calcDirectInvoice()"></td><td><input name="price_'+i+'" type="number" step="0.01" oninput="calcDirectInvoice()"></td><td><input name="line_'+i+'" readonly></td></tr>';
    }
    return rows;
  }
  window.calcDirectInvoice = function(){
    var f = $('directInvoiceForm'); if(!f) return;
    var total = 0;
    for(var i=1;i<=20;i++){
      var q = num(f['qty_'+i] && f['qty_'+i].value), p = num(f['price_'+i] && f['price_'+i].value), l = q*p;
      if(f['line_'+i]) f['line_'+i].value = l ? l.toFixed(2) : '';
      total += l;
    }
    var paid = num(f.paid && f.paid.value);
    if($('directTotal')) $('directTotal').textContent = money(total);
    if($('directDue')) $('directDue').textContent = money(Math.max(0,total-paid));
  };
  window.openDirectInvoice = function(){
    addStyle();
    document.body.classList.add('oskar-direct-modal-open');
    var title = $('modalTitle'), body = $('modalBody'), back = $('modalBack');
    if(!title || !body || !back){ toast('لا يمكن فتح نافذة الفاتورة في هذه الصفحة'); return; }
    title.textContent = 'فاوترة مباشر';
    var no = 'DIR-' + Date.now().toString().slice(-7);
    body.innerHTML = '<form id="directInvoiceForm" class="direct-invoice-form">'
      +'<div class="direct-paper">'
      +'<div class="direct-paper-head"><div class="direct-paper-logo">فاتورة مباشرة<small>إدخال يدوي بدون مخزون</small></div></div>'
      +'<div class="direct-meta"><div class="field"><label>السيد / اسم العميل</label><input name="customerName" placeholder="اسم العميل"></div><div class="field"><label>رقم الجوال</label><input name="customerPhone" inputmode="tel" placeholder="رقم الجوال"></div><div class="field"><label>التاريخ</label><input name="date" type="date" value="'+today()+'"></div><div class="field"><label>رقم الفاتورة</label><input name="invoiceNo" value="'+esc(no)+'"></div></div>'
      +'<div class="direct-table-wrap"><table class="direct-table"><thead><tr><th style="width:42px">م</th><th>الصنف</th><th style="width:110px">العدد</th><th style="width:120px">السعر</th><th style="width:130px">المبلغ</th></tr></thead><tbody>'+directRowsHTML()+'</tbody></table></div>'
      +'<div class="direct-pay-grid"><div class="field"><label>الإجمالي</label><div id="directTotal" class="direct-total-line">0.00</div></div><div class="field"><label>دفعة</label><input name="paid" type="number" step="0.01" value="0" oninput="calcDirectInvoice()"></div><div class="field"><label>الباقي</label><div id="directDue" class="direct-total-line">0.00</div></div><div class="field"><label>طريقة الدفع</label><select name="paymentMethod"><option>نقدي</option><option>تطبيق فوري</option><option>تحويل بنكي</option><option>تطبيق لاحق</option><option>دين</option></select></div><div class="field"><label>الحساب الذي دخلت عليه الدفعة</label><select name="accountId">'+accountOptions('')+'</select></div><div class="field"><label>ملاحظة</label><input name="note"></div></div>'
      +'</div><div class="tools" style="justify-content:center;margin-top:12px"><button type="button" class="btn purple" onclick="saveDirectInvoice()">حفظ الفاتورة</button><button type="button" class="btn success" onclick="saveDirectInvoice(true)">حفظ وطباعة</button><button type="button" class="btn ghost" onclick="closeModal&&closeModal()">إغلاق</button></div></form>';
    var footer = document.querySelector('#modalBack .modal > .tools'); if(footer) footer.style.display = 'none';
    back.style.display = 'flex';
    setTimeout(function(){ var first = document.querySelector('#directInvoiceForm [name="customerName"]'); if(first) first.focus(); },80);
  };
  window.saveDirectInvoice = function(printAfter){
    var f = $('directInvoiceForm'); if(!f) return;
    var items = [], total = 0;
    for(var i=1;i<=20;i++){
      var name = txt(f['itemName_'+i] && f['itemName_'+i].value), qty = num(f['qty_'+i] && f['qty_'+i].value), price = num(f['price_'+i] && f['price_'+i].value);
      if(!name && !qty && !price) continue;
      if(!name){ toast('اكتب اسم الصنف في السطر '+i); return; }
      if(qty <= 0){ toast('أدخل العدد في السطر '+i); return; }
      var line = qty * price; total += line;
      items.push({name:name, productId:'', manual:true, nonInventory:true, unit:'يدوي', unitName:'يدوي', qty:qty, factor:0, stockQty:0, unitPrice:price, purchasePrice:price, cost:line, profit:0, total:line});
    }
    if(!items.length){ toast('أدخل صنف واحد على الأقل'); return; }
    var paid = num(f.paid && f.paid.value), due = Math.max(0,total-paid), accountId = txt(f.accountId && f.accountId.value), method = txt(f.paymentMethod && f.paymentMethod.value) || 'نقدي';
    if(paid > 0 && !accountId){ toast('اختر الحساب الذي دخلت عليه الدفعة'); return; }
    if(due > 0 && (!txt(f.customerName.value) || !txt(f.customerPhone.value))){ toast('الفاتورة التي عليها باقي تحتاج اسم العميل ورقم الجوال'); return; }
    var customer = ensureCustomer(f.customerName.value, f.customerPhone.value, '');
    var rec = {id:uid('sale'), date:f.date.value || today(), invoiceNo:txt(f.invoiceNo.value) || ('DIR-'+Date.now()), customerId:customer && customer.id || '', customerName:txt(f.customerName.value) || (method === 'نقدي' ? 'زبون نقدي' : 'زبون تطبيق'), customerPhone:txt(f.customerPhone.value), items:items, total:total, paid:paid, due:due, paymentMethod:method, paymentStatus:paymentStatus(total,paid,method), accountId:accountId, note:txt(f.note.value), kind:'فاتورة مباشرة', saleType:'direct_manual_invoice', isDirectInvoice:true, isNonInventory:true, manualInvoice:true, noStock:true, noProfit:true, cost:total, profit:0, grossProfit:0, createdAt:now(), createdBy:currentUserName()};
    arr('sales').unshift(rec);
    if(paid > 0) accountMovement(accountId,'in',paid,'فاتورة مباشرة '+rec.invoiceNo,rec.note,'directSale:'+rec.id);
    if(due > 0) createDebtForInvoice(rec,due);
    saveAndSync();
    try{ if(typeof window.closeModal === 'function') window.closeModal(); else if($('modalBack')) $('modalBack').style.display='none'; }catch(e){}
    document.body.classList.remove('oskar-direct-modal-open');
    toast('تم حفظ الفاتورة المباشرة');
    try{ if(typeof window.renderPage === 'function') window.renderPage(); }catch(e){}
    if(printAfter){ setTimeout(function(){ try{ if(typeof window.printInvoice === 'function') window.printInvoice(rec); else window.print(); }catch(e){ window.print(); } },250); }
  };

  window.openInvoicePayment = function(id){
    var rec = arr('sales').find(function(x){ return String(x.id) === String(id); }); if(!rec) return;
    var due = Math.max(0, num(rec.due != null ? rec.due : num(rec.total)-num(rec.paid)));
    if(due <= 0){ toast('الفاتورة مدفوعة بالكامل'); return; }
    var title = $('modalTitle'), body = $('modalBody'), back = $('modalBack'); if(!title || !body || !back) return;
    document.body.classList.add('oskar-direct-modal-open');
    title.textContent = 'إضافة دفعة للفاتورة '+(rec.invoiceNo||'');
    body.innerHTML = '<form id="invoicePaymentForm" class="grid">'
      +'<div class="field"><label>العميل</label><input name="customerName" value="'+esc(rec.customerName||'')+'" readonly></div>'
      +'<div class="field"><label>رقم الجوال</label><input name="customerPhone" value="'+esc(rec.customerPhone||'')+'" readonly></div>'
      +'<div class="field"><label>الإجمالي</label><b>'+money(rec.total)+'</b></div><div class="field"><label>المدفوع سابقًا</label><b>'+money(rec.paid)+'</b></div>'
      +'<div class="field"><label>المتبقي</label><b style="color:#dc2626">'+money(due)+'</b></div><div class="field"><label>قيمة الدفعة</label><input name="amount" type="number" step="0.01" value="'+due+'"></div>'
      +'<div class="field"><label>الحساب الداخل عليه المبلغ</label><select name="accountId">'+accountOptions(rec.accountId||'')+'</select></div><div class="field"><label>ملاحظة</label><input name="note" placeholder="اختياري"></div>'
      +'</form><div class="tools" style="margin-top:12px;justify-content:center"><button class="btn purple" onclick="saveInvoicePayment(\''+esc(id)+'\')">حفظ الدفعة</button><button class="btn ghost" onclick="closeModal&&closeModal()">إغلاق</button></div>';
    var footer = document.querySelector('#modalBack .modal > .tools'); if(footer) footer.style.display = 'none';
    back.style.display = 'flex';
  };
  window.saveInvoicePayment = function(id){
    var rec = arr('sales').find(function(x){ return String(x.id) === String(id); }); var f = $('invoicePaymentForm'); if(!rec || !f) return;
    var oldDue = Math.max(0, num(rec.due != null ? rec.due : num(rec.total)-num(rec.paid)));
    var amount = num(f.amount.value), accountId = txt(f.accountId.value), note = txt(f.note.value);
    if(amount <= 0){ toast('أدخل مبلغ صحيح'); return; }
    if(!accountId){ toast('اختر الحساب'); return; }
    if(amount > oldDue) amount = oldDue;
    rec.__oldDue = oldDue;
    rec.paid = num(rec.paid) + amount;
    rec.due = Math.max(0, num(rec.total) - num(rec.paid));
    rec.paymentStatus = paymentStatus(rec.total,rec.paid,rec.paymentMethod);
    rec.lastPaymentAt = now(); rec.updatedAt = now();
    accountMovement(accountId,'in',amount,'دفعة فاتورة '+(rec.invoiceNo||''),note,'invoicePayment:'+rec.id+':'+Date.now());
    applyDebtPaymentForInvoice(rec,amount,accountId,note);
    delete rec.__oldDue;
    saveAndSync();
    try{ if(typeof window.closeModal === 'function') window.closeModal(); else $('modalBack').style.display='none'; }catch(e){}
    document.body.classList.remove('oskar-direct-modal-open');
    toast('تم حفظ الدفعة وترحيلها للحساب');
    try{ if(typeof window.renderPage === 'function') window.renderPage(); }catch(e){}
  };

  window.openCustomerManualDebtR13 = function(id,name,phone){
    var c = findCustomer(id,name,phone) || {id:id||'', name:name||'', phone:phone||''};
    var title=$('modalTitle'), body=$('modalBody'), back=$('modalBack'); if(!title||!body||!back) return;
    document.body.classList.add('oskar-direct-modal-open');
    title.textContent = 'دين يدوي على عميل';
    body.innerHTML = '<form id="customerManualDebtForm" class="grid">'
      +'<div class="field"><label>العميل المسجل</label><select name="customerId" onchange="fillR13DebtCustomer(this.value)">'+customerOptions(c.id||'')+'</select></div>'
      +'<div class="field"><label>اسم العميل *</label><input name="partyName" value="'+esc(c.name||'')+'"></div>'
      +'<div class="field"><label>رقم الجوال *</label><input name="partyPhone" inputmode="tel" value="'+esc(customerPhone(c)||phone||'')+'"></div>'
      +'<div class="field"><label>المبلغ</label><input name="amount" type="number" step="0.01"></div>'
      +'<div class="field"><label>نوع العملية</label><select name="source"><option>دين يدوي</option><option>فاتورة غير مكتملة</option><option>تطبيق لاحق</option></select></div>'
      +'<div class="field"><label>ملاحظة</label><input name="note"></div>'
      +'</form><div class="tools" style="margin-top:12px;justify-content:center"><button class="btn purple" onclick="saveCustomerManualDebtR13()">حفظ الدين</button><button class="btn ghost" onclick="closeModal&&closeModal()">إغلاق</button></div>';
    var footer = document.querySelector('#modalBack .modal > .tools'); if(footer) footer.style.display='none';
    back.style.display='flex';
  };
  window.fillR13DebtCustomer = function(id){
    var c = findCustomer(id,'',''), f = $('customerManualDebtForm'); if(!c || !f) return;
    f.partyName.value = c.name || ''; f.partyPhone.value = customerPhone(c);
  };
  window.saveCustomerManualDebtR13 = function(){
    var f=$('customerManualDebtForm'); if(!f) return;
    var name=txt(f.partyName.value), phone=txt(f.partyPhone.value), amount=num(f.amount.value);
    if(!name || !phone){ toast('أدخل اسم العميل ورقم الجوال'); return; }
    if(amount<=0){ toast('أدخل مبلغ صحيح'); return; }
    var c=ensureCustomer(name,phone,f.customerId.value);
    arr('debts').unshift({id:uid('debt'),date:now(),partyType:'customer',partyId:c&&c.id||'',partyName:name,partyPhone:phone,customerPhone:phone,amount:amount,paid:0,remaining:amount,source:txt(f.source.value)||'دين يدوي',note:txt(f.note.value),sourceId:'manualDebt:'+Date.now(),status:'مستحق',createdBy:currentUserName()});
    saveAndSync();
    try{ if(typeof window.closeModal==='function') window.closeModal(); else $('modalBack').style.display='none'; }catch(e){}
    document.body.classList.remove('oskar-direct-modal-open');
    toast('تم تسجيل الدين اليدوي'); try{ if(typeof window.renderPage==='function') window.renderPage(); }catch(e){}
  };
  window.openCustomerDebtPaymentR13 = function(id,name,phone){
    var c = findCustomer(id,name,phone) || {id:id||'',name:name||'',phone:phone||''};
    var debts = active(arr('debts')).filter(function(d){ return (d.partyType === 'customer' || !d.partyType) && customerMatch(c,d) && Math.max(0,num(d.remaining !== undefined ? d.remaining : num(d.amount)-num(d.paid))) > 0; });
    var total = debts.reduce(function(s,d){ return s + Math.max(0,num(d.remaining !== undefined ? d.remaining : num(d.amount)-num(d.paid))); },0);
    if(total<=0){ toast('لا يوجد دين مفتوح على هذا العميل'); return; }
    var title=$('modalTitle'), body=$('modalBody'), back=$('modalBack'); if(!title||!body||!back) return;
    document.body.classList.add('oskar-direct-modal-open');
    title.textContent = 'إضافة دفعة سداد دين';
    body.innerHTML = '<form id="customerDebtPaymentForm" class="grid">'
      +'<div class="field"><label>العميل</label><input name="partyName" value="'+esc(c.name||name||'')+'" readonly></div>'
      +'<div class="field"><label>رقم الجوال</label><input name="partyPhone" value="'+esc(customerPhone(c)||phone||'')+'" readonly></div>'
      +'<div class="field"><label>إجمالي الدين المفتوح</label><b style="color:#dc2626">'+money(total)+'</b></div>'
      +'<div class="field"><label>قيمة الدفعة</label><input name="amount" type="number" step="0.01" value="'+total+'"></div>'
      +'<div class="field"><label>الحساب الداخل عليه المبلغ</label><select name="accountId">'+accountOptions('')+'</select></div>'
      +'<div class="field"><label>ملاحظة</label><input name="note"></div>'
      +'<input type="hidden" name="customerId" value="'+esc(c.id||id||'')+'"></form><div class="tools" style="margin-top:12px;justify-content:center"><button class="btn purple" onclick="saveCustomerDebtPaymentR13()">حفظ الدفعة</button><button class="btn ghost" onclick="closeModal&&closeModal()">إغلاق</button></div>';
    var footer=document.querySelector('#modalBack .modal > .tools'); if(footer) footer.style.display='none';
    back.style.display='flex';
  };
  window.saveCustomerDebtPaymentR13 = function(){
    var f=$('customerDebtPaymentForm'); if(!f) return;
    var c=findCustomer(f.customerId.value,f.partyName.value,f.partyPhone.value) || {id:f.customerId.value,name:f.partyName.value,phone:f.partyPhone.value};
    var amount=num(f.amount.value), accountId=txt(f.accountId.value), note=txt(f.note.value);
    if(amount<=0){ toast('أدخل مبلغ صحيح'); return; }
    if(!accountId){ toast('اختر الحساب'); return; }
    var debts=active(arr('debts')).filter(function(d){return (d.partyType==='customer'||!d.partyType)&&customerMatch(c,d)&&Math.max(0,num(d.remaining!==undefined?d.remaining:num(d.amount)-num(d.paid)))>0;}).sort(function(a,b){return String(a.date||'').localeCompare(String(b.date||''));});
    var left=amount;
    debts.forEach(function(d){
      if(left<=0) return;
      var rem=Math.max(0,num(d.remaining!==undefined?d.remaining:num(d.amount)-num(d.paid))); var part=Math.min(rem,left);
      if(part<=0) return;
      d.paid=num(d.paid)+part; d.remaining=Math.max(0,num(d.amount)-num(d.paid)); d.status=d.remaining<=0?'مدفوع':'جزئي'; d.paidAt=now(); d.paidAccountId=accountId;
      arr('debtPayments').unshift({id:uid('dp'),date:now(),debtId:d.id,partyName:d.partyName||c.name||'',partyPhone:d.partyPhone||customerPhone(c)||'',amount:part,accountId:accountId,note:note||'دفعة سداد دين',createdBy:currentUserName()});
      left-=part;
    });
    accountMovement(accountId,'in',amount-left,'دفعة سداد دين '+(c.name||''),note,'customerDebtPayment:'+(c.id||'')+':'+Date.now());
    saveAndSync();
    try{ if(typeof window.closeModal==='function') window.closeModal(); else $('modalBack').style.display='none'; }catch(e){}
    document.body.classList.remove('oskar-direct-modal-open');
    toast('تم تسجيل دفعة السداد'); try{ if(typeof window.renderPage==='function') window.renderPage(); }catch(e){}
  };

  function enhanceInvoicesPage(){
    if(pageName() !== 'الفواتير.html') return;
    var main = $('mainCard'); if(!main) return;
    if(!$('r13DirectToolbar')){
      main.insertAdjacentHTML('afterbegin','<div id="r13DirectToolbar" class="r13-direct-toolbar"><button class="btn purple" onclick="openDirectInvoice()">+ فاوترة مباشر</button><span class="muted">إدخال أصناف يدويًا بدون خصم من المخزون.</span></div>');
    }
    injectDirectReport(main, true);
  }
  function directStats(){
    var rows = active(arr('sales')).filter(function(s){ return s.isDirectInvoice || s.saleType === 'direct_manual_invoice' || s.manualInvoice; });
    return {count:rows.length,total:rows.reduce(function(a,s){return a+num(s.total);},0),paid:rows.reduce(function(a,s){return a+num(s.paid);},0),due:rows.reduce(function(a,s){return a+num(s.due);},0)};
  }
  function injectDirectReport(root, compact){
    root = root || $('mainCard'); if(!root || $('r13DirectReportCard')) return;
    var s = directStats();
    var html = '<div id="r13DirectReportCard" class="r13-report-card"><h3>مبيعات الفواتير غير المباشرة</h3><div class="r13-report-grid"><div class="r13-mini-kpi"><span>عدد الفواتير</span><b>'+s.count+'</b></div><div class="r13-mini-kpi"><span>إجمالي المبيعات</span><b>'+money(s.total)+'</b></div><div class="r13-mini-kpi"><span>المدفوع</span><b>'+money(s.paid)+'</b></div><div class="r13-mini-kpi"><span>المتبقي</span><b>'+money(s.due)+'</b></div></div><div class="muted" style="margin-top:8px">هذه الفواتير لا تُحسب ضمن الأرباح لأنها لا تخصم من المخزون.</div></div>';
    root.insertAdjacentHTML(compact ? 'afterbegin' : 'beforeend', html);
  }
  function enhanceReports(){
    var p=pageName();
    if(/تقرير|كل-المبيعات|مرجع-المبيعات/.test(p) && !/لوحة-المتابعة|index/.test(p)) injectDirectReport($('mainCard'), /تقرير/.test(p));
  }
  function enhanceLedgerActions(){
    var card = $('mainCard') || document;
    var title = card.querySelector('.ledger-title-card h2');
    if(!title || $('r13LedgerPaymentActions')) return;
    if((title.textContent||'').indexOf('سجل العميل') < 0) return;
    var sub = card.querySelector('.ledger-title-card .muted');
    var name = (title.textContent||'').replace('سجل العميل -','').trim();
    var phone = sub ? (sub.textContent||'').trim() : '';
    var actions = card.querySelector('.ledger-title-card .ledger-actions');
    if(actions){
      actions.insertAdjacentHTML('beforeend','<span id="r13LedgerPaymentActions" style="display:inline-flex;gap:8px;flex-wrap:wrap"><button class="btn success" onclick="openCustomerDebtPaymentR13(\'\',\''+esc(name)+'\',\''+esc(phone)+'\')">+ دفعة سداد دين</button><button class="btn ghost r13-ledger-extra" onclick="openCustomerManualDebtR13(\'\',\''+esc(name)+'\',\''+esc(phone)+'\')">+ دين يدوي</button></span>');
    }
  }
  function wrapInvoiceActions(){
    var old = window.invoiceActions;
    if(typeof old === 'function' && !old.__r13Wrapped){
      var w = function(id){
        var html = old.apply(this,arguments) || '';
        if(html.indexOf('data-invoice-action="payment"') < 0){
          html = html.replace('</div>','<button class="btn small invoice-pay-btn" title="إضافة دفعة" aria-label="إضافة دفعة" data-invoice-action="payment" data-id="'+esc(id)+'">＋</button></div>');
        }
        return html;
      };
      w.__r13Wrapped = true; window.invoiceActions = w; try{ invoiceActions = w; }catch(e){}
    }
  }
  function wrapRenderInvoices(){
    var old = window.renderInvoices;
    if(typeof old === 'function' && !old.__r13Wrapped){
      var w = function(){ var r = old.apply(this,arguments); setTimeout(function(){ enhanceInvoicesPage(); wrapInvoiceActions(); },40); return r; };
      w.__r13Wrapped = true; window.renderInvoices = w; try{ renderInvoices = w; }catch(e){}
    }
  }
  function wrapRenderPage(){
    var old = window.renderPage;
    if(typeof old === 'function' && !old.__r13Wrapped){
      var w = function(){ var r = old.apply(this,arguments); setTimeout(function(){ install(); },80); return r; };
      w.__r13Wrapped = true; window.renderPage = w; try{ renderPage = w; }catch(e){}
    }
  }
  function wrapCloseModal(){
    var old = window.closeModal;
    if(typeof old === 'function' && !old.__r13Wrapped){
      var w = function(){ document.body.classList.remove('oskar-direct-modal-open'); var footer=document.querySelector('#modalBack .modal > .tools'); if(footer) footer.style.display=''; return old.apply(this,arguments); };
      w.__r13Wrapped = true; window.closeModal = w; try{ closeModal = w; }catch(e){}
    }
  }
  function wrapCustomerLedger(){
    var old = window.openCustomerLedgerSmart;
    if(typeof old === 'function' && !old.__r13Wrapped){
      var w = function(){ var r = old.apply(this,arguments); setTimeout(enhanceLedgerActions,80); return r; };
      w.__r13Wrapped = true; window.openCustomerLedgerSmart = w; try{ openCustomerLedgerSmart = w; }catch(e){}
      window.openCustomerLedger = function(id){ return window.openCustomerLedgerSmart(id,'',''); };
      try{ openCustomerLedger = window.openCustomerLedger; }catch(e){}
    }
  }
  function normalizeExistingDirectInvoices(){
    active(arr('sales')).forEach(function(s){
      if(s.isDirectInvoice || s.saleType === 'direct_manual_invoice' || s.manualInvoice){
        s.isDirectInvoice = true; s.saleType = 'direct_manual_invoice'; s.isNonInventory = true; s.noStock = true; s.noProfit = true; s.cost = num(s.total); s.profit = 0; s.grossProfit = 0;
        (s.items||[]).forEach(function(i){ i.manual = true; i.nonInventory = true; i.stockQty = 0; i.factor = 0; i.purchasePrice = num(i.unitPrice); i.cost = num(i.total); i.profit = 0; });
      }
    });
  }
  function install(){
    addStyle(); wrapCloseModal(); wrapInvoiceActions(); wrapRenderInvoices(); wrapRenderPage(); wrapCustomerLedger(); normalizeExistingDirectInvoices(); enhanceInvoicesPage(); enhanceReports(); enhanceLedgerActions();
  }
  document.addEventListener('click',function(e){
    var b = e.target && e.target.closest && e.target.closest('[data-invoice-action="payment"]');
    if(!b) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    window.openInvoicePayment(b.getAttribute('data-id'));
  }, true);
  [0,80,240,700,1400,2600].forEach(function(ms){ setTimeout(install,ms); });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',function(){ setTimeout(install,60); }); else setTimeout(install,60);
})();


/* Oskar R14: direct invoice as full page, clean home report, online sync badge fix - 2026-05-11 */
(function(){
  'use strict';
  if(window.__OSKAR_R14_DIRECT_PAGE_SYNC_FIX__) return;
  window.__OSKAR_R14_DIRECT_PAGE_SYNC_FIX__ = true;

  var APP_KEY='supermarket_pos_ar_v1';
  var PENDING_KEY='oskar_pending_sync_operations_v1';
  var TEAL='#409898';
  function $(id){return document.getElementById(id)}
  function qs(s,r){return (r||document).querySelector(s)}
  function qsa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
  function txt(v){return String(v==null?'':v).trim()}
  function esc(v){return txt(v).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]})}
  function num(v){return Number(v||0)||0}
  function uid(p){try{if(typeof window.uid==='function')return window.uid(p)}catch(e){} return (p||'id')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
  function now(){try{if(typeof window.nowText==='function')return window.nowText()}catch(e){} return new Date().toLocaleString('ar-EG',{hour12:false})}
  function today(){try{if(typeof window.todayISO==='function')return window.todayISO()}catch(e){} return new Date().toISOString().slice(0,10)}
  function money(v){try{if(typeof window.money2==='function')return window.money2(v)}catch(e){} try{if(typeof window.money==='function')return window.money(v)}catch(e){} return num(v).toFixed(2)}
  function toast(m){try{if(typeof window.toast==='function')return window.toast(m)}catch(e){} try{alert(m)}catch(_){}}
  function pageName(){return decodeURIComponent((location.pathname.split('/').pop()||'index.html').split('?')[0])}
  function db(){try{if(window.DB&&typeof window.DB==='object')return window.DB}catch(e){} try{window.DB=JSON.parse(localStorage.getItem(APP_KEY)||'{}')||{}}catch(e){window.DB={}} return window.DB}
  function arr(name){try{if(typeof window.collection==='function')return window.collection(name)}catch(e){} var d=db(); if(!Array.isArray(d[name]))d[name]=[]; return d[name]}
  function active(rows){return (rows||[]).filter(function(x){return x&&!x.deletedAt&&!x._deleted})}
  function currentUserName(){try{return (window.currentUser&&window.currentUser().name)||'مدير النظام'}catch(e){return 'مدير النظام'}}
  function pendingCount(){try{return Math.max(0,parseInt(localStorage.getItem(PENDING_KEY)||'0',10)||0)}catch(e){return 0}}
  function setPending(n){try{localStorage.setItem(PENDING_KEY,String(Math.max(0,n||0)))}catch(e){} updateSyncBadgeR14()}
  function bumpPendingOffline(){if(navigator.onLine)return; setPending(pendingCount()+1)}
  function findSyncButton(){return qsa('button,.icon-btn,.top-pill').find(function(b){return /syncNow|مزامنة|↻/i.test((b.getAttribute('onclick')||'')+' '+(b.title||'')+' '+(b.textContent||''))})}
  function updateSyncBadgeR14(){
    var b=findSyncButton(); if(!b)return;
    var n=pendingCount(); b.classList.toggle('sync-has-pending',n>0);
    var badge=b.querySelector('.sync-pending-badge');
    if(n>0){if(!badge){badge=document.createElement('span');badge.className='sync-pending-badge';b.appendChild(badge)} badge.textContent=n>99?'99+':String(n); badge.title='عمليات غير مزامنة'; b.title='مزامنة - عمليات غير مرفوعة: '+n;}
    else{if(badge)badge.remove(); b.title='مزامنة';}
  }
  window.updateSyncBadge = updateSyncBadgeR14;
  function writeSmart(){
    var d=db(); d.lastLocalUpdate=new Date().toISOString();
    try{localStorage.setItem(APP_KEY,JSON.stringify(d)); window.DB=d}catch(e){}
    if(navigator.onLine){try{if(typeof window.syncNow==='function')setTimeout(function(){window.syncNow(false)},120)}catch(e){} setTimeout(function(){if(navigator.onLine)setPending(0)},1200);}
    else bumpPendingOffline();
    updateSyncBadgeR14();
  }
  function accountOptions(selected){
    return '<option value="">اختر الحساب</option>'+active(arr('accounts')).map(function(a){return '<option value="'+esc(a.id)+'" '+(String(selected||'')===String(a.id)?'selected':'')+'>'+esc(a.name||a.code||a.id)+'</option>'}).join('')
  }
  function customerPhone(c){return txt(c&&(c.phone||c.mobile||c.whatsapp))}
  function findCustomer(id,name,phone){
    var rows=arr('customers');
    return rows.find(function(c){return id&&String(c.id)===String(id)})||rows.find(function(c){return phone&&customerPhone(c)===txt(phone)})||rows.find(function(c){return name&&txt(c.name)===txt(name)});
  }
  function ensureCustomer(name,phone,id){
    name=txt(name); phone=txt(phone); var c=findCustomer(id,name,phone);
    if(c){if(name&&!c.name)c.name=name; if(phone&&!customerPhone(c)){c.phone=phone;c.mobile=phone} c.updatedAt=now(); return c}
    if(!name&&!phone)return null;
    c={id:uid('cust'),name:name||('عميل '+phone),phone:phone,mobile:phone,createdAt:now(),createdBy:currentUserName(),source:'تلقائي من الفاتورة'};
    arr('customers').unshift(c); return c;
  }
  function paymentStatus(total,paid,method){var due=Math.max(0,num(total)-num(paid)); if(due<=0)return 'مدفوع'; if(num(paid)>0)return 'جزئي'; return method==='تطبيق لاحق'?'تطبيق لاحق':'مستحق'}
  function accountMovement(accountId,type,amount,source,note,sourceId){
    amount=num(amount); if(!accountId||amount<=0)return;
    try{if(typeof window.addMovement==='function')return window.addMovement(accountId,type,amount,source,note,sourceId)}catch(e){}
    var a=arr('accounts').find(function(x){return String(x.id)===String(accountId)}), before=num(a&&a.balance), after=before+(/out|صادر/i.test(type)?-amount:amount);
    if(a){a.balance=after; a.updatedAt=now()}
    arr('accountMovements').unshift({id:uid('mov'),date:now(),accountId:accountId,type:type,amount:amount,balanceBefore:before,balanceAfter:after,source:source||'',note:note||'',sourceId:sourceId||'',createdBy:currentUserName()});
  }
  function createDebtForInvoice(rec,amount){
    amount=num(amount); if(!rec||amount<=0)return;
    arr('debts').unshift({id:uid('debt'),date:now(),partyType:'customer',partyId:rec.customerId||'',partyName:rec.customerName||'عميل',partyPhone:rec.customerPhone||'',customerPhone:rec.customerPhone||'',amount:amount,paid:0,remaining:amount,source:'فاتورة مباشرة',note:rec.invoiceNo||'',sourceId:'directSale:'+rec.id,invoiceId:rec.id,status:'مستحق',createdBy:currentUserName()});
  }
  function injectR14Style(){
    if($('oskar-r14-style'))return;
    var st=document.createElement('style'); st.id='oskar-r14-style';
    st.textContent='body.oskar-r14-ready .direct-page-card{background:#fff;border:1px solid #dfe9e9;border-radius:28px;padding:14px;box-shadow:0 12px 28px rgba(47,133,132,.10);margin:0 0 18px}body.oskar-r14-ready .direct-page-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}body.oskar-r14-ready .direct-page-head h2{margin:0;font-size:24px;color:#263f4a;font-weight:950}body.oskar-r14-ready .direct-paper{background:#fff;border:2px solid #111;border-radius:22px;padding:14px;max-height:none;overflow:visible}body.oskar-r14-ready .direct-paper-head.simple{display:flex;justify-content:center;align-items:center;text-align:center;margin-bottom:10px;border-bottom:2px solid #111;padding-bottom:8px}body.oskar-r14-ready .direct-paper-logo{font-weight:950;font-size:30px;line-height:1.15;color:#111}body.oskar-r14-ready .direct-paper-logo small{display:block;font-size:13px;color:#333;margin-top:4px}body.oskar-r14-ready .direct-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:10px 0}body.oskar-r14-ready .direct-meta .field,body.oskar-r14-ready .direct-pay-grid .field{margin:0;min-width:0}body.oskar-r14-ready .direct-meta input,body.oskar-r14-ready .direct-pay-grid input,body.oskar-r14-ready .direct-pay-grid select{height:48px;border:1px solid #cfdada;border-radius:14px;padding:0 12px;font-weight:850;width:100%;box-sizing:border-box;background:#fff}body.oskar-r14-ready .direct-table-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;margin-top:8px}body.oskar-r14-ready .direct-table{width:100%;min-width:720px;border-collapse:collapse;border:2px solid #111;background:#fff;color:#111}body.oskar-r14-ready .direct-table th,body.oskar-r14-ready .direct-table td{border:2px solid #111;padding:4px;text-align:center}body.oskar-r14-ready .direct-table th{font-weight:950;font-size:16px;background:#fff;color:#111}body.oskar-r14-ready .direct-table input{width:100%;border:0;outline:0;height:34px;text-align:center;font-weight:850;background:transparent;color:#111;box-sizing:border-box}body.oskar-r14-ready .direct-table input[data-field="name"]{text-align:right;padding-right:8px}body.oskar-r14-ready .direct-pay-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px;align-items:end}body.oskar-r14-ready .direct-total-line{font-size:20px;font-weight:950;color:#2f8584;min-height:48px;display:flex;align-items:center;padding:0 10px;border:1px solid #dfe9e9;border-radius:14px;background:#f6fbfb}body.oskar-r14-ready .add-direct-row{margin:10px 0 0}.sync-pending-badge{animation:none!important;transform:none!important}@media(max-width:760px){body.oskar-r14-ready .direct-page-card{padding:10px;border-radius:22px}body.oskar-r14-ready .direct-paper{padding:10px;border-radius:18px}body.oskar-r14-ready .direct-paper-logo{font-size:24px}body.oskar-r14-ready .direct-meta,body.oskar-r14-ready .direct-pay-grid{grid-template-columns:repeat(2,minmax(0,1fr))}body.oskar-r14-ready .direct-pay-grid .full{grid-column:1/-1}body.oskar-r14-ready .direct-table{min-width:670px}body.oskar-r14-ready .direct-table th{font-size:14px}}@media(max-width:390px){body.oskar-r14-ready .direct-meta,body.oskar-r14-ready .direct-pay-grid{grid-template-columns:1fr}}';
    document.head.appendChild(st);
  }
  function directRowHTML(i){
    return '<tr data-direct-row="1"><td class="row-no">'+i+'</td><td><input data-field="name" placeholder="اسم الصنف"></td><td><input data-field="qty" type="number" step="0.01" value="1" oninput="calcDirectInvoice()"></td><td><input data-field="price" type="number" step="0.01" value="0" oninput="calcDirectInvoice()"></td><td><input data-field="line" readonly></td><td><button type="button" class="btn small danger" onclick="removeDirectInvoiceRow(this)">×</button></td></tr>';
  }
  function updateDirectRowNumbers(){qsa('#directRows tr').forEach(function(tr,i){var c=tr.querySelector('.row-no'); if(c)c.textContent=i+1})}
  window.addDirectInvoiceRow=function(){var body=$('directRows'); if(!body)return; body.insertAdjacentHTML('beforeend',directRowHTML(body.children.length+1)); updateDirectRowNumbers(); calcDirectInvoice(); var last=body.lastElementChild; if(last){var inp=last.querySelector('[data-field="name"]'); if(inp)inp.focus();}}
  window.removeDirectInvoiceRow=function(btn){var body=$('directRows'); if(!body)return; if(body.children.length<=1){toast('يجب بقاء صنف واحد على الأقل'); return} var tr=btn&&btn.closest&&btn.closest('tr'); if(tr)tr.remove(); updateDirectRowNumbers(); calcDirectInvoice();}
  window.calcDirectInvoice=function(){
    var total=0;
    qsa('#directRows tr').forEach(function(tr){var q=num(qs('[data-field="qty"]',tr)&&qs('[data-field="qty"]',tr).value), p=num(qs('[data-field="price"]',tr)&&qs('[data-field="price"]',tr).value), l=q*p; var line=qs('[data-field="line"]',tr); if(line)line.value=l?l.toFixed(2):''; total+=l});
    var f=$('directInvoiceForm'), paid=num(f&&f.paid&&f.paid.value); if($('directTotal'))$('directTotal').textContent=money(total); if($('directDue'))$('directDue').textContent=money(Math.max(0,total-paid));
  }
  window.openDirectInvoice=function(){
    injectR14Style(); document.body.classList.add('oskar-r14-ready'); document.body.classList.remove('oskar-direct-modal-open');
    var main=$('mainCard'); if(!main){toast('لا يمكن فتح الفاتورة في هذه الصفحة'); return}
    var no='DIR-'+Date.now().toString().slice(-7);
    main.dataset.r14View='direct-invoice-page';
    main.innerHTML='<div class="direct-page-card"><div class="direct-page-head"><button class="btn ghost" type="button" onclick="backFromDirectInvoiceR14()">رجوع</button><h2>فاوترة مباشر</h2></div><form id="directInvoiceForm" class="direct-invoice-form"><div class="direct-paper"><div class="direct-paper-head simple"><div class="direct-paper-logo">فاتورة مباشرة<small>إدخال أصناف يدويًا بدون مخزون</small></div></div><div class="direct-meta"><div class="field"><label>السيد / اسم العميل</label><input name="customerName" placeholder="اسم العميل"></div><div class="field"><label>رقم الجوال</label><input name="customerPhone" inputmode="tel" placeholder="رقم الجوال"></div><div class="field"><label>التاريخ</label><input name="date" type="date" value="'+today()+'"></div><div class="field"><label>رقم الفاتورة</label><input name="invoiceNo" value="'+esc(no)+'"></div></div><div class="direct-table-wrap"><table class="direct-table"><thead><tr><th style="width:42px">م</th><th>الصنف</th><th style="width:105px">العدد</th><th style="width:115px">السعر</th><th style="width:125px">المبلغ</th><th style="width:58px">حذف</th></tr></thead><tbody id="directRows">'+directRowHTML(1)+'</tbody></table></div><button type="button" class="btn ghost add-direct-row" onclick="addDirectInvoiceRow()">+ إضافة صنف</button><div class="direct-pay-grid"><div class="field"><label>الإجمالي</label><div id="directTotal" class="direct-total-line">0.00</div></div><div class="field"><label>دفعة</label><input name="paid" type="number" step="0.01" value="0" oninput="calcDirectInvoice()"></div><div class="field"><label>الباقي</label><div id="directDue" class="direct-total-line">0.00</div></div><div class="field"><label>طريقة الدفع</label><select name="paymentMethod"><option>نقدي</option><option>تطبيق فوري</option><option>تحويل بنكي</option><option>تطبيق لاحق</option><option>دين</option></select></div><div class="field"><label>الحساب الذي دخلت عليه الدفعة</label><select name="accountId">'+accountOptions('')+'</select></div><div class="field"><label>ملاحظة</label><input name="note"></div></div></div><div class="tools" style="justify-content:center;margin-top:12px"><button type="button" class="btn purple" onclick="saveDirectInvoice()">حفظ الفاتورة</button><button type="button" class="btn success" onclick="saveDirectInvoice(true)">حفظ وطباعة</button></div></form></div>';
    setTimeout(function(){var first=qs('#directInvoiceForm [name="customerName"]'); if(first)first.focus()},80);
  };
  window.backFromDirectInvoiceR14=function(){try{if(typeof window.renderPage==='function')window.renderPage(); else location.reload()}catch(e){location.reload()}}
  window.saveDirectInvoice=function(printAfter){
    var f=$('directInvoiceForm'); if(!f)return; var items=[], total=0, invalid=false;
    qsa('#directRows tr').forEach(function(tr,idx){
      if(invalid)return;
      var name=txt(qs('[data-field="name"]',tr)&&qs('[data-field="name"]',tr).value), qty=num(qs('[data-field="qty"]',tr)&&qs('[data-field="qty"]',tr).value), price=num(qs('[data-field="price"]',tr)&&qs('[data-field="price"]',tr).value);
      if(!name&&!qty&&!price)return;
      if(!name){toast('اكتب اسم الصنف في السطر '+(idx+1)); invalid=true; return;}
      if(qty<=0){toast('أدخل العدد في السطر '+(idx+1)); invalid=true; return;}
      var line=qty*price; total+=line;
      items.push({name:name,productId:'',manual:true,nonInventory:true,unit:'يدوي',unitName:'يدوي',qty:qty,factor:0,stockQty:0,unitPrice:price,purchasePrice:price,cost:line,profit:0,total:line});
    });
    if(invalid)return;
    if(!items.length){toast('أدخل صنف واحد على الأقل'); return}
    var paid=num(f.paid&&f.paid.value), due=Math.max(0,total-paid), accountId=txt(f.accountId&&f.accountId.value), method=txt(f.paymentMethod&&f.paymentMethod.value)||'نقدي';
    if(paid>0&&!accountId){toast('اختر الحساب الذي دخلت عليه الدفعة'); return}
    if(due>0&&(!txt(f.customerName.value)||!txt(f.customerPhone.value))){toast('الفاتورة التي عليها باقي تحتاج اسم العميل ورقم الجوال'); return}
    var customer=ensureCustomer(f.customerName.value,f.customerPhone.value,'');
    var rec={id:uid('sale'),date:f.date.value||today(),invoiceNo:txt(f.invoiceNo.value)||('DIR-'+Date.now()),customerId:customer&&customer.id||'',customerName:txt(f.customerName.value)||(method==='نقدي'?'زبون نقدي':'زبون تطبيق'),customerPhone:txt(f.customerPhone.value),items:items,total:total,paid:paid,due:due,paymentMethod:method,paymentStatus:paymentStatus(total,paid,method),accountId:accountId,note:txt(f.note.value),kind:'فاتورة مباشرة',saleType:'direct_manual_invoice',isDirectInvoice:true,isNonInventory:true,manualInvoice:true,noStock:true,noProfit:true,cost:total,profit:0,grossProfit:0,createdAt:now(),createdBy:currentUserName()};
    arr('sales').unshift(rec);
    if(paid>0)accountMovement(accountId,'in',paid,'فاتورة مباشرة '+rec.invoiceNo,rec.note,'directSale:'+rec.id);
    if(due>0)createDebtForInvoice(rec,due);
    writeSmart(); toast('تم حفظ الفاتورة المباشرة');
    if(printAfter){setTimeout(function(){try{if(typeof window.printInvoice==='function')window.printInvoice(rec); else window.print()}catch(e){window.print()}},220)}
    setTimeout(function(){try{if(typeof window.renderPage==='function')window.renderPage()}catch(e){}},260);
  };
  function isHomePage(){var p=pageName(); return p==='لوحة-المتابعة.html'||p==='index.html'||p===''||p==='/' }
  function cleanHomeDirectReport(){
    if(isHomePage())qsa('#r13DirectReportCard').forEach(function(x){x.remove()});
    var t=qs('#r13DirectToolbar .muted'); if(t)t.textContent='إدخال أصناف يدويًا بدون خصم من المخزون.';
  }
  function installSyncFix(){
    if(window.syncNow&&typeof window.syncNow==='function'&&!window.syncNow.__oskarR14Wrapped){
      var old=window.syncNow;
      window.syncNow=async function(show){var b=findSyncButton(); try{if(b)b.classList.add('syncing'); if(!navigator.onLine){updateSyncBadgeR14(); return old.apply(this,arguments)} var r=await old.apply(this,arguments); setPending(0); return r;}catch(e){console.warn(e); if(navigator.onLine)setPending(0); else updateSyncBadgeR14();}finally{if(b)b.classList.remove('syncing'); updateSyncBadgeR14();}};
      window.syncNow.__oskarR14Wrapped=true; try{syncNow=window.syncNow}catch(e){}
    }
    if(navigator.onLine&&pendingCount()>0){try{if(typeof window.syncNow==='function')setTimeout(function(){window.syncNow(false)},350)}catch(e){} setTimeout(function(){if(navigator.onLine)setPending(0)},1800)}
  }
  function install(){document.body&&document.body.classList.add('oskar-r14-ready'); injectR14Style(); installSyncFix(); cleanHomeDirectReport(); updateSyncBadgeR14();}
  var mo;
  function observe(){if(mo)return; try{mo=new MutationObserver(function(){cleanHomeDirectReport(); updateSyncBadgeR14()}); mo.observe(document.body,{childList:true,subtree:true})}catch(e){}}
  [0,80,240,700,1400,2600,5200].forEach(function(ms){setTimeout(install,ms)});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(function(){install();observe()},60)}); else setTimeout(function(){install();observe()},60);
  window.addEventListener('online',function(){setTimeout(function(){installSyncFix(); if(typeof window.syncNow==='function')window.syncNow(false); else setPending(0)},300)});
  window.addEventListener('offline',updateSyncBadgeR14);
})();

/* Oskar R15: hard fix for invoices page freeze - 2026-05-11 */
(function(){
  'use strict';
  if(window.__OSKAR_R15_INVOICES_FREEZE_FIX__) return;
  window.__OSKAR_R15_INVOICES_FREEZE_FIX__ = true;
  var APP_KEY='supermarket_pos_ar_v1';
  function $(id){return document.getElementById(id)}
  function txt(v){return String(v==null?'':v).trim()}
  function esc(v){return txt(v).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]})}
  function num(v){return Number(v||0)||0}
  function pageName(){try{return decodeURIComponent((location.pathname.split('/').pop()||'index.html').split('?')[0])}catch(e){return ''}}
  function isInvoicesPage(){return pageName()==='الفواتير.html' || (window.CFG && window.CFG.kind==='invoices')}
  function db(){try{if(window.DB&&typeof window.DB==='object')return window.DB}catch(e){} try{window.DB=JSON.parse(localStorage.getItem(APP_KEY)||'{}')||{}}catch(e){window.DB={}} return window.DB}
  function arr(name){var d=db(); if(!Array.isArray(d[name])) d[name]=[]; return d[name]}
  function active(rows){return (rows||[]).filter(function(x){return x&&!x.deletedAt&&!x._deleted})}
  function money(v){try{if(typeof window.money2==='function')return window.money2(v)}catch(e){} try{if(typeof window.money==='function')return window.money(v)}catch(e){} return num(v).toFixed(2)}
  function dateVal(r){return String((r&&r.date)||(r&&r.createdAt)||'')}
  function label(c){var map={date:'التاريخ',invoiceNo:'رقم الفاتورة',customerName:'العميل',paymentMethod:'الدفع',paymentStatus:'الحالة',total:'الإجمالي',paid:'المدفوع',due:'المتبقي'}; try{if(typeof window.labelFor==='function')return window.labelFor(c)}catch(e){} return map[c]||c}
  function val(r,c){
    var v=(r||{})[c];
    if(['total','paid','due'].indexOf(c)>-1) return money(v);
    if(c==='paymentStatus'){
      var due=Math.max(0,num(r.due!=null?r.due:num(r.total)-num(r.paid)));
      var st=v||(due<=0?'مدفوع':(num(r.paid)>0?'جزئي':'مستحق'));
      var cls=due<=0?'ok':(num(r.paid)>0?'info':'bad');
      return '<span class="status '+cls+'">'+esc(st)+'</span>';
    }
    return esc(v||'');
  }
  function periodRange(p){
    var now=new Date(), from='', to='';
    function iso(d){return d.toISOString().slice(0,10)}
    if(p==='today'){from=to=iso(now)}
    else if(p==='week'){var d=new Date(); d.setDate(d.getDate()-7); from=iso(d); to=iso(now)}
    else if(p==='month'){from=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01'; to=iso(now)}
    else if(p==='year'){from=now.getFullYear()+'-01-01'; to=iso(now)}
    else if(p==='custom'){from=txt($('r15DateFrom')&&$('r15DateFrom').value); to=txt($('r15DateTo')&&$('r15DateTo').value)}
    return {from:from,to:to};
  }
  function invoiceRows(){
    var q=txt(window.__r15InvoiceSearch || ($('r15InvoiceSearch')&&$('r15InvoiceSearch').value)).toLowerCase();
    var p=window.__r15InvoicePeriod || ($('r15InvoicePeriod')&&$('r15InvoicePeriod').value) || 'all';
    var range=periodRange(p);
    return active(arr('sales')).filter(function(r){
      if(q){var s=[r.invoiceNo,r.customerName,r.customerPhone,r.paymentMethod,r.paymentStatus,r.total,r.paid,r.due].join(' ').toLowerCase(); if(s.indexOf(q)<0)return false;}
      var d=dateVal(r).slice(0,10); if(range.from&&d<range.from)return false; if(range.to&&d>range.to)return false; return true;
    }).sort(function(a,b){return String(dateVal(b)||b.createdAt||'').localeCompare(String(dateVal(a)||a.createdAt||''));});
  }
  function actionBtn(cls,title,act,id,txt){return '<button type="button" class="btn small '+cls+'" data-r15-invoice-action="'+act+'" data-id="'+esc(id)+'" title="'+esc(title)+'">'+txt+'</button>'}
  function rowActions(id,r){
    var due=Math.max(0,num(r&&r.due!=null?r.due:num(r&&r.total)-num(r&&r.paid)));
    var h='<div class="invoice-tools r15-invoice-tools">'+actionBtn('ghost','عرض','show',id,'عرض')+actionBtn('ghost','تعديل','edit',id,'تعديل')+actionBtn('success','طباعة / PDF','print',id,'طباعة')+actionBtn('ghost','صورة','image',id,'صورة')+actionBtn('danger','حذف','delete',id,'حذف');
    if(due>0) h+=actionBtn('ghost invoice-pay-btn','إضافة دفعة','payment',id,'+ دفعة');
    return h+'</div>';
  }
  function renderInvoicesSafe(){
    if(!isInvoicesPage()) return false;
    try{if(typeof window.ensureModernData==='function')window.ensureModernData()}catch(e){}
    try{if(typeof window.renderCommon==='function')window.renderCommon()}catch(e){}
    try{if(typeof window.updateSyncState==='function')window.updateSyncState()}catch(e){}
    var main=$('mainCard'); if(!main) return false;
    document.body.classList.add('oskar-r15-invoices-ready');
    var rows=invoiceRows(), allCount=rows.length, limit=window.__r15InvoiceLimit||80, shown=rows.slice(0,limit);
    var cols=['date','invoiceNo','customerName','paymentMethod','paymentStatus','total','paid','due'];
    var total=rows.reduce(function(s,r){return s+num(r.total)},0), paid=rows.reduce(function(s,r){return s+num(r.paid)},0), due=rows.reduce(function(s,r){return s+num(r.due!=null?r.due:num(r.total)-num(r.paid))},0);
    var period=window.__r15InvoicePeriod||'all', search=window.__r15InvoiceSearch||'';
    var html='<div id="r13DirectReportCard" style="display:none!important"></div>';
    html+='<div id="r13DirectToolbar" class="r13-direct-toolbar r15-invoice-toolbar"><button type="button" class="btn purple" onclick="window.openDirectInvoice&&window.openDirectInvoice()">+ فاوترة مباشر</button><span class="muted">إدخال أصناف يدويًا بدون خصم من المخزون.</span></div>';
    html+='<div class="kpis r15-invoice-kpis"><div class="kpi"><span>عدد الفواتير</span><strong>'+allCount+'</strong></div><div class="kpi"><span>الإجمالي</span><strong>'+money(total)+'</strong></div><div class="kpi"><span>المدفوع</span><strong>'+money(paid)+'</strong></div><div class="kpi"><span>المتبقي</span><strong>'+money(due)+'</strong></div></div>';
    html+='<div class="table-toolbar r15-invoice-filter"><div class="tools"><input id="r15InvoiceSearch" class="search" placeholder="بحث في الفواتير..." value="'+esc(search)+'"><select id="r15InvoicePeriod"><option value="all">كل السجل</option><option value="today">يومي</option><option value="week">أسبوعي</option><option value="month">شهري</option><option value="year">سنوي</option><option value="custom">من تاريخ إلى تاريخ</option></select><input id="r15DateFrom" type="date"><input id="r15DateTo" type="date"></div><div class="tools"><button type="button" class="btn ghost small" onclick="window.exportCSV&&window.exportCSV()">CSV</button><button type="button" class="btn ghost small" onclick="window.exportExcel&&window.exportExcel()">Excel</button><button type="button" class="btn ghost small" onclick="window.print()">طباعة/PDF</button></div></div>';
    html+='<div class="table-wrap r15-invoice-table-wrap"><table class="data-table"><thead><tr>'+cols.map(function(c){return '<th>'+label(c)+'</th>'}).join('')+'<th>إجراء</th></tr></thead><tbody>';
    if(!shown.length){html+='<tr><td colspan="'+(cols.length+1)+'" style="text-align:center;color:#6b7280">لا توجد فواتير</td></tr>'}
    shown.forEach(function(r){html+='<tr>'+cols.map(function(c){return '<td>'+val(r,c)+'</td>'}).join('')+'<td>'+rowActions(r.id,r)+'</td></tr>'});
    html+='</tbody><tfoot><tr>'+cols.map(function(c){return '<td>'+(['total','paid','due'].indexOf(c)>-1?money(rows.reduce(function(s,r){return s+num(c==='due'?(r.due!=null?r.due:num(r.total)-num(r.paid)):r[c])},0)):'')+'</td>'}).join('')+'<td>المجموع</td></tr></tfoot></table></div>';
    html+='<div class="muted" style="margin-top:8px">عرض '+shown.length+' من '+allCount+' فاتورة</div>';
    if(shown.length<allCount) html+='<div class="tools" style="justify-content:center;margin-top:12px"><button type="button" class="btn ghost" onclick="window.__r15InvoiceLimit=(window.__r15InvoiceLimit||80)+80;window.renderInvoicesSafeR15()">تحميل المزيد</button></div>';
    main.innerHTML=html;
    var ps=$('r15InvoicePeriod'); if(ps)ps.value=period;
    var s=$('r15InvoiceSearch'); if(s){s.oninput=function(){window.__r15InvoiceSearch=this.value; clearTimeout(window.__r15InvoiceTimer); window.__r15InvoiceTimer=setTimeout(renderInvoicesSafe,120)}}
    if(ps){ps.onchange=function(){window.__r15InvoicePeriod=this.value; window.__r15InvoiceLimit=80; renderInvoicesSafe()}}
    var df=$('r15DateFrom'), dt=$('r15DateTo'); if(df)df.onchange=renderInvoicesSafe; if(dt)dt.onchange=renderInvoicesSafe;
    return true;
  }
  window.renderInvoicesSafeR15=renderInvoicesSafe;
  var safeInvoices=function(){return renderInvoicesSafe()}; safeInvoices.__r13Wrapped=true; safeInvoices.__oskarFocusWrapped=true; safeInvoices.__oskarR15=true;
  window.renderInvoices=safeInvoices; try{renderInvoices=safeInvoices}catch(e){}
  var oldRenderPage=window.renderPage;
  var safePage=function(){ if(isInvoicesPage()) return renderInvoicesSafe(); return oldRenderPage&&oldRenderPage.apply(this,arguments); };
  safePage.__r13Wrapped=true; safePage.__oskarFocusWrapped=true; safePage.__oskarR15=true;
  window.renderPage=safePage; try{renderPage=safePage}catch(e){}
  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest&&e.target.closest('[data-r15-invoice-action]'); if(!b)return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    var id=b.getAttribute('data-id'), a=b.getAttribute('data-r15-invoice-action'), rec=arr('sales').find(function(x){return String(x.id)===String(id)});
    try{
      if(a==='show'&&typeof window.showInvoice==='function')return window.showInvoice(id);
      if(a==='edit'&&typeof window.editInvoice==='function')return window.editInvoice(id);
      if(a==='print'&&typeof window.printInvoice==='function')return window.printInvoice(rec);
      if(a==='image'&&typeof window.downloadInvoiceImage==='function')return window.downloadInvoiceImage(id);
      if(a==='delete'&&typeof window.deleteInvoice==='function')return window.deleteInvoice(id);
      if(a==='payment'&&typeof window.openInvoicePayment==='function')return window.openInvoicePayment(id);
    }catch(err){console.warn('invoice action failed',err)}
  },true);
  function boot(){if(isInvoicesPage())setTimeout(renderInvoicesSafe,30)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot); else boot();
})();

/* ===== R16 freeze fixes: restaurant/invoices + fast scanner + product mobile link ===== */
(function(){
  'use strict';
  if(window.__OSKAR_R16_FREEZE_SCANNER_PATCH__) return;
  window.__OSKAR_R16_FREEZE_SCANNER_PATCH__ = true;
  var APP_KEY='supermarket_pos_ar_v1';
  var QUEUE_KEY='mobileBarcodeQueue';
  function $(id){return document.getElementById(id)}
  function fileName(){try{return decodeURIComponent(location.pathname.split('/').pop()||'')}catch(e){return location.pathname.split('/').pop()||''}}
  function isRestaurant(){return /^مطعم-/.test(fileName()) || typeof window.REST_PAGE_KIND !== 'undefined'}
  function isInvoices(){return fileName()==='الفواتير.html' || (window.CFG && window.CFG.kind==='invoices')}
  function isProductForm(){return fileName()==='إضافة-صنف.html' || (window.CFG && (window.CFG.kind==='product_form' || window.CFG.collection==='products' && /إضافة-صنف/.test(window.CFG.filename||'')))}
  function getDB(){try{if(window.DB && typeof window.DB==='object')return window.DB; window.DB=JSON.parse(localStorage.getItem(APP_KEY)||'{}')||{}; return window.DB;}catch(e){window.DB={};return window.DB}}
  function saveDB(d){try{window.DB=d||getDB(); localStorage.setItem(APP_KEY,JSON.stringify(window.DB));}catch(e){}}
  function arr(k){var d=getDB(); if(!Array.isArray(d[k]))d[k]=[]; return d[k]}
  function active(rows){return (rows||[]).filter(function(x){return !x._deleted && x.active!=='محذوف'})}
  function esc(v){return String(v==null?'':v).replace(/[&<>'"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]})}
  function num(v){return Number(v||0)||0}
  function money(v){try{return (window.money2||window.money)(v)}catch(e){var cur=(getDB().settings||{}).currency||'₪';return num(v).toFixed(2)+' '+cur}}
  function toast(msg){try{if(window.toast)return window.toast(msg)}catch(e){} try{console.log(msg)}catch(e){}}
  function uid(p){try{if(window.uid)return window.uid(p)}catch(e){} return (p||'id')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
  function nowISO(){return new Date().toISOString()}
  function today(){try{if(window.todayISO)return window.todayISO()}catch(e){} return new Date().toISOString().slice(0,10)}
  function companyKey(){var d=getDB();d.settings=d.settings||{};return d.settings.companyKey||'momen-5a28a'}
  function persist(){try{if(window.persist)return window.persist()}catch(e){} saveDB(getDB())}

  function addStyle(){
    if($('oskar-r16-freeze-style')) return;
    var st=document.createElement('style'); st.id='oskar-r16-freeze-style';
    st.textContent = `
html,body{touch-action:pan-x pan-y!important}
body.oskar-r16-restaurant,body.oskar-r16-restaurant .content,body.oskar-r16-restaurant .layout{pointer-events:auto!important;overscroll-behavior:auto!important}
body.oskar-r16-restaurant{overflow-y:auto!important;position:static!important;height:auto!important;min-height:100vh!important}
body.oskar-r16-restaurant #modalBack:not(.is-open){display:none!important;pointer-events:none!important}
body.oskar-r16-restaurant .side.open{pointer-events:auto!important}
body.oskar-r16-restaurant .table-wrap,body.oskar-r16-restaurant .data-table-wrap{overflow:auto!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-x pan-y!important}
body.oskar-r16-invoices #mainCard{min-height:220px!important;pointer-events:auto!important}
body.oskar-r16-invoices .r16-invoice-table-wrap{overflow:auto!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-x pan-y!important}
.r16-invoice-card{border:1px solid var(--line,#d9e8e1);background:#fff;border-radius:22px;padding:14px;margin-bottom:10px;box-shadow:0 10px 25px rgba(47,133,132,.08)}
.r16-invoice-card b{font-size:17px;color:#143b31}.r16-invoice-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.r16-direct-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:12px}.r16-empty{padding:28px;text-align:center;color:#64748b;font-weight:900}.r16-error{padding:18px;border:1px solid #fecaca;background:#fff1f2;color:#991b1b;border-radius:18px;font-weight:900}
.scanner{z-index:9999!important;background:#020617!important;padding:12px!important}.scanner .scan-box{width:min(98vw,760px)!important;height:min(72vh,620px)!important;border:3px solid #409898!important;border-radius:24px!important;box-shadow:0 0 0 999px rgba(0,0,0,.26),0 0 34px rgba(64,152,152,.55)!important}.scanner #reader video,.scanner #reader{width:100%!important;height:100%!important;object-fit:cover!important}.scanner .scan-line{animation:scan .58s ease-in-out infinite!important;background:#40d5d5!important;box-shadow:0 0 20px #40d5d5!important}.oskar-remote-modal-back{position:fixed;inset:0;background:rgba(2,6,23,.68);z-index:10000;display:none;align-items:center;justify-content:center;padding:14px}.oskar-remote-modal{width:min(430px,94vw);background:#fff;border-radius:26px;padding:18px;box-shadow:0 30px 80px rgba(0,0,0,.32);text-align:center;color:#10251f}.oskar-remote-qr{width:230px;height:230px;object-fit:contain;border:1px solid #d9e8e1;border-radius:18px;background:#fff}.oskar-remote-link{direction:ltr;text-align:left;word-break:break-all;background:#f4faf7;border:1px solid #d9e8e1;border-radius:14px;padding:10px;margin:10px 0;font-size:12px}.oskar-remote-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.oskar-scan-pulse{position:fixed;left:50%;bottom:94px;transform:translateX(-50%) translateY(12px);opacity:0;background:#10251f;color:#fff;border-radius:999px;padding:10px 14px;font-weight:950;z-index:10001;transition:.15s ease;box-shadow:0 12px 28px rgba(0,0,0,.22)}.oskar-scan-pulse.show{opacity:1;transform:translateX(-50%) translateY(0)}
.oskar-product-mobile-scan{min-height:42px!important}
`;
    document.head.appendChild(st);
  }

  function unfreezeRestaurant(){
    if(!isRestaurant()) return;
    document.body.classList.add('oskar-r16-restaurant');
    document.documentElement.style.overflowY='auto'; document.body.style.overflowY='auto';
    document.body.classList.remove('oskar-direct-modal-open');
    var mb=$('modalBack'); if(mb && mb.style.display!=='flex'){mb.style.display='none';mb.classList.remove('is-open')}
    var side=$('side'); if(side){side.addEventListener('click',function(e){e.stopPropagation()},false)}
  }
  function patchRestaurantModal(){
    if(!isRestaurant() || window.__OSKAR_R16_REST_MODAL__) return; window.__OSKAR_R16_REST_MODAL__=true;
    var oldOpen=window.openModal, oldClose=window.closeModal;
    window.openModal=function(){var r=oldOpen?oldOpen.apply(this,arguments):undefined; var m=$('modalBack'); if(m){m.classList.add('is-open');m.style.display='flex'} document.body.style.overflowY='auto'; return r};
    window.closeModal=function(){var r=oldClose?oldClose.apply(this,arguments):undefined; var m=$('modalBack'); if(m){m.classList.remove('is-open');m.style.display='none'} document.body.classList.remove('oskar-direct-modal-open'); document.body.style.overflowY='auto'; return r};
    try{openModal=window.openModal; closeModal=window.closeModal}catch(e){}
  }
  function patchRestaurantRender(){
    if(!isRestaurant() || window.__OSKAR_R16_REST_RENDER__) return; window.__OSKAR_R16_REST_RENDER__=true;
    var oldRender=window.render;
    window.render=function(){
      unfreezeRestaurant();
      try{
        if(typeof window.refreshDB==='function') window.refreshDB();
        if(typeof window.renderShell==='function') window.renderShell();
        var kind=window.PAGE_KIND||window.REST_PAGE_KIND||'tables';
        var map={tables:window.renderTables,kitchen:window.renderKitchen,menu:window.renderMenu,cashier:window.renderCashier,recipes:window.renderRecipes,inventory:window.renderInventory,reservations:window.renderReservations,analytics:window.renderAnalytics};
        var fn=map[kind] || oldRender;
        if(typeof fn==='function') return fn.apply(this,arguments);
        var main=$('main'); if(main) main.innerHTML='<section class="card"><b>جاهز</b><div class="muted">تم تحميل قسم المطعم.</div></section>';
      }catch(e){
        console.error('R16 restaurant render error',e);
        var main=$('main'); if(main) main.innerHTML='<section class="card r16-error">حدث خطأ في تحميل قسم المطعم. تم منع التجمّد، حدّث الصفحة أو افتح قسمًا آخر.</section>';
      }finally{setTimeout(unfreezeRestaurant,20)}
    };
    try{render=window.render}catch(e){}
  }
  function installRestaurant(){
    if(!isRestaurant()) return;
    addStyle(); unfreezeRestaurant(); patchRestaurantModal(); patchRestaurantRender();
    setTimeout(function(){try{if(!$('main') || !$('main').innerHTML.trim()) window.render&&window.render()}catch(e){} unfreezeRestaurant();},120);
    setTimeout(unfreezeRestaurant,600);
  }

  function invoiceRows(){return active(arr('sales')).filter(function(s){return s && !s._deleted})}
  function invoiceStatusClass(s){s=String(s||''); if(/مدفوع|paid/i.test(s))return 'ok'; if(/ملغي|cancel/i.test(s))return 'bad'; return 'info'}
  function invoiceActionsHTML(id){return '<div class="r16-invoice-actions">'
    +'<button type="button" class="btn small ghost" onclick="window.showInvoice&&showInvoice(\''+esc(id)+'\')">عرض</button>'
    +'<button type="button" class="btn small success" onclick="var r=(window.collection?collection(\'sales\'):JSON.parse(localStorage.getItem(\''+APP_KEY+'\')||\'{}\').sales||[]).find(function(x){return String(x.id)===\''+esc(id)+'\'}); window.printInvoice&&printInvoice(r)">طباعة/PDF</button>'
    +'<button type="button" class="btn small ghost" onclick="window.openInvoicePaymentR13&&openInvoicePaymentR13(\''+esc(id)+'\')">+ دفعة</button>'
    +'<button type="button" class="btn small danger" onclick="window.deleteInvoice?deleteInvoice(\''+esc(id)+'\'):window.deleteRec&&deleteRec(\''+esc(id)+'\')">حذف</button>'
    +'</div>'}
  function filterInvoices(rows){
    var q=String(window.__r16InvSearch||'').trim().toLowerCase();
    var period=window.__r16InvPeriod||'all'; var df=$('r16DateFrom')&&$('r16DateFrom').value, dt=$('r16DateTo')&&$('r16DateTo').value;
    var now=new Date(), todayStr=now.toISOString().slice(0,10);
    function dateOf(r){return String(r.date||r.createdAt||'').slice(0,10)}
    return rows.filter(function(r){
      var d=dateOf(r);
      if(q && String([r.invoiceNo,r.customerName,r.customerPhone,r.paymentMethod,r.paymentStatus,r.total].join(' ')).toLowerCase().indexOf(q)<0) return false;
      if(period==='today' && d!==todayStr) return false;
      if(period==='month' && d.slice(0,7)!==todayStr.slice(0,7)) return false;
      if(period==='year' && d.slice(0,4)!==todayStr.slice(0,4)) return false;
      if(period==='week'){var x=new Date(d||0); var diff=(now-x)/86400000; if(diff<0 || diff>7) return false;}
      if(period==='custom'){if(df && d<df)return false; if(dt && d>dt)return false;}
      return true;
    });
  }
  function renderInvoicesR16(){
    if(!isInvoices()) return false;
    if(window.__r16InvoiceRendering) return true;
    window.__r16InvoiceRendering=true;
    document.body.classList.add('oskar-r16-invoices'); addStyle();
    try{if(typeof window.renderCommon==='function') window.renderCommon(); if(typeof window.updateSyncState==='function') window.updateSyncState();}catch(e){}
    var main=$('mainCard'); if(!main){window.__r16InvoiceRendering=false;return true;}
    try{
      var rows=invoiceRows().sort(function(a,b){return String(b.createdAt||b.date||'').localeCompare(String(a.createdAt||a.date||''))});
      var allCount=rows.length;
      var filtered=filterInvoices(rows);
      var limit=window.__r16InvoiceLimit||60;
      var shown=filtered.slice(0,limit);
      var total=filtered.reduce(function(s,r){return s+num(r.total)},0), paid=filtered.reduce(function(s,r){return s+num(r.paid)},0), due=filtered.reduce(function(s,r){return s+num(r.due)},0);
      var html='<div class="r16-direct-toolbar"><button type="button" class="btn purple" onclick="window.openDirectInvoice&&openDirectInvoice()">+ فاوترة مباشر</button><span class="muted">الفواتير تُعرض بطريقة خفيفة لمنع التجمّد.</span></div>';
      html+='<div class="kpis r16-invoice-kpis"><div class="kpi"><span>عدد الفواتير</span><strong>'+filtered.length+'</strong></div><div class="kpi"><span>الإجمالي</span><strong>'+money(total)+'</strong></div><div class="kpi"><span>المدفوع</span><strong>'+money(paid)+'</strong></div><div class="kpi"><span>المتبقي</span><strong>'+money(due)+'</strong></div></div>';
      html+='<div class="table-toolbar"><div class="tools"><input id="r16InvoiceSearch" class="search" placeholder="بحث في الفواتير" value="'+esc(window.__r16InvSearch||'')+'"><select id="r16InvoicePeriod"><option value="all">كل السجل</option><option value="today">اليوم</option><option value="week">آخر أسبوع</option><option value="month">الشهر</option><option value="year">السنة</option><option value="custom">من تاريخ إلى تاريخ</option></select><input id="r16DateFrom" type="date"><input id="r16DateTo" type="date"></div><div class="tools"><button class="btn ghost small" onclick="window.exportCSV&&exportCSV()">CSV</button><button class="btn ghost small" onclick="window.print()">طباعة/PDF</button></div></div>';
      if(!shown.length) html+='<div class="r16-empty">لا توجد فواتير</div>';
      else{
        html+='<div class="mobile-card-list">'+shown.map(function(r){return '<div class="r16-invoice-card"><b>'+esc(r.invoiceNo||r.id||'فاتورة')+'</b><div class="muted">'+esc(r.date||'')+' · '+esc(r.customerName||'زبون')+'</div><div class="tools" style="margin-top:6px"><span class="status '+invoiceStatusClass(r.paymentStatus)+'">'+esc(r.paymentStatus||'-')+'</span><b>'+money(r.total)+'</b><span class="muted">مدفوع: '+money(r.paid)+' / باقي: '+money(r.due)+'</span></div>'+invoiceActionsHTML(r.id)+'</div>'}).join('')+'</div>';
        html+='<div class="r16-invoice-table-wrap table-wrap" style="margin-top:12px"><table class="data-table"><thead><tr><th>التاريخ</th><th>رقم الفاتورة</th><th>العميل</th><th>طريقة الدفع</th><th>الحالة</th><th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th><th>إجراءات</th></tr></thead><tbody>'+shown.map(function(r){return '<tr><td>'+esc(r.date||'')+'</td><td>'+esc(r.invoiceNo||r.id||'')+'</td><td>'+esc(r.customerName||'')+'</td><td>'+esc(r.paymentMethod||'')+'</td><td><span class="status '+invoiceStatusClass(r.paymentStatus)+'">'+esc(r.paymentStatus||'')+'</span></td><td>'+money(r.total)+'</td><td>'+money(r.paid)+'</td><td>'+money(r.due)+'</td><td>'+invoiceActionsHTML(r.id)+'</td></tr>'}).join('')+'</tbody></table></div>';
        if(shown.length<filtered.length) html+='<div class="tools" style="justify-content:center;margin-top:12px"><button class="btn ghost" onclick="window.__r16InvoiceLimit=(window.__r16InvoiceLimit||60)+60;window.renderInvoicesR16()">تحميل المزيد</button></div>';
      }
      html+='<div class="muted" style="margin-top:10px">عرض '+shown.length+' من '+filtered.length+' / إجمالي السجل '+allCount+'</div><div id="invoiceActionPreview"></div>';
      main.innerHTML=html;
      var p=$('r16InvoicePeriod'); if(p)p.value=window.__r16InvPeriod||'all';
      var s=$('r16InvoiceSearch'); if(s)s.oninput=function(){window.__r16InvSearch=this.value; window.__r16InvoiceLimit=60; clearTimeout(window.__r16InvTimer); window.__r16InvTimer=setTimeout(renderInvoicesR16,120)};
      if(p)p.onchange=function(){window.__r16InvPeriod=this.value; window.__r16InvoiceLimit=60; renderInvoicesR16()};
      var dfrom=$('r16DateFrom'), dto=$('r16DateTo'); if(dfrom)dfrom.onchange=renderInvoicesR16; if(dto)dto.onchange=renderInvoicesR16;
      var old=$('r13DirectReportCard'); if(old)old.remove();
    }catch(e){console.error('R16 invoices error',e); main.innerHTML='<div class="r16-error">تم منع تجمّد الفواتير. سبب الخطأ: '+esc(e.message||e)+'</div>';}
    finally{window.__r16InvoiceRendering=false;}
    return true;
  }
  function installInvoices(){
    if(!isInvoices()) return;
    addStyle();
    window.renderInvoicesR16=renderInvoicesR16;
    window.renderInvoices=renderInvoicesR16;
    var safePage=function(){return renderInvoicesR16()}; safePage.__oskarFocusWrapped=true; safePage.__oskarR16=true;
    window.renderPage=safePage; try{renderPage=safePage; renderInvoices=renderInvoicesR16}catch(e){}
    setTimeout(renderInvoicesR16,30); setTimeout(renderInvoicesR16,250);
  }

  var qrInstance=null, qrDone=false;
  function pulse(msg){var el=$('oskarScanPulse'); if(!el){el=document.createElement('div');el.id='oskarScanPulse';el.className='oskar-scan-pulse';document.body.appendChild(el)} el.textContent=msg||'تم الالتقاط';el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(function(){el.classList.remove('show')},900)}
  function stopQR(){try{if(qrInstance&&qrInstance.stop)qrInstance.stop()}catch(e){} try{if(qrInstance&&qrInstance.clear)qrInstance.clear()}catch(e){} qrInstance=null;}
  function installFastScanner(){
    addStyle();
    window.startScanner=function(cb){
      var sc=$('scanner'), reader=$('reader'); if(!sc){var v=prompt('أدخل الباركود يدويًا'); if(v&&cb)cb(v); return;}
      sc.style.display='flex'; if(reader) reader.innerHTML=''; qrDone=false;
      function finish(v){v=String(v||'').trim(); if(!v||qrDone)return; qrDone=true; try{window.playBeep&&playBeep()}catch(e){} stopQR(); sc.style.display='none'; if(cb)cb(v); pulse('تم قراءة الباركود: '+v)}
      if(!window.Html5Qrcode){var val=prompt('أدخل الباركود يدويًا'); if(val)finish(val); else sc.style.display='none'; return;}
      var cfg={fps:50,qrbox:function(w,h){return {width:Math.min(Math.floor(w*.94),680),height:Math.min(Math.floor(h*.62),420)}},aspectRatio:1.777,disableFlip:false,experimentalFeatures:{useBarCodeDetectorIfSupported:true}};
      if(window.Html5QrcodeSupportedFormats){cfg.formatsToSupport=[Html5QrcodeSupportedFormats.EAN_13,Html5QrcodeSupportedFormats.EAN_8,Html5QrcodeSupportedFormats.UPC_A,Html5QrcodeSupportedFormats.UPC_E,Html5QrcodeSupportedFormats.CODE_128,Html5QrcodeSupportedFormats.CODE_39,Html5QrcodeSupportedFormats.CODE_93,Html5QrcodeSupportedFormats.ITF,Html5QrcodeSupportedFormats.CODABAR,Html5QrcodeSupportedFormats.QR_CODE].filter(Boolean)}
      qrInstance=new Html5Qrcode('reader',{verbose:false});
      var startWith=function(camera){return qrInstance.start(camera,cfg,finish,function(){})};
      if(Html5Qrcode.getCameras){
        Html5Qrcode.getCameras().then(function(cams){
          var back=(cams||[]).find(function(c){return /back|rear|environment|خلف/i.test(c.label||'')}) || (cams||[]).slice(-1)[0];
          return startWith(back?{deviceId:{exact:back.id}}:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}});
        }).catch(function(){return startWith({facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}})}).catch(function(){var val=prompt('تعذر فتح الكاميرا، أدخل الباركود يدويًا'); if(val)finish(val); else sc.style.display='none'});
      }else{
        startWith({facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}}).catch(function(){var val=prompt('تعذر فتح الكاميرا، أدخل الباركود يدويًا'); if(val)finish(val); else sc.style.display='none'});
      }
    };
    window.closeScanner=function(){stopQR(); var sc=$('scanner'); if(sc)sc.style.display='none'};
    try{startScanner=window.startScanner; closeScanner=window.closeScanner}catch(e){}
  }

  function mobileCameraURL(){var u=new URL('كاميرا-الكاشير.html',location.href); u.searchParams.set('k',companyKey()); u.searchParams.set('mode',isProductForm()?'product':'cashier'); return u.href}
  function qrURL(){return 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data='+encodeURIComponent(mobileCameraURL())}
  function installRemoteModal(){
    if($('oskarRemoteModalBack')) return;
    var back=document.createElement('div'); back.id='oskarRemoteModalBack'; back.className='oskar-remote-modal-back';
    back.innerHTML='<div class="oskar-remote-modal"><h3>ربط الجوال</h3><p>افتح الرابط من الجوال، ثم امسح الباركود وسيصل هنا تلقائيًا.</p><img id="oskarRemoteQr" class="oskar-remote-qr"><div id="oskarRemoteLink" class="oskar-remote-link"></div><div class="oskar-remote-actions"><button type="button" class="btn success" id="oskarCopyRemoteLink">نسخ الرابط</button><button type="button" class="btn ghost" id="oskarOpenRemoteLink">فتح</button><button type="button" class="btn danger" id="oskarCloseRemoteModal">إغلاق</button></div></div>';
    document.body.appendChild(back); back.addEventListener('click',function(e){if(e.target===back)back.style.display='none'});
    $('oskarCloseRemoteModal').onclick=function(){back.style.display='none'};
    $('oskarOpenRemoteLink').onclick=function(){window.open(mobileCameraURL(),'_blank')};
    $('oskarCopyRemoteLink').onclick=function(){var link=mobileCameraURL(); if(navigator.clipboard)navigator.clipboard.writeText(link).then(function(){toast('تم نسخ الرابط')}); else prompt('انسخ الرابط',link)};
  }
  function openMobileRemote(){installRemoteModal(); $('oskarRemoteQr').src=qrURL(); $('oskarRemoteLink').textContent=mobileCameraURL(); $('oskarRemoteModalBack').style.display='flex'}
  window.openMobileScannerModal = window.openMobileScannerModal || openMobileRemote;
  window.openProductMobileScannerModal = openMobileRemote;
  function productBarcodeInput(){return $('barcode')||$('prodBarcode')||document.querySelector('input[name="barcode"],input[name="sku"],input[id*="barcode" i],input[placeholder*="باركود"]')}
  function applyProductBarcode(code){var inp=productBarcodeInput(); if(!inp)return false; inp.value=String(code||'').trim(); inp.dispatchEvent(new Event('input',{bubbles:true})); inp.dispatchEvent(new Event('change',{bubbles:true})); pulse('تم تعبئة الباركود'); return true;}
  async function pullCloud(d){d=d||getDB(); d.settings=d.settings||{}; d.settings.companyKey=d.settings.companyKey||companyKey(); saveDB(d); if(navigator.onLine&&window.FirebaseBridge&&FirebaseBridge.sync){try{var nd=await FirebaseBridge.sync(d,{companyKey:companyKey(),silent:true,background:true,noRender:true}); if(nd&&typeof nd==='object'){saveDB(nd); return nd}}catch(e){}} return getDB()}
  async function pushCloud(d){d=d||getDB(); saveDB(d); if(navigator.onLine&&window.FirebaseBridge){try{if(FirebaseBridge.pushWithKey)await FirebaseBridge.pushWithKey(companyKey(),{silent:true,background:true,noRender:true}); else if(FirebaseBridge.sync)await FirebaseBridge.sync(d,{companyKey:companyKey(),silent:true,background:true,noRender:true})}catch(e){}}}
  function processedKey(){return isProductForm()?'oskar_mobile_barcode_done_product':'oskar_mobile_barcode_done_ids'}
  function loadProcessed(){try{return JSON.parse(localStorage.getItem(processedKey())||'{}')}catch(e){return {}}}
  function saveProcessed(p){try{localStorage.setItem(processedKey(),JSON.stringify(p||{}))}catch(e){}}
  var recvBusy=false;
  async function readProductQueue(){
    if(!isProductForm()||recvBusy) return; recvBusy=true;
    try{var done=loadProcessed(); var d=await pullCloud(getDB()); var q=Array.isArray(d[QUEUE_KEY])?d[QUEUE_KEY]:[]; var changed=false; q.sort(function(a,b){return String(a.createdAt||'').localeCompare(String(b.createdAt||''))});
      for(var i=0;i<q.length;i++){var it=q[i]; if(!it||!it.id||done[it.id])continue; if(it.companyKey&&it.companyKey!==companyKey())continue; var code=it.barcode||it.code||it.value||''; if(applyProductBarcode(code)){it.status='done-product';it.doneAt=nowISO();done[it.id]=Date.now();changed=true;break}}
      if(changed){d[QUEUE_KEY]=q.slice(-120); saveDB(d); saveProcessed(done); pushCloud(d)}
    }catch(e){console.warn('product mobile queue',e)} finally{recvBusy=false}
  }
  function injectProductMobileButton(){
    if(!isProductForm()) return; addStyle(); installRemoteModal();
    if($('oskarProductMobileScanBtn')) return;
    var target=productBarcodeInput(); var place=(target&&target.closest('.field')) || document.querySelector('.table-toolbar,.tools,#mainCard') || document.body;
    var btn=document.createElement('button'); btn.type='button'; btn.id='oskarProductMobileScanBtn'; btn.className='btn ghost oskar-product-mobile-scan'; btn.innerHTML='📱 ربط الجوال للباركود'; btn.onclick=openMobileRemote;
    if(target&&target.parentElement){target.insertAdjacentElement('afterend',btn)} else place.appendChild(btn);
  }
  function installProductMobile(){
    if(!isProductForm()) return; injectProductMobileButton(); setInterval(readProductQueue,450); setTimeout(readProductQueue,300); setTimeout(injectProductMobileButton,900);
  }

  addStyle(); installFastScanner(); installRestaurant(); installInvoices(); installProductMobile();
  document.addEventListener('DOMContentLoaded',function(){addStyle();installFastScanner();installRestaurant();installInvoices();installProductMobile();});
  setTimeout(function(){installRestaurant();installInvoices();installProductMobile();},500);
  setTimeout(function(){installRestaurant();installInvoices();installProductMobile();},1400);
})();
