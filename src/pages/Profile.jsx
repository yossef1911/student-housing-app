// بنجيب الأدوات الأساسية من مكتبة React (زي مساحات التخزين والدوال اللي بتشتغل أول ما الصفحة تفتح).
import React, { useState, useEffect } from 'react';
// بنجيب أداة التنقل عشان ننقل الطالب بين الصفحات.
import { useNavigate } from 'react-router-dom';
// لوجو الموقع.
import logo from '../assets/logo.png';
// أداة الاتصال بقاعدة البيانات عشان نقدر نجيب بيانات الطالب ونحدث كلمة المرور.
import { supabase } from '../services/supabaseClient';

// دي الدالة أو المكون الأساسي لصفحة "الملف الشخصي" (Profile).
const Profile = () => {
  // بنجهز أداة التنقل (navigate) عشان نستخدمها للرجوع للصفحة الرئيسية أو تحويل اليوزر لصفحة الدخول.
  const navigate = useNavigate();
  
  // مخزن للغة الصفحة (عربي/إنجليزي)، الافتراضي إنجليزي.
  const [lang, setLang] = useState('en');
  
  // مخزن لحالة التحميل، أول ما الصفحة تفتح بيبقى true عشان نظهر كلمة "جاري التحميل...".
  const [loading, setLoading] = useState(true);
  
  // مخزن هنحط فيه بيانات الطالب (الاسم، الإيميل، الرقم الجامعي) أول ما نجيبها من قاعدة البيانات. الافتراضي فاضي (null).
  const [studentData, setStudentData] = useState(null);

  // السطور اللي جاية دي مخازن مخصصة للقسم بتاع "تغيير كلمة المرور".
  // مخزن لكلمة المرور الجديدة اللي الطالب بيكتبها.
  const [newPassword, setNewPassword] = useState('');
  // مخزن لخانة تأكيد كلمة المرور الجديدة عشان نقارنهم ببعض.
  const [confirmPassword, setConfirmPassword] = useState('');
  // مخزن هنحط فيه الرسائل اللي بتظهر للطالب (سواء رسالة نجاح خضرا أو خطأ حمرا).
  // الـ type بيحدد نوع الرسالة (نجاح 'success' أو خطأ 'error').
  const [message, setMessage] = useState({ text: '', type: '' }); 

  // ده قاموس الترجمة بتاع الصفحة.
  // بيختار القسم العربي أو الإنجليزي بناءً على قيمة المخزن بتاع 'lang'.
  const t = {
    en: {
      toggleLang: "عربي", back: "Back to Home", title: "My Profile",
      personalInfo: "Personal Information", name: "Full Name", email: "Email Address", studentId: "Student ID",
      changePass: "Change Password", newPass: "New Password", confirmPass: "Confirm New Password",
      updateBtn: "Update Password", passMismatch: "Passwords do not match.", 
      passSuccess: "Password updated successfully!", passError: "Error updating password."
    },
    ar: {
      toggleLang: "English", back: "الرئيسية", title: "ملفي الشخصي",
      personalInfo: "البيانات الشخصية", name: "الاسم الكامل", email: "البريد الإلكتروني", studentId: "الرقم الجامعي",
      changePass: "تغيير كلمة المرور", newPass: "كلمة المرور الجديدة", confirmPass: "تأكيد كلمة المرور",
      updateBtn: "تحديث كلمة المرور", passMismatch: "كلمتا المرور غير متطابقتين.", 
      passSuccess: "تم تحديث كلمة المرور بنجاح!", passError: "حدث خطأ أثناء التحديث."
    }
  }[lang];

  // الـ useEffect دي بتشتغل مرة واحدة بس لما الصفحة تفتح.
  // وظيفتها إنها تروح تكلم قاعدة البيانات وتجيب بيانات الطالب عشان نعرضها.
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // 1. بنتأكد الأول إن الطالب مسجل دخول أصلاً ومعاه جلسة (session) شغالة.
        const { data: { session } } = await supabase.auth.getSession();
        
        // لو مش مسجل دخول، هنطرده على صفحة الدخول (/login) ونوقف الدالة.
        if (!session) {
          navigate('/login');
          return;
        }

        // 2. لو مسجل دخول، بنروح لجدول الطلاب ('students') في قاعدة البيانات.
        // وبنقوله: "هات كل البيانات اللي بتخص الطالب اللي مربوط بحساب الدخول الحالي".
        const { data: student } = await supabase
          .from('students')
          .select('*')
          .eq('auth_id', session.user.id) // بنقارن الـ auth_id بتاع الجدول بالـ ID بتاع الجلسة.
          .single(); // single معناها إحنا متأكدين إننا هنجيب سجل واحد بس (طالب واحد).

        // لو لقينا بيانات الطالب ومرجعتش فاضية، بنحفظها في مخزن 'studentData'.
        if (student) setStudentData(student);
      } catch (error) {
        // لو حصل مشكلة (النت فصل مثلاً)، هنطبع الخطأ في الكونسول للمبرمجين.
        console.error("Error fetching profile:", error);
      } finally {
        // في الآخر، سواء جبنا الداتا أو حصل خطأ، لازم نقفل حالة التحميل عشان الصفحة تظهر بدل كلمة "جاري التحميل".
        setLoading(false);
      }
    };

    // بنشغل الدالة فوراً.
    fetchProfileData();
  }, [navigate]); // navigate موجود هنا عشان React ميزعلش ويطلع تحذير.

  // الدالة دي بتشتغل لما الطالب يملى خانات كلمة المرور الجديدة ويدوس "تحديث".
  const handlePasswordUpdate = async (e) => {
    // بنمنع الصفحة من إنها تعمل ريفريش (إعادة تحميل) لما الفورمة تتبعت.
    e.preventDefault();
    
    // بنمسح أي رسائل خطأ أو نجاح قديمة كانت ظاهرة قبل كده.
    setMessage({ text: '', type: '' });

    // تفتيش أولي: هل كلمة المرور في الخانتين زي بعض بالظبط؟
    if (newPassword !== confirmPassword) {
      // لو مش زي بعض، بنطلعله رسالة خطأ ونوقف الدالة ومتكملش.
      setMessage({ text: t.passMismatch, type: 'error' });
      return;
    }

    // لو زي بعض، بنكمل ونكلم قاعدة البيانات عشان نحدث الباسورد.
    try {
      // بنكلم نظام الأمان (auth) في supabase ونقوله "حدث كلمة المرور بتاعة الطالب الحالي بالكلمة الجديدة دي".
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      // لو السيرفر اعترض ورجع خطأ (مثلاً الباسورد ضعيف جداً)، بنرمي الخطأ للـ catch اللي تحت.
      if (error) throw error;

      // لو التحديث تم بنجاح والسيرفر معترضش:
      // 1. بنطلعله رسالة نجاح خضرا "تم تحديث كلمة المرور بنجاح".
      setMessage({ text: t.passSuccess, type: 'success' });
      // 2. بنفضي الخانات اللي كان كاتب فيها الباسورد عشان تبقى نضيفة.
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      // لو حصل أي خطأ أثناء التحديث، بنطلع رسالة خطأ حمرا.
      setMessage({ text: t.passError, type: 'error' });
    }
  };

  // =====================================================================
  // واجهة المستخدم (التصميم اللي الطالب بيشوفه بعينيه على الشاشة)
  // =====================================================================
  return (
    // الغلاف الخارجي للصفحة (بيحدد الاتجاه يمين/شمال ونوع الخط بناءً على اللغة).
    <div className={`min-h-screen bg-gray-50 flex flex-col ${lang === 'en' ? 'font-en' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* الشريط العلوي (Navbar) */}
      <nav className="bg-white px-4 md:px-12 py-4 flex justify-between items-center shadow-sm" dir="ltr">
        {/* اللوجو، ولما تدوس عليه بيرجعك للصفحة الرئيسية */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <img src={logo} alt="Logo" className="h-12 object-contain" />
          <span className="text-2xl font-extrabold text-[#1b2a47] font-en">UniHome</span>
        </div>
        {/* الزراير الجانبية: زرار لتغيير اللغة، وزرار للرجوع للرئيسية */}
        <div className="flex gap-4">
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="font-bold text-gray-500 hover:text-[#5ca393]">{t.toggleLang}</button>
          <button onClick={() => navigate('/')} className="font-bold text-[#1b2a47] hover:text-[#5ca393]">{t.back}</button>
        </div>
      </nav>

      {/* المحتوى الرئيسي لصفحة البروفايل */}
      <div className="flex-grow max-w-4xl mx-auto px-4 py-12 w-full">
        {/* العنوان الكبير اللي فوق "ملفي الشخصي" */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1b2a47] mb-10 text-center border-b-4 border-[#5ca393] inline-block pb-2">
          {t.title}
        </h1>

        {/* لو لسه بنحمل البيانات بنعرض كلمة "جاري التحميل" */}
        {loading ? (
          <div className="text-center text-xl font-bold text-gray-500 mt-20">جاري التحميل...</div>
        ) : studentData ? (
          // لو خلصنا تحميل ولقينا بيانات الطالب، بنعرض الكروت اللي تحت دي.
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* 1. الكارت الأول: البيانات الشخصية (الاسم، الرقم، الإيميل) */}
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 h-fit">
              {/* عنوان الكارت والأيقونة */}
              <h2 className="text-2xl font-bold text-[#1b2a47] mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-50 text-[#5ca393] rounded-full flex justify-center items-center">👤</span>
                {t.personalInfo}
              </h2>
              {/* الخانات اللي فيها البيانات (بنعرض البيانات من مخزن studentData اللي جبناه من قاعدة البيانات) */}
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-gray-400 block mb-1">{t.name}</label>
                  <div className="text-lg font-bold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">{studentData.student_name}</div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-400 block mb-1">{t.studentId}</label>
                  <div className="text-lg font-extrabold text-[#5ca393] bg-gray-50 p-3 rounded-xl border border-gray-100 tracking-wider">{studentData.student_id}</div>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-400 block mb-1">{t.email}</label>
                  <div className="text-lg font-bold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">{studentData.email}</div>
                </div>
              </div>
            </div>

            {/* 2. الكارت التاني: لتغيير كلمة المرور */}
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 h-fit">
              {/* عنوان الكارت والأيقونة */}
              <h2 className="text-2xl font-bold text-[#1b2a47] mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-orange-50 text-orange-500 rounded-full flex justify-center items-center">🔒</span>
                {t.changePass}
              </h2>
              
              {/* لو فيه رسالة (نجاح أو خطأ) متخزنة في المخزن بتاع 'message'، نعرضها هنا.
                  وبنغير لون المربع (أخضر للنجاح، أحمر للخطأ) بناءً على الـ type.
              */}
              {message.text && (
                <div className={`mb-6 p-3 text-sm font-bold rounded-xl text-center border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {message.text}
                </div>
              )}

              {/* الفورمة بتاعة تغيير كلمة المرور. لما الطالب يدوس تحديث هتنادي على الدالة handlePasswordUpdate */}
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  {/* خانة الباسورد الجديد، مربوطة بمخزن newPassword، وشرط إنها متقلش عن 6 حروف */}
                  <label className="text-sm font-bold text-gray-600 block mb-2">{t.newPass}</label>
                  <input type="password" required minLength="6" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5ca393] outline-none transition-all" dir="ltr" />
                </div>
                <div>
                  {/* خانة تأكيد الباسورد الجديد، مربوطة بمخزن confirmPassword */}
                  <label className="text-sm font-bold text-gray-600 block mb-2">{t.confirmPass}</label>
                  <input type="password" required minLength="6" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5ca393] outline-none transition-all" dir="ltr" />
                </div>
                {/* زرار التحديث */}
                <button type="submit" className="w-full py-3.5 mt-4 bg-gradient-to-r from-[#1b2a47] to-[#2a406b] text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-md">
                  {t.updateBtn}
                </button>
              </form>
            </div>

          </div>
        ) : (
          // لو خلصنا تحميل وملقيناش بيانات، بنعرض رسالة خطأ.
          <div className="text-center text-red-500 font-bold">حدث خطأ في جلب البيانات.</div>
        )}
      </div>
    </div>
  );
};

// بنصدر المكون عشان المشروع يقدر يستخدمه.
export default Profile;