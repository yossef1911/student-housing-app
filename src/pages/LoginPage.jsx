import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { supabase } from '../services/supabaseClient';

// المكون الرئيسي لصفحة تسجيل الدخول وإدارة جلسات المستخدمين
const LoginPage = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false); 
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // التحقق من وجود بريد إلكتروني محفوظ مسبقاً (ميزة تذكرني)
  useEffect(() => {
    const savedEmail = localStorage.getItem('unihome_saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const content = {
    en: {
      signup: "Sign Up", toggleLang: "عربي",
      welcomeTitle: "Welcome Back to UniHome",
      emailPlaceholder: "Email",
      passPlaceholder: "Password",
      rememberMe: "Remember me",
      loginBtn: loading ? "Signing in..." : "Login",
      noAccount: "Don't have an account?",
      signupHere: "Sign up here",
      invalidLogin: "Invalid email or password.",
    },
    ar: {
      signup: "حساب جديد", toggleLang: "English",
      welcomeTitle: "مرحباً بك مجدداً في UniHome",
      emailPlaceholder: "البريد الإلكتروني",
      passPlaceholder: "كلمة المرور",
      rememberMe: "تذكرني",
      loginBtn: loading ? "جاري الدخول..." : "تسجيل الدخول",
      noAccount: "ليس لديك حساب؟",
      signupHere: "سجل من هنا",
      invalidLogin: "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
    }
  };

  const t = content[lang];
  const heroImage = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";

  // معالجة عملية تسجيل الدخول وتوجيه المستخدم بناءً على صلاحياته (طالب أو مدير)
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        setErrorMsg(t.invalidLogin);
        setLoading(false);
        return;
      }

      if (rememberMe) {
        localStorage.setItem('unihome_saved_email', email); 
      } else {
        localStorage.removeItem('unihome_saved_email'); 
      }

      if (data.user) {
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('auth_id', data.user.id)
          .single();

        if (adminData) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setErrorMsg("حدث خطأ في الاتصال بالخادم.");
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
          <Link to="/signup" className="px-5 py-2 md:px-8 md:py-2.5 text-sm md:text-base bg-gradient-to-r from-[#5ca393] to-[#458b7c] text-white font-bold rounded-full hover:shadow-lg transition-all">
            {t.signup}
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
            {t.welcomeTitle}
          </h2>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            
            <div className="relative">
              <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
              </span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder} className={`w-full ps-11 pe-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5ca393] focus:border-[#5ca393] outline-none transition-all text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`} dir="ltr" disabled={loading} />
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </span>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.passPlaceholder} className={`w-full ps-11 pe-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5ca393] focus:border-[#5ca393] outline-none transition-all text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`} dir="ltr" disabled={loading} />
            </div>

            <div className={`flex items-center mt-4 ${lang === 'ar' ? 'flex-row-reverse justify-end' : ''}`}>
              <input 
                type="checkbox" 
                id="remember" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#5ca393] bg-gray-100 border-gray-300 rounded focus:ring-[#5ca393] cursor-pointer"
              />
              <label htmlFor="remember" className={`mx-2 text-sm font-medium text-gray-600 cursor-pointer ${lang === 'ar' ? 'text-right' : ''}`}>
                {t.rememberMe}
              </label>
            </div>

            <button type="submit" disabled={loading} className={`w-full py-3.5 text-white font-bold text-lg rounded-xl transition-all transform shadow-md mt-6 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#5ca393] to-[#458b7c] hover:scale-[1.02] hover:shadow-lg'}`}>
              {t.loginBtn}
            </button>
          </form>

          <div className="mt-8 text-center text-gray-600 font-medium text-sm">
            {t.noAccount} {' '}
            <Link to="/signup" className="text-[#5ca393] font-bold hover:underline">
              {t.signupHere}
            </Link>
          </div>

        </div>
      </div>

    </div>
  );
};

export default LoginPage;