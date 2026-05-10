تم تعديل النسخة حسب طلبك:

1) تم تغيير إعدادات Firebase إلى المشروع الجديد:
   projectId: omar-ad0be
   authDomain: omar-ad0be.firebaseapp.com
   storageBucket: omar-ad0be.firebasestorage.app
   appId: 1:863859708783:web:97cd6783775ef3c395ce9a
   measurementId: G-HRLW64FXWV

2) لأن النظام يعتمد على Realtime Database عبر REST، أُضيف databaseURL المتوقع:
   https://omar-ad0be-default-rtdb.firebaseio.com
   إذا كان رابط قاعدة البيانات عندك مختلفاً من إعدادات Firebase، غيّره من firebase.js في قيمة databaseURL فقط.

3) مفتاح الدخول الفريد الافتراضي أصبح:
   OMAR-AD0BE-02

4) كلمة مرور المدير الافتراضية لأول دخول فقط:
   0000000000@@
   بعد الدخول بها من تبويب "مدير" سيطلب النظام تغييرها فوراً، وبعد التغيير لن تعمل الكلمة الافتراضية مرة أخرى.

5) تم منع استخدام كلمة المرور الافتراضية من دخول الموظف/الأدمن. الدخول الافتراضي مخصص للمدير فقط.
