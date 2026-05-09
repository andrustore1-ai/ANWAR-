تم تعديل النسخة حسب طلبك:

1) تم تغيير إعدادات Firebase إلى المشروع الجديد:
   projectId: shop-d52dc
   authDomain: shop-d52dc.firebaseapp.com
   storageBucket: shop-d52dc.appspot.com
   appId: 1:97580537866:web:abc46e5a2f527b6300a7f3
   measurementId: G-956RQMBP42

2) لأن النظام يعتمد على Realtime Database عبر REST، أُضيف databaseURL المتوقع:
   https://shop-d52dc-default-rtdb.firebaseio.com
   إذا كان رابط قاعدة البيانات عندك مختلفاً من إعدادات Firebase، غيّره من firebase.js في قيمة databaseURL فقط.

3) مفتاح الدخول الفريد الافتراضي أصبح:
   SHOP-D52DC

4) كلمة مرور المدير الافتراضية لأول دخول فقط:
   0000000000@@
   بعد الدخول بها من تبويب "مدير" سيطلب النظام تغييرها فوراً، وبعد التغيير لن تعمل الكلمة الافتراضية مرة أخرى.

5) تم منع استخدام كلمة المرور الافتراضية من دخول الموظف/الأدمن. الدخول الافتراضي مخصص للمدير فقط.
