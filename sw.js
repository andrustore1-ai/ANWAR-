const CACHE='pos-ar-teal-v25-r16-freeze-scanner-product-mobile';
const ASSETS=["index.html", "README-RESTAURANT-OS.txt", "README-آخر-تعديل.txt", "README-إصلاح-الجلسة-والبحث-والمزامنة.txt", "README-إصلاح-الحفظ-وقسم-المطعم.txt", "README-إصلاح-المزامنة-الجذري.txt", "README-إصلاحات-نهائية.txt", "README-التعديلات.txt", "README-تحديث-الكاشير-والأوفلاين-والسجلات.txt", "README-تعديل-إضافة-صنف-مورد-حساب-باركود.txt", "README-تعديل-العملاء-والديون-والألوان-10-05-2026.txt", "README-تعديل-المطعم-والفايربيز-10-05-2026.txt", "README-تعديلات-المطعم-نهائية.txt", "README-تعديلات-فايربيز-والدخول.txt", "README-تعديلات-نهائية-08-05-2026.txt", "README.txt", "firebase-config.js", "firebase.js", "icon.svg", "manifest.webmanifest", "oskar-core-fix.js", "oskar-mobile-app-polish.js", "qr.mp3", "إدارة-الحسابات.html", "إضافة-المصاريف.html", "إضافة-صنف.html", "إضافة-مبيعات.html", "إضافة-مشتريات.html", "إعدادات-الباركود.html", "استيراد-العملاء-والموردين.html", "استيراد-بيانات-الأصناف.html", "استيراد-بيانات-المبيعات.html", "استيراد-كميات-افتتاحية.html", "الأجور.html", "الأكثر-مبيعا.html", "الإعدادات.html", "الديون.html", "الشحن-والتوصيل.html", "العملاء.html", "الفواتير.html", "الكاشير.html", "المخزون-التالف.html", "الموردين.html", "الموظفين.html", "تحديث-الأسعار.html", "تحويل-مالي.html", "تقرير-الأرباح.html", "تقرير-الحسابات.html", "تقرير-الديون.html", "تقرير-العملاء-والموردين.html", "تقرير-المبيعات-مفصل.html", "تقرير-المخزون.html", "تقرير-المشتريات.html", "تقرير-المصاريف.html", "تقرير-مناوبة-الموظفين.html", "حركات-الأصناف.html", "خصومات-ترويجية.html", "سجل-الحسابات.html", "سجل-الكاشير.html", "سجل-المشتريات.html", "سجل-نشاطات-الموظفين.html", "شروحات.html", "شكل-الفاتورة.html", "ضمانات-الأصناف.html", "طابعات-الإيصالات.html", "طباعة-الملصقات.html", "عروض-الأسعار.html", "فئات-المصاريف.html", "فروع-مخازن.html", "قائمة-المصاريف.html", "كاميرا-الكاشير.html", "كل-الأصناف.html", "كل-المبيعات.html", "كل-المشتريات.html", "لوحة-المتابعة.html", "ماركات-الأصناف.html", "متغيرات-الأصناف.html", "مجموعات-الأسعار.html", "مجموعات-الأصناف.html", "مجموعات-العملاء.html", "مرجع-المبيعات.html", "مرجع-المشتريات.html", "مسودات-البيع.html", "مطعم-الحجوزات.html", "مطعم-الطاولات.html", "مطعم-المطبخ.html", "مطعم-المنيو-الرقمي.html", "مطعم-الوصفات-والتكلفة.html", "مطعم-تحليلات-الأرباح.html", "مطعم-كاشير-المطعم.html", "مطعم-مخزون-المطعم.html", "معدلات-الضرائب.html", "نقل-مخزني.html", "وحدات-الأصناف.html"];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.allSettled(ASSETS.map(url=>cache.add(new Request(url,{cache:'reload'}))));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
function sameOrigin(req){try{return new URL(req.url).origin===self.location.origin}catch(e){return false}}
function shouldNetworkOnly(req){
  try{const u=new URL(req.url); return req.method!=='GET'||u.hostname.includes('firebaseio.com')||u.hostname.includes('googleapis.com')||u.hostname.includes('gstatic.com')||u.pathname.endsWith('/sw.js')||u.pathname.endsWith('.json');}catch(e){return true}
}
async function putCache(req,res){try{if(res&&res.ok&&sameOrigin(req)){const c=await caches.open(CACHE); await c.put(req,res.clone());}}catch(e){}}
async function cacheFirst(req){
  const cached=await caches.match(req,{ignoreSearch:true});
  if(cached){ fetch(req).then(res=>putCache(req,res)).catch(()=>{}); return cached; }
  try{const res=await fetch(req); await putCache(req,res); return res;}
  catch(e){return caches.match('index.html') || Response.error();}
}
async function navigation(req){
  const u=new URL(req.url);
  const path=u.pathname.split('/').pop() || 'index.html';
  const direct=await caches.match(path,{ignoreSearch:true}) || await caches.match(req,{ignoreSearch:true});
  if(direct){ fetch(req).then(res=>putCache(req,res)).catch(()=>{}); return direct; }
  try{const res=await fetch(req); await putCache(req,res); return res;}
  catch(e){return caches.match('index.html') || Response.error();}
}
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(shouldNetworkOnly(req)){ event.respondWith(fetch(req).catch(()=>caches.match(req))); return; }
  if(req.mode==='navigate'){ event.respondWith(navigation(req)); return; }
  event.respondWith(cacheFirst(req));
});

// R16: restaurant and invoices freeze fixes, larger/faster barcode scanner, product mobile barcode link

// R16: cache refresh for freeze/scanner/product mobile link fixes
