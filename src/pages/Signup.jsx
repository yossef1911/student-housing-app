import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { supabase } from '../services/supabaseClient';

const Signup = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');
  
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const content = {
    en: {
      login: "Login", toggleLang: "عربي",
      joinTitle: "Join the UniHome Community",
      namePlaceholder: "Name",
      idPlaceholder: "Student ID (Min 6 digits)",
      emailPlaceholder: "Email",
      passPlaceholder: "Password",
      confirmPassPlaceholder: "Confirm Password",
      createAccBtn: loading ? "Creating Account..." : "Create Account",
      alreadyHave: "Already have an account?",
      loginHere: "Login here",
      gmailError: "Email must end with @gmail.com only.",
      matchError: "Passwords do not match.",
      idLengthError: "Student ID must be at least 6 digits.",
      // أخطاء ذكية جديدة بالإنجليزية
      emailInUseError: "This email is already registered. Please login.",
      weakPasswordError: "Password must be at least 6 characters.",
      duplicateIdError: "This Student ID is already registered in our system.",
      generalError: "An unexpected error occurred. Please try again.",
      successMsg: "Account created successfully!"
    },
    ar: {
      login: "دخول", toggleLang: "English",
      joinTitle: "انضم إلى مجتمع UniHome",
      namePlaceholder: "الاسم باللغة الإنجليزية", 
      idPlaceholder: "الرقم الجامعي (6 أرقام على الأقل)",
      emailPlaceholder: "البريد الإلكتروني",
      passPlaceholder: "كلمة المرور",
      confirmPassPlaceholder: "تأكيد كلمة المرور",
      createAccBtn: loading ? "جاري الإنشاء..." : "إنشاء حساب",
      alreadyHave: "لديك حساب بالفعل؟",
      loginHere: "سجل دخولك هنا",
      gmailError: "يجب أن ينتهي البريد الإلكتروني بـ @gmail.com فقط.",
      matchError: "كلمتا المرور غير متطابقتين.",
      idLengthError: "يجب أن يتكون الرقم الجامعي من 6 أرقام على الأقل.",
      // أخطاء ذكية جديدة بالعربية
      emailInUseError: "هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.",
      weakPasswordError: "كلمة المرور ضعيفة (يجب أن تتكون من 6 أحرف على الأقل).",
      duplicateIdError: "هذا الرقم الجامعي مسجل بالفعل في النظام.",
      generalError: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",
      successMsg: "تم إنشاء الحساب بنجاح!"
    }
  };

  const t = content[lang];
  const heroImage = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";

  const handleNameChange = (e) => {
    const englishOnlyName = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    setName(englishOnlyName);
  };

  const handleStudentIdChange = (e) => {
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    if (numericValue.startsWith('0')) return;
    setStudentId(numericValue);
  };

  const handleEmailChange = (e) => {
    const englishOnlyValue = e.target.value.replace(/[^a-zA-Z0-9@._-]/g, '');
    setEmail(englishOnlyValue);
    if(errorMsg) setErrorMsg('');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      setErrorMsg(t.gmailError);
      return; 
    }
    if (password !== confirmPassword) {
      setErrorMsg(t.matchError);
      return;
    }
    if (!studentId || studentId.length < 6) {
      setErrorMsg(t.idLengthError);
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      // 1. إنشاء الحساب في قسم Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      // التعامل الذكي مع أخطاء الـ Auth
      if (authError) {
        if (authError.message.includes("User already registered")) {
          setErrorMsg(t.emailInUseError);
        } else if (authError.message.includes("Password should be at least")) {
          setErrorMsg(t.weakPasswordError);
        } else {
          setErrorMsg(t.generalError + " (" + authError.message + ")");
        }
        setLoading(false);
        return;
      }

      // 2. إدخال بيانات الطالب في جدول students
      if (authData.user) {
        const { error: dbError } = await supabase
          .from('students')
          .insert([
            {
              student_id: studentId,
              auth_id: authData.user.id,
              student_name: name,
              email: email
            }
          ]);

        // التعامل الذكي مع أخطاء قاعدة البيانات
        if (dbError) {
          // رمز 23505 في قاعدة البيانات يعني أن القيمة مكررة (Unique Constraint)
          if (dbError.code === '23505') {
            setErrorMsg(t.duplicateIdError);
          } else {
            setErrorMsg(t.generalError);
          }
          setLoading(false);
          return;
        }

        alert(t.successMsg);
        navigate('/login');
      }
    } catch (err) {
      setErrorMsg(t.generalError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen relative flex flex-col ${lang === 'en' ? 'font-en' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      <nav className="fixed top-0 left-0 w-full bg-white px-4 md:px-12 py-3 flex justify-between items-center z-50 shadow-sm" dir="ltr">
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer shrink-0" onClick={() => navigate('/')}>
          <img src={logo} alt="UniHome Logo" className="h-10 sm:h-12 md:h-16 lg:h-20 object-contain" />
          <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1b2a47] font-en tracking-tight">
            UniHome
          </span>
        </div>

        <div className="flex items-center gap-3 md:gap-6 shrink-0">
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="text-sm md:text-base text-gray-500 hover:text-[#1b2a47] font-bold transition-colors">
            {t.toggleLang}
          </button>
          <Link to="/login" className="px-5 py-2 md:px-8 md:py-2.5 text-sm md:text-base bg-gradient-to-r from-[#5ca393] to-[#458b7c] text-white font-bold rounded-full hover:shadow-lg transition-all">
            {t.login}
          </Link>
        </div>
      </nav>

      <div className="absolute inset-0 z-0 overflow-hidden mt-[85px]">
        <img src={heroImage} alt="Background" className="w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-[#1b2a47]/40 backdrop-blur-md"></div>
      </div>

      <div className="relative z-10 flex-grow flex items-center justify-center px-4 pt-28 pb-12 mt-[85px]">
        <div className="bg-white rounded-[2rem] p-8 md:p-10 w-full max-w-md shadow-2xl text-center">
          
          <img src={logo} alt="UniHome Logo" className="h-16 mx-auto mb-4 object-contain" />

          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1b2a47] mb-8">
            {t.joinTitle}
          </h2>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-xl text-center shadow-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4 text-left">
            <div className="relative">
              <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </span>
              <input type="text" required value={name} onChange={handleNameChange} placeholder={t.namePlaceholder} className={`w-full ps-11 pe-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5ca393] focus:border-[#5ca393] outline-none transition-all text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`} dir="ltr" disabled={loading} />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
              </span>
              <input type="text" required value={studentId} onChange={handleStudentIdChange} placeholder={t.idPlaceholder} className={`w-full ps-11 pe-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5ca393] focus:border-[#5ca393] outline-none transition-all text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`} dir="ltr" disabled={loading} />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </span>
              <input type="email" required value={email} onChange={handleEmailChange} placeholder={t.emailPlaceholder} className={`w-full ps-11 pe-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5ca393] focus:border-[#5ca393] outline-none transition-all text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`} dir="ltr" disabled={loading} />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </span>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.passPlaceholder} className={`w-full ps-11 pe-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5ca393] focus:border-[#5ca393] outline-none transition-all text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`} dir="ltr" disabled={loading} />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </span>
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t.confirmPassPlaceholder} className={`w-full ps-11 pe-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5ca393] focus:border-[#5ca393] outline-none transition-all text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`} dir="ltr" disabled={loading} />
            </div>

            <button type="submit" disabled={loading} className={`w-full py-3.5 text-white font-bold text-lg rounded-xl transition-all transform shadow-md mt-6 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#5ca393] to-[#458b7c] hover:scale-[1.02] hover:shadow-lg'}`}>
              {t.createAccBtn}
            </button>
          </form>

          <div className="mt-8 text-center text-gray-600 font-medium text-sm">
            {t.alreadyHave} {' '}
            <Link to="/login" className="text-[#5ca393] font-bold hover:underline">
              {t.loginHere}
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Signup;