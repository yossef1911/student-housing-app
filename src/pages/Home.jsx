import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { supabase } from '../services/supabaseClient';

// المكون الرئيسي للصفحة الافتتاحية (Home) لعرض الواجهة الترحيبية والتحقق من جلسة المستخدم
const Home = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // التحقق من حالة تسجيل الدخول ومراقبة أي تغييرات في الجلسة (Session)
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // معالجة تسجيل الخروج وتوجيه المستخدم
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false); 
    navigate('/');
  };

  const content = {
    en: {
      toggleLang: "عربي",
      login: "Login",
      signup: "Sign Up",
      logout: "Logout",
      myBookings: "My Bookings",
      welcomeNav: "Welcome",
      heroTitle: "Find Your Perfect Student Home",
      heroSubtitle: "Experience comfort and community at UniHome. Book your room for the upcoming academic term today.",
      browseBtn: "Browse Rooms",
    },
    ar: {
      toggleLang: "English",
      login: "دخول",
      signup: "حساب جديد",
      logout: "تسجيل خروج",
      myBookings: "حجوزاتي",
      welcomeNav: "مرحباً",
      heroTitle: "اكتشف سكنك الجامعي المثالي",
      heroSubtitle: "عش تجربة الراحة والمجتمع في UniHome. احجز غرفتك للفصل الدراسي القادم الآن.",
      browseBtn: "تصفح الغرف",
    }
  };

  const t = content[lang];
  const heroImage = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";
  const userName = user?.user_metadata?.full_name || '';

  return (
    <div className={`min-h-screen relative flex flex-col ${lang === 'en' ? 'font-en' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      <nav className="fixed top-0 left-0 w-full bg-white px-4 md:px-12 py-3 z-50 shadow-sm" dir="ltr">
        <div className="flex justify-between items-center relative">
          
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer shrink-0" onClick={() => navigate('/')}>
            <img src={logo} alt="UniHome Logo" className="h-10 sm:h-12 md:h-16 lg:h-20 object-contain" />
            <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1b2a47] font-en tracking-tight">
              UniHome
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 shrink-0">
            <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="text-base text-gray-500 hover:text-[#1b2a47] font-bold transition-colors">
              {t.toggleLang}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/profile')} className="text-[#1b2a47] font-bold hover:scale-105 transition-transform cursor-pointer">
                  {t.welcomeNav}, <span className="text-[#5ca393] underline decoration-2 underline-offset-4">{userName}</span>
                </button>
                <button onClick={() => navigate('/my-bookings')} className="text-[#1b2a47] font-bold hover:text-[#5ca393] transition-colors">
                  {t.myBookings}
                </button>
                <button onClick={handleLogout} className="px-5 py-2 border-2 border-red-500 text-red-500 font-bold rounded-full hover:bg-red-500 hover:text-white transition-all">
                  {t.logout}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-[#1b2a47] font-bold hover:text-[#5ca393] transition-colors">
                  {t.login}
                </Link>
                <Link to="/signup" className="px-8 py-2.5 bg-gradient-to-r from-[#5ca393] to-[#458b7c] text-white font-bold rounded-full hover:shadow-lg transition-all">
                  {t.signup}
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-4">
            <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="text-sm text-gray-500 hover:text-[#1b2a47] font-bold transition-colors">
              {t.toggleLang}
            </button>
            
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[#1b2a47] focus:outline-none p-1">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
              </svg>
            </button>
          </div>

        </div>

        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-xl flex flex-col p-5 gap-4 z-50 transition-all">
            {user ? (
              <>
                <button 
                  onClick={() => { setIsMenuOpen(false); navigate('/profile'); }} 
                  className="pb-3 border-b border-gray-100 text-center w-full hover:bg-gray-50 transition-colors rounded-lg cursor-pointer"
                >
                <span className="text-gray-500 block mb-1">{t.welcomeNav}</span>
                <span className="text-lg font-extrabold text-[#5ca393] underline decoration-2 underline-offset-4">{userName}</span>
                </button>
                <button onClick={() => { setIsMenuOpen(false); navigate('/my-bookings'); }} className="py-2 text-[#1b2a47] font-bold text-center hover:bg-gray-50 rounded-lg">
                  {t.myBookings}
                </button>
                <button onClick={handleLogout} className="mt-2 py-3 border-2 border-red-500 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors w-full">
                  {t.logout}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="py-3 text-[#1b2a47] font-bold text-center border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  {t.login}
                </Link>
                <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="py-3 bg-gradient-to-r from-[#5ca393] to-[#458b7c] text-white font-bold text-center rounded-xl shadow-md">
                  {t.signup}
                </Link>
              </>
            )}
          </div>
        )}
      </nav>

      <div className="absolute inset-0 z-0 overflow-hidden mt-[85px]">
        <img src={heroImage} alt="Background" className="w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-[#1b2a47]/60 backdrop-blur-sm"></div>
      </div>

      <div className="relative z-10 flex-grow flex items-center justify-center text-center px-4 mt-[85px]">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-lg leading-tight">
            {t.heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-10 drop-shadow-md max-w-2xl mx-auto">
            {t.heroSubtitle}
          </p>
          <button onClick={() => navigate('/rooms')} className="px-8 py-4 text-lg bg-gradient-to-r from-[#5ca393] to-[#458b7c] text-white font-bold rounded-full hover:scale-105 hover:shadow-xl transition-all transform duration-300">
            {t.browseBtn}
          </button>
        </div>
      </div>

    </div>
  );
};

export default Home;