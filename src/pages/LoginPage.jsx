// بنعمل import للحاجات اللي هنحتاجها في الصفحة دي.
// React: دي الأداة الأساسية اللي بنبني بيها الصفحة.
// useState: عشان نعمل مساحات تخزين صغيرة (مخازن) للبيانات اللي اليوزر بيكتبها.
// useEffect: دي أداة بتخلينا ننفذ كود معين "أول ما الصفحة تفتح"، وهنستخدمها عشان نشوف لو اليوزر كان مختار "تذكرني" قبل كده.
// Link و useNavigate: عشان ننقل اليوزر بين الصفحات (مثلاً لو معندوش حساب نوديه لصفحة التسجيل).
// logo: لوجو الموقع.
// supabase: الوسيط اللي بيكلم قاعدة البيانات عشان يتأكد إن الإيميل والباسورد صح.
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { supabase } from '../services/supabaseClient';

// دي الدالة أو المكون الأساسي لصفحة تسجيل الدخول (LoginPage).
const LoginPage = () => {
  // بنجهز أداة الـ navigate عشان نستخدمها بعدين في توجيه اليوزر لصفحة تانية (الصفحة الرئيسية أو لوحة التحكم).
  const navigate = useNavigate();
  
  // مخزن لحفظ اللغة الحالية (الافتراضي إنجليزي 'en').
  const [lang, setLang] = useState('en');
  
  // مخازن لحفظ الإيميل والباسورد اللي اليوزر بيكتبهم.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // مخزن عشان نعرف اليوزر علّم على مربع "تذكرني" ولا لأ (الافتراضي بتاعه false يعني مش متعلم عليه).
  const [rememberMe, setRememberMe] = useState(false); 
  
  // مخزن لرسائل الخطأ، لو الإيميل أو الباسورد غلط بنحط الرسالة هنا عشان تظهر لليوزر.
  const [errorMsg, setErrorMsg] = useState('');
  
  // مخزن لحالة "التحميل"، عشان نوقف زرار الدخول لحد ما السيرفر يرد علينا.
  const [loading, setLoading] = useState(false);

  // الـ useEffect دي بتشتغل "مرة واحدة بس" أول ما الصفحة تفتح.
  // بنستخدمها هنا عشان ندوّر في ذاكرة المتصفح (localStorage) على حاجة اسمها 'unihome_saved_email'.
  // لو لقينا إيميل متسجل هناك (معناها إن اليوزر كان مختار "تذكرني" آخر مرة دخل فيها)، 
  // بنقوم واخدين الإيميل ده وحاطينه في الخانة جاهز (setEmail)، وبنخلي مربع "تذكرني" متعلم عليه (setRememberMe).
  useEffect(() => {
    const savedEmail = localStorage.getItem('unihome_saved_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // ده قاموس الترجمة بتاع الصفحة، فيه كل النصوص بالإنجليزي والعربي.
  // عشان لما اليوزر يغير اللغة، الكلام كله يتغير معاه في نفس اللحظة.
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

  // المتغير t ده هياخد النصوص من القاموس بناءً على اللغة اللي اليوزر مختارها، عشان نستخدمه بسهولة تحت.
  const t = content[lang];
  // دي صورة الخلفية بتاعت الصفحة.
  const heroImage = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";

  // دي الدالة اللي بتشتغل لما اليوزر يدوس على زرار "تسجيل الدخول".
  const handleLogin = async (e) => {
    // بنمنع المتصفح إنه يعمل ريفريش للصفحة عشان البيانات متمسحش.
    e.preventDefault();
    // بنمسح أي رسائل خطأ قديمة كانت ظاهرة قبل كده.
    setErrorMsg('');
    // بنشغل حالة التحميل عشان الزرار شكله يتغير واليوزر ميعرفش يدوس عليه تاني.
    setLoading(true);

    try {
      // بنبعت الإيميل والباسورد لـ supabase عشان يتأكد هل هما صح وموجودين في النظام ولا لأ.
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      // لو حصل خطأ (يعني الإيميل أو الباسورد غلط، أو الحساب مش موجود):
      if (error) {
        // بنطلع رسالة الخطأ من القاموس (t.invalidLogin) وبنعرضها لليوزر.
        setErrorMsg(t.invalidLogin);
        // بنقفل حالة التحميل عشان اليوزر يقدر يجرب تاني، وبنوقف الدالة بـ return.
        setLoading(false);
        return;
      }

      // لو الدخول نجح وعدينا من الخطأ اللي فوق، بنروح نشوف اليوزر كان معلّم على "تذكرني" ولا لأ.
      if (rememberMe) {
        // لو معلّم عليها: بنحفظ الإيميل بتاعه في ذاكرة المتصفح (localStorage) عشان نلاقيه المرة الجاية.
        localStorage.setItem('unihome_saved_email', email); 
      } else {
        // لو مش معلّم عليها: بنمسح الإيميل من ذاكرة المتصفح لو كان متسجل قبل كده، عشان ميتذكرش المرة الجاية.
        localStorage.removeItem('unihome_saved_email'); 
      }

      // هنا بنعمل خطوة تأكيد أخيرة، لو فعلاً الدخول تم وفي بيانات يوزر رجعت:
      if (data.user) {
        // بنعمل استعلام (سؤال) لقاعدة البيانات: هل اليوزر اللي دخل ده موجود في جدول الإدمن (admins) ولا لأ؟
        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('auth_id', data.user.id)
          .single();

        // لو لقيناه في جدول الإدمن (يعني ده مدير النظام):
        if (adminData) {
          // بنوديه على صفحة لوحة تحكم الإدمن (/admin).
          navigate('/admin');
        } else {
          // لو ملقيناهوش (يعني ده طالب عادي):
          // بنوديه على الصفحة الرئيسية العادية بتاعت الطلاب (/).
          navigate('/');
        }
      }
    } catch (err) {
      // لو حصل أي مشكلة في النت أو السيرفر وقع، بنمسك الخطأ ده هنا ونطلع رسالة عامة إن فيه مشكلة في الاتصال.
      setErrorMsg("حدث خطأ في الاتصال بالخادم.");
    } finally {
      // في الآخر خالص، سواء دخل بنجاح أو حصل خطأ، بنطفي حالة التحميل عشان الزرار يرجع لطبيعته.
      setLoading(false);
    }
  };

  // من أول هنا بيبدأ التصميم اللي اليوزر بيشوفه بعينيه على الشاشة.
  return (
    // الغلاف الخارجي للصفحة، بيحدد اتجاه النص (يمين أو شمال) بناءً على اللغة المختارة.
    <div className={`min-h-screen relative flex flex-col ${lang === 'en' ? 'font-en' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* الشريط العلوي (الناف بار) اللي فيه اللوجو وزرار تغيير اللغة وزرار "حساب جديد" */}
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

      {/* صورة الخلفية بتاعة الصفحة وعليها طبقة لون أزرق غامق شفافة شوية عشان تبين الكلام والفورمة */}
      <div className="absolute inset-0 z-0 overflow-hidden mt-[85px]">
        <img src={heroImage} alt="Background" className="w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-[#1b2a47]/40 backdrop-blur-md"></div>
      </div>

      {/* ده المربع الأبيض الأساسي اللي في النص اللي جواه الفورمة كلها */}
      <div className="relative z-10 flex-grow flex items-center justify-center px-4 pt-28 pb-12 mt-[85px]">
        <div className="bg-white rounded-[2rem] p-8 md:p-10 w-full max-w-md shadow-2xl text-center">
          
          <img src={logo} alt="UniHome Logo" className="h-16 mx-auto mb-4 object-contain" />

          {/* العنوان الترحيبي اللي بييجي من قاموس الترجمة */}
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1b2a47] mb-8">
            {t.welcomeTitle}
          </h2>

          {/* المكان اللي بتظهر فيه رسالة الخطأ (لو الإيميل أو الباسورد طلعوا غلط مثلاً)
              لو مفيش خطأ، المربع الأحمر ده مش بيترسم أساساً.
          */}
          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-xl text-center">
              {errorMsg}
            </div>
          )}

          {/* دي الفورمة الأساسية. لما اليوزر يدوس على زرار الدخول، هتشغل الدالة handleLogin اللي شرحناها فوق. */}
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            
            {/* خانة الإيميل: 
                مربوطة بالمخزن email، ولما اليوزر يكتب بتحدث المخزن دايركت بـ setEmail.
            */}
            <div className="relative">
              <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder} className={`w-full ps-11 pe-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5ca393] focus:border-[#5ca393] outline-none transition-all text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`} dir="ltr" disabled={loading} />
            </div>

            {/* خانة الباسورد: 
                مربوطة بالمخزن password. نوعها password عشان تخفي الحروف.
            */}
            <div className="relative">
              <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </span>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.passPlaceholder} className={`w-full ps-11 pe-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5ca393] focus:border-[#5ca393] outline-none transition-all text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`} dir="ltr" disabled={loading} />
            </div>

            {/* ده مربع اختيار "تذكرني" (Checkbox).
                مربوط بالمخزن rememberMe، لو اتعلم عليه بيبقى true، لو اتشال بيبقى false.
                واتجاه المربع والكلمة بيتغير بناءً على اللغة (عربي أو إنجليزي).
            */}
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

            {/* ده زرار الفورمة الأساسي اللي بيعمل "تسجيل الدخول".
                لونه بيتغير لرمادي ويتقفل لو الـ loading شغال (يعني بنكلم السيرفر)، 
                ولما بيخلص بيرجع أخضر وشغال.
            */}
            <button type="submit" disabled={loading} className={`w-full py-3.5 text-white font-bold text-lg rounded-xl transition-all transform shadow-md mt-6 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#5ca393] to-[#458b7c] hover:scale-[1.02] hover:shadow-lg'}`}>
              {t.loginBtn}
            </button>
          </form>

          {/* ده اللينك اللي تحت الفورمة اللي بيودي اليوزر لصفحة "إنشاء حساب" لو هو معندوش حساب أصلاً. */}
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

// بنصدر المكون (LoginPage) عشان نقدر نستخدمه في أي مكان تاني في المشروع.
export default LoginPage;