# تطبيق إدارة متجر جوالات - HTML + Firebase

## التشغيل السريع
1. افتح `index.html` للتجربة.
2. الأفضل للمزامنة و PWA تشغيل المجلد من سيرفر محلي أو استضافة:
   ```bash
   python -m http.server 8000
   ```
   ثم افتح: `http://localhost:8000`

## الصفحات
- `index.html` لوحة التحكم
- `products.html` المنتجات
- `phones.html` الجوالات IMEI / Serial
- `sales.html` البيع
- `maintenance.html` الصيانة
- `purchases.html` المشتريات
- `suppliers.html` التجار / الموردين
- `customers.html` الزبائن
- `banks.html` البنوك والصناديق
- `debts.html` الديون
- `debt-details.html` كشف دين مستقل لكل زبون/تاجر
- `reports.html` التقارير
- `settings.html` الإعدادات
- `login.html` تسجيل الدخول

كل صفحة تحتوي HTML + CSS + JavaScript داخلي داخل نفس الملف.

## Firebase المستخدم
تم تركيب مشروع Firebase التالي داخل كل الصفحات:

```js
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCnLAY7zQyBy7gUuL9wszt9aEhiJgvRmxI",
  authDomain: "shop-d52dc.firebaseapp.com",
  databaseURL: "https://shop-d52dc-default-rtdb.firebaseio.com",
  projectId: "shop-d52dc",
  storageBucket: "shop-d52dc.appspot.com",
  messagingSenderId: "97580537866",
  appId: "1:97580537866:web:abc46e5a2f527b6300a7f3",
  measurementId: "G-956RQMBP42"
};
```

المسار المستخدم في Firestore مطابق لنمط الكود الذي أرسلته:

```text
artifacts/echo-store-cdgjhdvjt/public/data/products_cdgjhdvjt
artifacts/echo-store-cdgjhdvjt/public/data/categories_cdgjhdvjt
artifacts/echo-store-cdgjhdvjt/public/data/banks_cdgjhdvjt
...
```

## إصلاح v5 المهم
هذه النسخة لا توقف المزامنة إذا كان Anonymous Auth غير مفعل. التطبيق يحاول تسجيل الدخول Anonymous، وإذا رفض Firebase ذلك يكمل المزامنة عبر قواعد Firestore المفتوحة الموجودة في ملف `firestore.rules`.

المطلوب فقط:
1. افتح Firebase Console.
2. افتح Firestore Database > Rules.
3. انسخ محتوى ملف `firestore.rules` الموجود في المشروع.
4. اضغط Publish.
5. افتح `settings.html` واضغط مزامنة الآن.

## المزامنة
- أي إضافة/تعديل/حذف تحفظ فورًا في LocalStorage.
- العملية تضاف إلى `syncQueue`.
- عند وجود إنترنت يتم الرفع تلقائيًا خلال أقل من ثانية.
- عند انقطاع الإنترنت يبقى العدد ظاهرًا فوق زر المزامنة.
- عند رجوع الإنترنت أو الضغط على مزامنة الآن يتم رفع العمليات.
- بعد نجاح الرفع يختفي العدد.
- عند فتح أي صفحة يتم سحب آخر بيانات Firestore.
- توجد listeners لحظية حتى تظهر التغييرات على جهاز آخر.

## التصدير
الجداول تدعم:
- PDF
- Excel
- صورة PNG

ويشمل ذلك المنتجات، الزبائن، الموردين، الجوالات، البيع، المشتريات، الصيانة، البنوك، الديون، والتقارير.

## ملاحظات إنتاجية
قواعد `firestore.rules` الحالية مفتوحة حتى يعمل التطبيق فورًا بدون مشكلة Anonymous. بعد انتهاء الاختبار يمكن للمبرمج إغلاقها وإضافة صلاحيات حسب المستخدمين والأدوار.
