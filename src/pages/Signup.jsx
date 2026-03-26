// بنعمل import للحاجات اللي هنحتاجها في الصفحة.
// React و useState عشان نقدر نعمل مساحات تخزين صغيرة في الذاكرة نحفظ فيها البيانات اللي اليوزر بيكتبها.
// Link و useNavigate عشان نقدر ننقل اليوزر من الصفحة دي لصفحة تانية (زي صفحة تسجيل الدخول مثلا).
// logo ده اللوجو بتاع الموقع اللي هيتعرض في الصفحة.
// supabase ده الوسيط أو الأداة اللي بتخلي الكود بتاعنا يكلم قاعدة البيانات عشان نسجل بيانات اليوزر الجديد.
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { supabase } from '../services/supabaseClient';

// دي الدالة أو المكون الأساسي لصفحة إنشاء الحساب واللي شايلة كل الشغل بتاعنا.
const Signup = () => {
  // هنا بنجهز أداة اسمها navigate عشان نستخدمها بعدين لما نحب نوجه اليوزر لصفحة تانية بعد ما يخلص تسجيل.
  const navigate = useNavigate();
  
  // السطور اللي جاية دي كلها عبارة عن مخازن صغيرة (variables) بنعملها بـ useState عشان نحفظ فيها أي حاجة اليوزر بيعملها في الصفحة.
  // lang: ده مخزن بنحفظ فيه اللغة اللي اليوزر مختارها (الافتراضي إنجليزي 'en').
  const [lang, setLang] = useState('en');
  
  // name: بنحفظ فيه اسم اليوزر اللي هيكتبه في الفورمة.
  const [name, setName] = useState('');
  // studentId: بنحفظ فيه الرقم الجامعي.
  const [studentId, setStudentId] = useState('');
  // email: بنحفظ فيه الإيميل.
  const [email, setEmail] = useState('');
  // password و confirmPassword: بنحفظ فيهم الباسورد وتأكيد الباسورد عشان نقارنهم ببعض قبل ما نبعتهم لقاعدة البيانات.
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // errorMsg: ده مخزن بنحط فيه أي رسالة خطأ تحصل (زي مثلا لو الباسورد مش متطابق)، عشان نعرضها لليوزر يقراها ويصلح غلطته.
  const [errorMsg, setErrorMsg] = useState('');
  // loading: ده مخزن بنحفظ فيه حالة "التحميل". أول ما اليوزر يدوس على زرار التسجيل بنخليها true عشان نوقف الزرار وميدوسش مرتين ورا بعض لحد ما السيرفر يرد علينا.
  const [loading, setLoading] = useState(false);

  // showSuccessModal: دي حالة بنحفظ فيها إحنا المفروض نظهر رسالة "تم التسجيل بنجاح" ولا لأ. لو قيمتها true هتظهر في نص الشاشة، لو false هتفضل مخفية.
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // هنا عملنا قاموس جواه كل الكلام اللي بيظهر في الصفحة باللغتين الإنجليزي والعربي.
  // قسمناهم لـ en للإنجليزي و ar للعربي.
  // فايدة ده إننا لما نحب نغير اللغة، الصفحة كلها بتتغير مرة واحدة من غير ما نحتاج نعمل صفحتين منفصلين.
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
      emailInUseError: "This email is already registered. Please login.",
      weakPasswordError: "Password must be at least 6 characters.",
      duplicateIdError: "This Student ID is already registered in our system.",
      generalError: "An unexpected error occurred. Please try again.",

      successTitle: "Registration Successful! 🎓",
      successText: "Welcome to UniHome. Your student account is ready. Please log in to start booking your accommodation.",
      btnGoLogin: "Login Now"
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
      emailInUseError: "هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول.",
      weakPasswordError: "كلمة المرور ضعيفة (يجب أن تتكون من 6 أحرف على الأقل).",
      duplicateIdError: "هذا الرقم الجامعي مسجل بالفعل في النظام.",
      generalError: "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.",

      successTitle: "تم التسجيل بنجاح! 🎓",
      successText: "مرحباً بك في سكن UniHome. حسابك الجامعي جاهز الآن. يرجى تسجيل الدخول للبدء في حجز غرفتك.",
      btnGoLogin: "تسجيل الدخول الآن"
    }
  };

  // المتغير t ده بياخد الكلام من القاموس بناءً على اللغة اللي اليوزر مختارها (lang) عشان يسهل علينا استخدامه تحت في الكود.
  const t = content[lang];
  // دي صورة الخلفية اللي هتتحط ورا الفورمة.
  const heroImage = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";

  // الدالة دي بتشتغل كل ما اليوزر يكتب حرف في خانة "الاسم".
  // بتعمل فلترة للكلام، يعني بتاخد اللي هو كتبه وتمسح منه أي أرقام أو حروف عربي وتسيب الحروف الإنجليزي والمسافات بس.
  // وبعد ما تنضف الكلام، بتحفظه في المخزن اللي اسمه name.
  const handleNameChange = (e) => {
    const englishOnlyName = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    setName(englishOnlyName);
  };

  // الدالة دي بتشتغل مع خانة "الرقم الجامعي".
  // بتمسح أي حروف أو رموز وتسيب الأرقام فقط.
  // وكمان فيها شرط، لو اليوزر حاول يكتب صفر في أول الرقم الجامعي، الدالة دي هتقف ومش هتحفظه، عشان مفيش رقم جامعي بيبدأ بصفر.
  const handleStudentIdChange = (e) => {
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    if (numericValue.startsWith('0')) return;
    setStudentId(numericValue);
  };

  // الدالة دي بتشتغل مع خانة "الإيميل".
  // بتمسح أي مسافات أو رموز غريبة، وبتسيب بس الحروف والأرقام وعلامات (@ . _ -) اللي بتستخدم في الإيميلات.
  // وأول ما اليوزر يبتدي يكتب أو يصلح إيميله، لو كان فيه رسالة خطأ ظاهرة، الدالة دي بتمسحها عشان تدي فرصة لليوزر يجرب تاني.
  const handleEmailChange = (e) => {
    const englishOnlyValue = e.target.value.replace(/[^a-zA-Z0-9@._-]/g, '');
    setEmail(englishOnlyValue);
    if(errorMsg) setErrorMsg('');
  };

  // دي بقى الدالة الكبيرة اللي بتشتغل لما اليوزر يدوس على زرار "إنشاء حساب".
  const handleSignup = async (e) => {
    // السطر ده بيمنع المتصفح إنه يعمل ريفريش (إعادة تحميل) للصفحة لما اليوزر يدوس على الزرار، عشان البيانات اللي كتبها متتمسحش ونضطر نبدأ من الأول.
    e.preventDefault();
    
    // هنا بنعمل شوية اختبارات (Validation) قبل ما نبعت أي حاجة لقاعدة البيانات:
    // 1. بنتأكد إن الإيميل بينتهي بـ @gmail.com بالظبط. لو لأ، بنحط رسالة خطأ في المخزن بتاع errorMsg ونعمل return عشان نوقف الدالة ومتكملش شغل.
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      setErrorMsg(t.gmailError);
      return; 
    }
    // 2. بنتأكد إن الباسورد اللي كتبه في أول خانة هو هو اللي كتبه في خانة التأكيد. لو مختلفين، بنطلع رسالة ونوقف الدالة.
    if (password !== confirmPassword) {
      setErrorMsg(t.matchError);
      return;
    }
    // 3. بنتأكد إن الرقم الجامعي اتكتب أصلاً، وإنه مش أقل من 6 أرقام. لو أقل، بنطلع رسالة خطأ ونوقف.
    if (!studentId || studentId.length < 6) {
      setErrorMsg(t.idLengthError);
      return;
    }

    // لو كل الاختبارات اللي فوق عدت على خير، بنمسح أي رسايل خطأ قديمة.
    setErrorMsg('');
    // وبنشغل وضع التحميل (بنخلي الـ loading بـ true) عشان نغير شكل الزرار ونمنع اليوزر يدوس عليه تاني وهو بيحمل.
    setLoading(true);

    // الـ try والـ catch بنستخدمهم لما نكون بنعمل حاجة ممكن تطلع خطأ (زي إننا نكلم سيرفر على النت). 
    // لو حصل خطأ بيخش في الـ catch بدل ما يوقع الصفحة كلها.
    try {
      // السطر ده بيكلم خدمة supabase (القسم الخاص بالتسجيل auth) وبيبعتلها الإيميل والباسورد والاسم.
      // وبيستنى الرد. الرد ده يا إما بيانات اليوزر (authData) يا إما خطأ (authError).
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: name,
          }
        }
      });

      // لو الرد رجع بـ خطأ (authError مش فاضي)، ده معناه إن السيرفر رفض العملية.
      // هنا بنمسك رسالة الخطأ اللي جاية من السيرفر بالانجليزي، ونشوفها بتتكلم عن إيه عشان نطلع لليوزر رسالة عربي واضحة.
      // لو الخطأ معناه إن الإيميل ده موجود قبل كده، بنطلع رسالة "البريد مسجل بالفعل".
      // لو الخطأ بيقول إن الباسورد ضعيف بنطلعله رسالة "كلمة المرور ضعيفة".
      // لو أي خطأ تاني غريب بنطلعه زي ما هو.
      if (authError) {
        const msg = authError.message.toLowerCase();
        if (msg.includes("already") || msg.includes("registered") || msg.includes("in use")) {
          setErrorMsg(t.emailInUseError);
        } else if (msg.includes("password") || msg.includes("at least")) {
          setErrorMsg(t.weakPasswordError);
        } else {
          setErrorMsg(t.generalError + " (" + authError.message + ")");
        }
        // وبنقفل وضع التحميل عشان نرجع الزرار يشتغل تاني ونعمل return عشان نوقف الدالة.
        setLoading(false);
        return;
      }

      // لو الحساب اتعمل بنجاح في نظام الدخول والمستخدم بقى موجود (authData.user).
      // بنروح للمرحلة التانية: نسجل بياناته في جدول اسم "الطلاب" (students) في قاعدة البيانات بتاعتنا.
      if (authData.user) {
        // بنبعت الرقم الجامعي، رقم الحساب (id)، الاسم، والإيميل للجدول.
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

        // لو حصل مشكلة واحنا بنسجل في الجدول ده (dbError مش فاضي):
        if (dbError) {
          // لو رقم الخطأ 23505، ده كود في قواعد البيانات معناه إن فيه حاجة متكررة (عشان احنا عاملين شرط إن مفيش طالبين يتسجلو بنفس الرقم الجامعي أو الايميل).
          if (dbError.code === '23505') {
            // لو الخطأ بسبب الإيميل بنقوله الإيميل متسجل، ولو بسبب الرقم الجامعي بنقوله الرقم الجامعي مسجل قبل كده.
            if (dbError.message && dbError.message.toLowerCase().includes('email')) {
              setErrorMsg(t.emailInUseError);
            } else {
              setErrorMsg(t.duplicateIdError);
            }
          } else {
            // لو خطأ تاني غير التكرار بنقوله حصل خطأ غير متوقع.
            setErrorMsg(t.generalError);
          }
          // وبنقفل التحميل ونوقف.
          setLoading(false);
          return;
        }

        // لو مفيش أي اخطاء خالص وكله تمام التمام، بنخلي مخزن showSuccessModal قيمته بـ true.
        // وده هيخلي رسالة "تم التسجيل بنجاح" تظهر لليوزر على الشاشة.
        setShowSuccessModal(true);
      }
    } catch (err) {
      // لو حصل كارثة (النت فصل عند اليوزر وهو بيسجل مثلا)، بيدخل هنا ونطلعله رسالة خطأ عامة.
      setErrorMsg(t.generalError);
    } finally {
      // الـ finally دي بتشتغل في آخر الدالة خالص سواء حصل أخطاء أو مفيش أخطاء.
      // كل وظيفتها إنها تطفي حالة التحميل عشان تفك الزرار والخانات ترجع تشتغل عادي.
      setLoading(false);
    }
  };

  // من أول سطر return ده، إحنا بنكتب شكل الصفحة والديزاين بتاعها اللي هيتعرض على الشاشة (بـ لغة اسمها JSX).
  return (
    // ده الغلاف الخارجي للصفحة كلها.
    // بيحدد اتجاه النص، لو اللغة المختارة (lang) هي عربي (ar) هيخلي الاتجاه يمين للشمال (rtl). ولو لا هيخليه شمال لليمين (ltr).
    // وكمان بيحدد نوع الخط بناء على اللغة.
    <div className={`min-h-screen relative flex flex-col ${lang === 'en' ? 'font-en' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* ده الجزء الخاص بنافذة التهنئة بالنجاح.
        الجزء ده مش بيترسم ولا بيظهر في الشاشة أساساً إلا لو متغير showSuccessModal كان بـ true.
        جواه علامة الصح الخضراء، والرسالة، وزرار بياخد اليوزر ويوديه لصفحة تسجيل الدخول (/login).
      */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-down text-center p-8 border-t-8 border-green-500">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 className="text-2xl font-extrabold text-[#1b2a47] mb-2">{t.successTitle}</h3>
            <p className="text-gray-500 font-bold mb-8">{t.successText}</p>
            <button onClick={() => navigate('/login')} className="w-full py-3 bg-[#5ca393] text-white font-bold rounded-xl hover:bg-[#458b7c] shadow-md transition-colors">
              {t.btnGoLogin}
            </button>
          </div>
        </div>
      )}

      {/* ده الشريط العلوي (الناف بار) اللي بيفضل ثابت فوق.
        جواه اللوجو بتاع الموقع على جنب، وعلى الجنب التاني فيه زرار تغيير اللغة، وزرار بيودي على صفحة تسجيل الدخول.
      */}
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

      {/* دي صورة الخلفية اللي بتملا الشاشة ورا الفورمة. 
        ومحطوط فوقها طبقة لون أزرق غامق وشفافة شوية (backdrop-blur) عشان تعمل تأثير ضبابي والصورة متغطيش على وضوح الكلام.
      */}
      <div className="absolute inset-0 z-0 overflow-hidden mt-[85px]">
        <img src={heroImage} alt="Background" className="w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 bg-[#1b2a47]/40 backdrop-blur-md"></div>
      </div>

      {/* ده الحاوي الأبيض (المربع الأساسي اللي في النص) اللي جواه الفورمة وكل خانات التسجيل. 
      */}
      <div className="relative z-10 flex-grow flex items-center justify-center px-4 pt-28 pb-12 mt-[85px]">
        <div className="bg-white rounded-[2rem] p-8 md:p-10 w-full max-w-md shadow-2xl text-center">
          
          <img src={logo} alt="UniHome Logo" className="h-16 mx-auto mb-4 object-contain" />

          {/* العنوان الأساسي للفورمة اللي بييجي من قاموس الترجمة (مثلا: انضم إلى مجتمع UniHome) */}
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#1b2a47] mb-8">
            {t.joinTitle}
          </h2>

          {/* لو كان مخزن errorMsg جواه أي كلام (يعني حصل خطأ)، هنرسم المربع الأحمر الصغير ده ونكتب جواه رسالة الخطأ. 
            لو المخزن فاضي المربع ده مش هيظهر أساساً.
          */}
          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-bold rounded-xl text-center shadow-sm">
              {errorMsg}
            </div>
          )}

          {/* دي الفورمة نفسها. لما اليوزر يدوس على زرار "إنشاء حساب" (اللي نوعه submit)،
            الفورمة هتنادي على الدالة handleSignup اللي إحنا كتبناها فوق وتنفذها.
          */}
          <form onSubmit={handleSignup} className="space-y-4 text-left">
            
            {/* خانة الاسم: 
              مربوطة بالمخزن name عشان تعرض اللي جواه.
              لما اليوزر يكتب حاجة (onChange)، بتنادي على الدالة handleNameChange عشان تفلتر الحروف.
              الـ disabled={loading} معناها لو الصفحة بتحمل بيانات، الخانة دي تتقفل عشان اليوزر ميعرفش يعدل فيها.
            */}
            <div className="relative">
              <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </span>
              <input type="text" required value={name} onChange={handleNameChange} placeholder={t.namePlaceholder} className={`w-full ps-11 pe-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5ca393] focus:border-[#5ca393] outline-none transition-all text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`} dir="ltr" disabled={loading} />
            </div>

            {/* خانة الرقم الجامعي: 
              مربوطة بـ studentId، وبتستخدم الدالة handleStudentIdChange عشان تمنع أي حروف وتسمح بالأرقام بس زي ما شرحنا. 
            */}
            <div className="relative">
              <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
              </span>
              <input type="text" required value={studentId} onChange={handleStudentIdChange} placeholder={t.idPlaceholder} className={`w-full ps-11 pe-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5ca393] focus:border-[#5ca393] outline-none transition-all text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`} dir="ltr" disabled={loading} />
            </div>

            {/* خانة الإيميل: 
              نوعها email عشان المتصفح نفسه يتأكد إن فيها علامة الـ @. 
              ومربوطة بـ الدالة اللي بتفلتر الإيميل handleEmailChange. 
            */}
            <div className="relative">
              <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </span>
              <input type="email" required value={email} onChange={handleEmailChange} placeholder={t.emailPlaceholder} className={`w-full ps-11 pe-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5ca393] focus:border-[#5ca393] outline-none transition-all text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`} dir="ltr" disabled={loading} />
            </div>

            {/* خانة الباسورد: 
              نوعها password عشان الكلام اللي بيتكتب يتحول لنجوم أو نقط سودة ومحدش يشوفه. 
              ولما اليوزر يكتب حاجة بتتحفظ دايركت في المخزن password.
            */}
            <div className="relative">
              <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </span>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.passPlaceholder} className={`w-full ps-11 pe-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5ca393] focus:border-[#5ca393] outline-none transition-all text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`} dir="ltr" disabled={loading} />
            </div>

            {/* خانة تأكيد الباسورد: 
              نفس فكرة خانة الباسورد بالظبط، وبتحفظ الكلام في المخزن التاني confirmPassword عشان بعدين نقارنهم ببعض. 
            */}
            <div className="relative">
              <span className="absolute inset-y-0 start-0 flex items-center ps-4 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </span>
              <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t.confirmPassPlaceholder} className={`w-full ps-11 pe-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#5ca393] focus:border-[#5ca393] outline-none transition-all text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`} dir="ltr" disabled={loading} />
            </div>

            {/* ده زرار الفورمة الأساسي اللي بينفذ عملية التسجيل.
              لونه وشكله وكلامه بيتغير لو حالة الـ loading شغالة بيبقى لونه رمادي ومقفول.
              ولو مش شغالة بيبقى لونه أخضر وشغال عادي.
            */}
            <button type="submit" disabled={loading} className={`w-full py-3.5 text-white font-bold text-lg rounded-xl transition-all transform shadow-md mt-6 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#5ca393] to-[#458b7c] hover:scale-[1.02] hover:shadow-lg'}`}>
              {t.createAccBtn}
            </button>
          </form>

          {/* في آخر الفورمة خالص، ده مجرد لينك صغير بياخد اليوزر لصفحة تسجيل الدخول لو هو اكتشف إن عنده حساب فعلاً ومش محتاج يعمل واحد جديد. 
          */}
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

// هنا بنصدر المكون (Signup) ده عشان أي مكان تاني في المشروع يقدر يعمل له استيراد ويستخدمه جواه.
export default Signup;