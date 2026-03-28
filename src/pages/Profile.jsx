import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { supabase } from '../services/supabaseClient';

// المكون الرئيسي لصفحة الملف الشخصي لعرض بيانات الطالب وتحديث كلمة المرور
const Profile = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' }); 

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

  // التحقق من الجلسة وجلب بيانات الطالب من قاعدة البيانات عند تحميل الصفحة
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/login');
          return;
        }

        const { data: student } = await supabase
          .from('students')
          .select('*')
          .eq('auth_id', session.user.id)
          .single();

        if (student) setStudentData(student);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  // معالجة طلب تحديث كلمة المرور مع التحقق من التطابق
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ text: t.passMismatch, type: 'error' });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage({ text: t.passSuccess, type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage({ text: t.passError, type: 'error' });
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col ${lang === 'en' ? 'font-en' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      <nav className="bg-white px-4 md:px-12 py-4 flex justify-between items-center shadow-sm" dir="ltr">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <img src={logo} alt="Logo" className="h-12 object-contain" />
          <span className="text-2xl font-extrabold text-[#1b2a47] font-en">UniHome</span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="font-bold text-gray-500 hover:text-[#5ca393]">{t.toggleLang}</button>
          <button onClick={() => navigate('/')} className="font-bold text-[#1b2a47] hover:text-[#5ca393]">{t.back}</button>
        </div>
      </nav>

      <div className="flex-grow max-w-4xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1b2a47] mb-10 text-center border-b-4 border-[#5ca393] inline-block pb-2">
          {t.title}
        </h1>

        {loading ? (
          <div className="text-center text-xl font-bold text-gray-500 mt-20">جاري التحميل...</div>
        ) : studentData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 h-fit">
              <h2 className="text-2xl font-bold text-[#1b2a47] mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-50 text-[#5ca393] rounded-full flex justify-center items-center">👤</span>
                {t.personalInfo}
              </h2>
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

            <div className="bg-white rounded-2xl shadow-md p-8 border border-gray-100 h-fit">
              <h2 className="text-2xl font-bold text-[#1b2a47] mb-6 flex items-center gap-2">
                <span className="w-8 h-8 bg-orange-50 text-orange-500 rounded-full flex justify-center items-center">🔒</span>
                {t.changePass}
              </h2>
              
              {message.text && (
                <div className={`mb-6 p-3 text-sm font-bold rounded-xl text-center border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-600 block mb-2">{t.newPass}</label>
                  <input type="password" required minLength="6" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5ca393] outline-none transition-all" dir="ltr" />
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-600 block mb-2">{t.confirmPass}</label>
                  <input type="password" required minLength="6" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5ca393] outline-none transition-all" dir="ltr" />
                </div>
                <button type="submit" className="w-full py-3.5 mt-4 bg-gradient-to-r from-[#1b2a47] to-[#2a406b] text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-md">
                  {t.updateBtn}
                </button>
              </form>
            </div>

          </div>
        ) : (
          <div className="text-center text-red-500 font-bold">حدث خطأ في جلب البيانات.</div>
        )}
      </div>
    </div>
  );
};

export default Profile;