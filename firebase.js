import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  getDoc, getDocs, onSnapshot, query, where, orderBy, limit, serverTimestamp,
  Timestamp, increment
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

export const DEFAULT_ADMIN_KEY = '0000';
export const RESTAURANT_ID = 'r7_burger';

export const firebaseConfig = {
  apiKey: 'AIzaSyCnLAY7zQyBy7gUuL9wszt9aEhiJgvRmxI',
  authDomain: 'shop-d52dc.firebaseapp.com',
  databaseURL: 'https://shop-d52dc-default-rtdb.firebaseio.com',
  projectId: 'shop-d52dc',
  storageBucket: 'shop-d52dc.appspot.com',
  messagingSenderId: '97580537866',
  appId: '1:97580537866:web:abc46e5a2f527b6300a7f3',
  measurementId: 'G-956RQMBP42'
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app);

export {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs,
  onSnapshot, query, where, orderBy, limit, serverTimestamp, Timestamp, increment
};

export const col = (...path) => collection(db, 'restaurants', RESTAURANT_ID, ...path);
export const refDoc = (...path) => doc(db, 'restaurants', RESTAURANT_ID, ...path);

export const FALLBACK_SETTINGS = {
  name: 'R7 Burger',
  slogan: 'نظام المنيو الذكي',
  currency: '₪',
  whatsapp: '970590000000',
  publicMenuUrl: '',
  taxRate: 0,
  serviceRate: 0,
  acceptOrdersOutsideRestaurant: true
};

export const FALLBACK_CATEGORIES = [
  { id: 'burgers', name: 'الوجبات الأساسية', sort: 1, active: true },
  { id: 'drinks', name: 'المشروبات', sort: 2, active: true },
  { id: 'sides', name: 'الإضافات', sort: 3, active: true }
];

export const FALLBACK_PRODUCTS = [
  {
    id: 'demo-burger', name: 'برجر كلاسيك', price: 20, categoryId: 'burgers', active: true, sort: 1,
    description: 'لحم بقري مشوي مع جبنة وصوص خاص وخضار طازجة.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&h=700&fit=crop'
  },
  {
    id: 'demo-crispy', name: 'وجبة كريسبي', price: 25, categoryId: 'burgers', active: true, sort: 2,
    description: 'دجاج كريسبي مع بطاطا وصوص المطعم.',
    image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=900&h=700&fit=crop'
  },
  {
    id: 'demo-cola', name: 'كولا باردة', price: 5, categoryId: 'drinks', active: true, sort: 3,
    description: 'مشروب غازي بارد.',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=900&h=700&fit=crop'
  }
];

function rawCode(err){
  return String(err?.code || err?.message || err || '').toLowerCase();
}

export function firebaseErrorMessage(err){
  const code = rawCode(err);
  const msg = err?.message || String(err || '');
  if(code.includes('auth/admin-restricted-operation') || code.includes('auth/operation-not-allowed')){
    return 'تم حذف Firebase Auth من هذه النسخة. إذا ظهرت هذه الرسالة فأنت تفتح نسخة قديمة. استخدم الملفات الجديدة فقط.';
  }
  if(code.includes('permission-denied')){
    return 'صلاحيات Firestore تمنع القراءة أو الكتابة. انسخ قواعد firestore.rules.txt الموجودة مع الملفات إلى Firebase Console ثم اضغط Publish.';
  }
  if(code.includes('failed-precondition') && code.includes('index')){
    return 'Firestore يحتاج Index لهذا الاستعلام. افتح رابط الخطأ من Console أو استخدم النسخة التي لا تعتمد على ترتيب مركب.';
  }
  if(code.includes('unavailable')) return 'تعذر الاتصال بـ Firebase حالياً. تحقق من الإنترنت ومن حالة مشروع Firebase.';
  if(code.includes('failed to fetch') || code.includes('network')) return 'فشل الاتصال بـ Firebase. شغّل الملفات من استضافة أو سيرفر محلي وليس من file://، وتحقق من الإنترنت.';
  if(code.includes('quota')) return 'تم تجاوز حصة Firebase المجانية أو توجد قيود على المشروع.';
  return msg || 'حدث خطأ غير معروف في Firebase.';
}

export function money(value, currency = '₪'){
  const n = Number(value || 0);
  return `${n.toFixed(Number.isInteger(n) ? 0 : 2)} ${currency}`;
}

export function orderNo(){
  const d = new Date();
  const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  return `R7-${stamp}-${Math.floor(1000 + Math.random()*9000)}`;
}

export function localNow(){
  return new Date().toLocaleString('ar', { hour12: false });
}

export function toMillis(value){
  if(!value) return null;
  if(typeof value === 'number') return value;
  if(value.toMillis) return value.toMillis();
  if(value.seconds) return value.seconds * 1000;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export async function sha256(text){
  const data = new TextEncoder().encode(String(text));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function makeKey(length = 10){
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let out = '';
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  for(let i = 0; i < length; i++) out += chars[buf[i] % chars.length];
  return out;
}

export function sessionGet(){
  try { return JSON.parse(localStorage.getItem('r7_admin_session') || 'null'); }
  catch { return null; }
}

export function sessionIsValid(){
  const session = sessionGet();
  if(!session) return false;
  if(!session.expiresAt) return true;
  return Date.now() < Number(session.expiresAt);
}

export function sessionSave(data){
  localStorage.setItem('r7_admin_session', JSON.stringify(data));
  return data;
}

export function logout(){
  localStorage.removeItem('r7_admin_session');
  location.href = 'login.html';
}

export function requireAdmin(){
  if(sessionIsValid()) return true;
  const next = encodeURIComponent(location.pathname.split('/').pop() + location.search);
  location.href = `login.html?next=${next}`;
  return false;
}

export async function validateAdminKey(rawKey){
  const key = String(rawKey || '').trim();
  if(!key) throw new Error('أدخل مفتاح الدخول');

  // إصلاح مباشر لمشكلتك: المفتاح الافتراضي يعمل بدون Firebase Auth وبدون أي سجل مسبق.
  if(key === DEFAULT_ADMIN_KEY){
    return sessionSave({
      keyId: 'bootstrap-0000',
      label: 'دخول افتراضي 0000 - أنشئ مفتاحاً جديداً ثم غيّره',
      loggedAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      bootstrap: true
    });
  }

  const hash = await sha256(key);
  const snap = await getDocs(query(col('accessKeys'), where('hash', '==', hash), limit(1)));
  if(snap.empty) throw new Error('مفتاح الدخول غير صحيح');

  let match = null;
  snap.forEach(d => { if(!match) match = { id: d.id, ref: d.ref, data: d.data() }; });
  const data = match.data || {};
  if(data.active === false) throw new Error('هذا المفتاح معطل من الإعدادات');
  const expiresAt = toMillis(data.expiresAt);
  if(expiresAt && Date.now() > expiresAt) throw new Error('انتهت صلاحية هذا المفتاح');
  if(data.maxUses && Number(data.useCount || 0) >= Number(data.maxUses)) throw new Error('تم استهلاك عدد مرات استخدام هذا المفتاح');

  await updateDoc(match.ref, { lastLoginAt: serverTimestamp(), useCount: increment(1) });
  return sessionSave({ keyId: match.id, label: data.label || 'Admin', loggedAt: Date.now(), expiresAt: expiresAt || null, bootstrap: false });
}

export async function ensureSeedData({ createDefaultKey = false } = {}){
  await setDoc(refDoc('settings', 'main'), {
    ...FALLBACK_SETTINGS,
    updatedAt: serverTimestamp()
  }, { merge: true });

  const cats = await getDocs(col('categories'));
  if(cats.empty){
    for(const c of FALLBACK_CATEGORIES){
      const { id, ...data } = c;
      await setDoc(refDoc('categories', id), { ...data, createdAt: serverTimestamp() }, { merge: true });
    }
  }

  const prods = await getDocs(col('products'));
  if(prods.empty){
    for(const p of FALLBACK_PRODUCTS){
      const { id, ...data } = p;
      await setDoc(refDoc('products', id), { ...data, createdAt: serverTimestamp() }, { merge: true });
    }
  }

  if(createDefaultKey){
    const keys = await getDocs(col('accessKeys'));
    if(keys.empty){
      await setDoc(refDoc('accessKeys', 'default-admin'), {
        label: 'مفتاح افتراضي - 0000',
        hash: await sha256(DEFAULT_ADMIN_KEY),
        type: 'permanent',
        active: true,
        createdAt: serverTimestamp(),
        expiresAt: null,
        maxUses: null,
        useCount: 0
      }, { merge: true });
    }
  }
}

export function snapshotList(snap){
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function currentMenuBaseUrl(settings = {}){
  const saved = String(settings.publicMenuUrl || '').trim();
  if(saved) return saved.replace(/\?$/, '');
  const base = location.href.split('?')[0].replace(/[^/]+$/, 'index.html');
  return base;
}
