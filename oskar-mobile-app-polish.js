/* Oskar mobile app polish + customer/debt fixes - 2026-05-10 */
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
    if(name && phone){
      c = {id:uidSafe('cust'), name, phone, mobile:phone, createdAt:nowSafe(), createdBy:currentUserName(), source:'تلقائي من الفاتورة'};
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
.bottom-nav{background:rgba(255,255,255,.97)!important;border:1px solid var(--line)!important;box-shadow:0 18px 46px rgba(47,133,132,.19)!important}.bottom-nav svg{stroke:${TEAL}!important}.bottom-nav a{color:#8a9aa1!important}.bottom-nav a.active{background:#e9f5f4!important;color:${TEAL}!important}
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
      box.innerHTML = rows.map(c => `<button type="button" onclick="selectCustomer('${esc(c.id)}')"><b>${esc(c.name||'عميل')}</b><small class="muted"> ${esc(c.phone||c.mobile||'')}</small></button>`).join('') || '<div class="muted" style="padding:10px">لا يوجد عميل مطابق، سيتم استخدام الاسم والرقم المدخلين.</div>';
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
      return `<tr><td>${esc(d.date||'')}</td><td><b>${esc(d.partyName||'')}</b></td><td>${esc(phone)}</td><td>${moneySafe(d.amount)}</td><td>${moneySafe(d.paid)}</td><td><b style="color:#dc2626">${moneySafe(rem)}</b></td><td>${esc(d.source||'')}</td><td>${esc(d.status||'مستحق')}</td><td>${action}</td></tr>`;
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
      const cards = Object.values(grouped).map(c => `<div class="debt-customer-card"><div><b>${esc(c.name||'عميل')}</b><div class="muted">${esc(c.phone||'بدون رقم')} · ${c.count} حركة</div></div><div class="debt-total">${moneySafe(c.total)}</div></div>`).join('');
      const html = `<div class="kpis"><div class="kpi"><span>إجمالي الديون</span><strong>${moneySafe(total)}</strong></div><div class="kpi"><span>المسدّد</span><strong>${moneySafe(paid)}</strong></div><div class="kpi" id="custKpi"><span>عدد العملاء</span><strong>${Object.keys(grouped).length}</strong></div><div class="kpi"><span>عدد الحركات</span><strong>${rows.length}</strong></div></div><div class="table-toolbar" style="margin:14px 0"><div class="tools"><button class="btn primary" onclick="openManualDebt()">+ إضافة دين يدوي</button><input id="searchBox" class="search" value="${esc(q)}" placeholder="بحث في الديون..." oninput="renderDebts()"></div></div>${cards}<h3>سجل الديون</h3><div class="table-wrap"><table class="data-table"><thead><tr><th>التاريخ</th><th>اسم الزبون</th><th>رقم الجوال</th><th>المبلغ</th><th>المدفوع</th><th>المتبقي</th><th>المصدر</th><th>الحالة</th><th>إجراء</th></tr></thead><tbody>${renderDebtRows(rows)}</tbody></table></div><div class="muted" style="margin-top:8px">زر “تم الدفع” يرحّل الدفعة مباشرة للحساب الذي تختاره.</div>`;
      if($('mainCard')) $('mainCard').innerHTML = html;
      setTimeout(applySelectPrefs,30);
    };
    try{ renderDebts = window.renderDebts; }catch(e){}
  }

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

  function install(){
    injectStyle(); installCustomerChooser(); installPaymentHTML(); installDebtCore(); installRenderDebts(); installSaleSave(); installInvoiceEditFix(); wrapRenderCart(); wrapRenderPage(); applySelectPrefs();
  }

  installSelectPersistence();
  [0,80,250,700,1500].forEach(ms => setTimeout(install,ms));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(install,60));
})();
