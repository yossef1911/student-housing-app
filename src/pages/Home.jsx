// بنجيب الأدوات الأساسية من مكتبة React عشان نبني الصفحة.
// بنحتاج هنا useState عشان نعمل مخازن للبيانات، و useEffect عشان ننفذ حاجات أول ما الصفحة تفتح.
import React, { useState, useEffect } from 'react';
// بنجيب الأدوات اللي بتخلينا نتنقل بين الصفحات في الموقع.
import { Link, useNavigate } from 'react-router-dom';
// بنجيب لوجو الموقع.
import logo from '../assets/logo.png';
// بنجيب أداة الاتصال بقاعدة البيانات عشان نشوف مين اللي مسجل دخول.
import { supabase } from '../services/supabaseClient';

// دي الدالة الرئيسية للصفحة (Home) اللي بتجمع كل حاجة مع بعضها.
const Home = () => {
  // بنجهز أداة التنقل عشان لو حبينا نودي اليوزر لصفحة تانية زي صفحة الغرف أو البروفايل.
  const navigate = useNavigate();
  
  // مخزن للغة، والافتراضي بتاعه هو الإنجليزي 'en'.
  const [lang, setLang] = useState('en');
  
  // مخزن لبيانات المستخدم. لو اليوزر مسجل دخول، هنحط بياناته هنا. لو مش مسجل، بيفضل null (فاضي).
  const [user, setUser] = useState(null);
  
  // مخزن عشان نعرف هل القائمة الجانبية في الموبايل (اللي بتفتح من الزرار الصغير) مفتوحة ولا مقفولة. 
  // الافتراضي مقفولة (false).
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // الـ useEffect دي بتشتغل أول ما الصفحة تحمل. 
  // بنستخدمها عشان نسأل النظام: هو فيه حد مسجل دخول دلوقتي ولا لأ؟
  useEffect(() => {
    // عملنا دالة صغيرة اسمها checkUser بتسأل supabase عن الـ session (الجلسة الحالية).
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // لو فيه جلسة شغالة (يعني اليوزر مسجل دخول)، بناخد بيانات اليوزر ونحطها في مخزن الـ user.
      if (session) {
        setUser(session.user);
      }
    };
    
    // بنشغل الدالة دي هنا.
    checkUser();

    // هنا بنقول لـ supabase: "خليك مصحصح معايا، لو حالة اليوزر اتغيرت (عمل تسجيل خروج مثلاً أو دخل بحساب تاني)، بلّغني فوراً".
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // ولما الحالة تتغير، بنحدث مخزن الـ user بالبيانات الجديدة (أو بنخليه فاضي لو عمل خروج).
      setUser(session?.user || null);
    });

    // السطر ده بينضف ورا الـ useEffect لما اليوزر يسيب الصفحة، عشان ميفضلش يتنصت على التغييرات على الفاضي ويسحب من أداء المتصفح.
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // القوسين الفاضيين دول معناهم "شغل الـ useEffect دي مرة واحدة بس لما الصفحة تفتح".

  // دي الدالة اللي بتشتغل لما اليوزر يدوس على زرار "تسجيل خروج".
  const handleLogout = async () => {
    // بنقول لـ supabase يقفل جلسة اليوزر.
    await supabase.auth.signOut();
    // بنقفل القائمة بتاعة الموبايل لو كانت مفتوحة.
    setIsMenuOpen(false); 
    // وبنرجعه للصفحة الرئيسية (رغم إنه فيها أصلاً، بس عشان نضمن إن الصفحة تعمل ريفريش لبياناتها).
    navigate('/');
  };

  // ده القاموس بتاعنا اللي فيه كل الكلام المكتوب في الصفحة بالعربي والإنجليزي.
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

  // بنختار القاموس المناسب حسب اللغة اللي متخزنة في 'lang'.
  const t = content[lang];
  // دي الصورة الحلوة اللي بتظهر في خلفية الصفحة.
  const heroImage = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";
  
  // هنا بنحاول نجيب اسم اليوزر من البيانات بتاعته. 
  // بنقوله: "لو فيه يوزر موجود، خش على بياناته الميتاداتا، وهاتلي اسمه الكامل. لو مفيش، خليها فاضية".
  const userName = user?.user_metadata?.full_name || '';

  // من أول الـ return ده الشكل اللي اليوزر بيشوفه بعينيه على الشاشة.
  return (
    // الغلاف الخارجي للصفحة كلها، بيظبط الاتجاه (يمين ولا شمال) حسب اللغة.
    <div className={`min-h-screen relative flex flex-col ${lang === 'en' ? 'font-en' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* ده الشريط العلوي (الناف بار) اللي بيفضل ثابت فوق في الصفحة */}
      <nav className="fixed top-0 left-0 w-full bg-white px-4 md:px-12 py-3 z-50 shadow-sm" dir="ltr">
        <div className="flex justify-between items-center relative">
          
          {/* الجزء بتاع اللوجو والاسم، ولما بتدوس عليه بيرجعك للصفحة الرئيسية */}
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer shrink-0" onClick={() => navigate('/')}>
            <img src={logo} alt="UniHome Logo" className="h-10 sm:h-12 md:h-16 lg:h-20 object-contain" />
            <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1b2a47] font-en tracking-tight">
              UniHome
            </span>
          </div>

          {/* ================== دي القائمة اللي بتظهر لو اليوزر فاتح من كمبيوتر أو لابتوب (شاشة كبيرة) ================== */}
          {/* الـ hidden md:flex معناها إنها مخفية في الشاشات الصغيرة، وبتظهر بس من أول مقاس الـ md (شاشات متوسطة وكبيرة). */}
          <div className="hidden md:flex items-center gap-6 shrink-0">
            {/* زرار تغيير اللغة */}
            <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="text-base text-gray-500 hover:text-[#1b2a47] font-bold transition-colors">
              {t.toggleLang}
            </button>

            {/* هنا بنعمل شرط مهم: هل اليوزر مسجل دخول؟ (يعني هل مخزن الـ user جواه بيانات؟) */}
            {user ? (
              // لو الإجابة "آه مسجل دخول"، هنظهرله الزراير دي:
              <div className="flex items-center gap-4">
                {/* زرار بيرحب بيه باسمه وبياخده لصفحة البروفايل */}
                <button onClick={() => navigate('/profile')} className="text-[#1b2a47] font-bold hover:scale-105 transition-transform cursor-pointer">
                  {t.welcomeNav}, <span className="text-[#5ca393] underline decoration-2 underline-offset-4">{userName}</span>
                </button>
                {/* زرار بيوديه لصفحة حجوزاته */}
                <button onClick={() => navigate('/my-bookings')} className="text-[#1b2a47] font-bold hover:text-[#5ca393] transition-colors">
                  {t.myBookings}
                </button>
                {/* زرار تسجيل الخروج */}
                <button onClick={handleLogout} className="px-5 py-2 border-2 border-red-500 text-red-500 font-bold rounded-full hover:bg-red-500 hover:text-white transition-all">
                  {t.logout}
                </button>
              </div>
            ) : (
              // لو الإجابة "لأ مش مسجل دخول"، هنظهرله الزراير دي بدالها:
              <div className="flex items-center gap-3">
                {/* زرار تسجيل الدخول */}
                <Link to="/login" className="text-[#1b2a47] font-bold hover:text-[#5ca393] transition-colors">
                  {t.login}
                </Link>
                {/* زرار إنشاء حساب جديد */}
                <Link to="/signup" className="px-8 py-2.5 bg-gradient-to-r from-[#5ca393] to-[#458b7c] text-white font-bold rounded-full hover:shadow-lg transition-all">
                  {t.signup}
                </Link>
              </div>
            )}
          </div>

          {/* ================== دي القائمة اللي بتظهر لو اليوزر فاتح من موبايل ================== */}
          {/* الـ md:hidden معناها إنها بتظهر في الموبايل بس ومخفية في الشاشات الكبيرة */}
          <div className="md:hidden flex items-center gap-4">
            {/* زرار تغيير اللغة بتاع الموبايل */}
            <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="text-sm text-gray-500 hover:text-[#1b2a47] font-bold transition-colors">
              {t.toggleLang}
            </button>
            
            {/* زرار القائمة الجانبية (الأيقونة اللي بتبقى تلات شرط فوق بعض). 
                لما بتدوس عليه بيعكس حالة isMenuOpen، لو كانت مقفولة بيفتحها ولو مفتوحة يقفلها.
            */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[#1b2a47] focus:outline-none p-1">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {/* ده كود بيرسم الأيقونة.. لو القائمة مفتوحة بيرسم علامة (X)، لو مقفولة بيرسم علامة (≡) التلات شرط */}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
              </svg>
            </button>
          </div>

        </div>

        {/* دي نافذة القائمة نفسها اللي بتنزل من فوق في الموبايل. 
            ومش هتظهر أصلاً إلا لو اليوزر داس على الزرار بتاع التلات شرط (يعني isMenuOpen قيمته true).
        */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 shadow-xl flex flex-col p-5 gap-4 z-50 transition-all">
            {/* برضه بنعمل نفس الشرط هنا: هو مسجل دخول ولا لأ؟ عشان نعرضله الزراير الصح في الموبايل. */}
            {user ? (
              // لو مسجل دخول بنعرض: الترحيب باسمه، حجوزاته، وتسجيل الخروج.
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
              // لو مش مسجل بنعرض: تسجيل الدخول وحساب جديد.
              // ولاحظ إننا بنعمل setIsMenuOpen(false) لما اليوزر يدوس على أي لينك، عشان القائمة تتقفل وتختفي بعد ما يختار.
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

      {/* ده القسم الأول والأهم في الصفحة (Hero Section).
          هنا بنحط صورة الخلفية اللي مالية الشاشة وبنحط فوقها طبقة زرقا غامقة مضللة شوية عشان تبرز الكلام المكتوب.
      */}
      <div className="absolute inset-0 z-0 overflow-hidden mt-[85px]">
        <img src={heroImage} alt="Background" className="w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-[#1b2a47]/60 backdrop-blur-sm"></div>
      </div>

      {/* ده النص الكبير اللي في نص الشاشة وزرار "تصفح الغرف". */}
      <div className="relative z-10 flex-grow flex items-center justify-center text-center px-4 mt-[85px]">
        <div className="max-w-3xl">
          {/* العنوان الرئيسي الكبير */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-lg leading-tight">
            {t.heroTitle}
          </h1>
          {/* النص الوصفي اللي تحته */}
          <p className="text-lg md:text-xl text-gray-200 mb-10 drop-shadow-md max-w-2xl mx-auto">
            {t.heroSubtitle}
          </p>
          {/* الزرار الكبير اللي بياخد اليوزر لصفحة الغرف عشان يبدأ يتفرج ويحجز. */}
          <button onClick={() => navigate('/rooms')} className="px-8 py-4 text-lg bg-gradient-to-r from-[#5ca393] to-[#458b7c] text-white font-bold rounded-full hover:scale-105 hover:shadow-xl transition-all transform duration-300">
            {t.browseBtn}
          </button>
        </div>
      </div>

    </div>
  );
};

// بنصدر الصفحة كلها عشان نقدر نستخدمها كالصفحة الرئيسية في الموقع.
export default Home;