// بنجيب الأدوات الأساسية من React (مساحات التخزين والدوال اللي بتشتغل أول ما الصفحة تفتح).
import React, { useState, useEffect } from 'react';
// بنجيب أداة التنقل عشان لو حبينا ننقل الطالب لصفحة تسجيل الدخول أو حجوزاته.
import { useNavigate } from 'react-router-dom';
// بنجيب أداة الاتصال بقاعدة البيانات بتاعتنا.
import { supabase } from '../services/supabaseClient';
// لوجو الموقع.
import logo from '../assets/logo.png';

// الدالة أو المكون الأساسي لصفحة "الغرف المتاحة" (Rooms)
const Rooms = () => {
  // بنجهز أداة الـ navigate.
  const navigate = useNavigate();
  
  // مخزن لحفظ اللغة الحالية (الافتراضي 'en').
  const [lang, setLang] = useState('en');
  // مخزن لحفظ قائمة الغرف اللي هنجيبها من قاعدة البيانات.
  const [rooms, setRooms] = useState([]);
  // مخزن لحالة التحميل، بيبقى true لحد ما البيانات تيجي عشان نعرض كلمة "جاري التحميل".
  const [loading, setLoading] = useState(true);
  
  // مخزن هنحط فيه الجلسة (session) بتاعت اليوزر اللي مسجل دخول.
  const [user, setUser] = useState(null);
  // مخزن هنحط فيه بيانات الطالب نفسه (زي الـ student_id بتاعه).
  const [studentData, setStudentData] = useState(null);
  
  // مخزن عشان نعرف هل الطالب ده عنده حجز شغال دلوقتي ولا لأ؟ (عشان نمنعه يحجز غرفتين في نفس الوقت).
  const [hasActiveBooking, setHasActiveBooking] = useState(false); 

  // ده مخزن للمودال (النافذة المنبثقة اللي بتظهر في نص الشاشة).
  // بنشيل فيه: هي مفتوحة ولا مقفولة (isOpen)؟، نوعها إيه (login, blocked, confirm, success, error)؟، 
  // الغرفة اللي الطالب اختارها (room)، ولو فيه رسالة خطأ معينة (errorMessage).
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, room: null, errorMessage: '' });

  // ده قاموس الترجمة بتاع الصفحة.
  // بيختار القسم المناسب (عربي ولا إنجليزي) بناءً على قيمة مخزن lang.
  const t = {
    en: {
      title: "Available Rooms",
      price: "EGP",
      bookBtn: "Book Now",
      loginRequired: "Login Required",
      maintenance: "Maintenance",
      booked: "Booked",
      backHome: "Back to Home",
      toggleLang: "عربي",
      modalLoginTitle: "Login Required",
      modalLoginText: "You must login as a student first to book a room.",
      modalBlockTitle: "Booking Suspended 🚫",
      modalBlockText: "Your account is currently suspended from booking. Please contact administration.",
      modalAlreadyBookedTitle: "Active Booking Exists", 
      modalAlreadyBookedText: "You already have an active room booking. You can only book one room at a time.", 
      modalConfirmTitle: "Confirm Booking",
      modalConfirmText: "Are you sure you want to book room number",
      modalSuccessTitle: "Success! 🎉",
      modalSuccessText: "Room booked successfully!",
      modalErrorTitle: "Booking Error ❌",
      btnCancel: "Cancel",
      btnConfirm: "Confirm Booking",
      btnLogin: "Go to Login",
      btnOkay: "I Understand",
      btnGoToBookings: "Go to My Bookings"
    },
    ar: {
      title: "الغرف المتاحة",
      price: "جنية",
      bookBtn: "احجز الآن",
      loginRequired: "يجب تسجيل الدخول",
      maintenance: "في الصيانة",
      booked: "محجوزة",
      backHome: "الرئيسية",
      toggleLang: "English",
      modalLoginTitle: "تنبيه تسجيل الدخول",
      modalLoginText: "يجب عليك تسجيل الدخول بحساب طالب أولاً لتتمكن من الحجز.",
      modalBlockTitle: "عذراً، حسابك موقوف 🚫",
      modalBlockText: "حسابك غير مصرح له بالحجز حالياً. يرجى مراجعة إدارة السكن الجامعي لمزيد من التفاصيل.",
      modalAlreadyBookedTitle: "لديك حجز نشط بالفعل", 
      modalAlreadyBookedText: "عذراً، لا يمكنك حجز أكثر من غرفة في نفس الوقت. يرجى مراجعة صفحة حجوزاتي.", 
      modalConfirmTitle: "تأكيد الحجز",
      modalConfirmText: "هل أنت متأكد من رغبتك في حجز الغرفة رقم",
      modalSuccessTitle: "نجاح! 🎉",
      modalSuccessText: "تم حجز الغرفة بنجاح!",
      modalErrorTitle: "خطأ في الحجز ❌",
      btnCancel: "إلغاء",
      btnConfirm: "تأكيد الحجز",
      btnLogin: "الذهاب لتسجيل الدخول",
      btnOkay: "حسناً، فهمت",
      btnGoToBookings: "الذهاب لحجوزاتي"
    }
  }[lang];

  // الـ useEffect دي بتشتغل مرة واحدة أول ما الطالب يفتح صفحة الغرف المتاحة.
  useEffect(() => {
    // دالة لجلب كل البيانات اللي محتاجينها.
    const fetchRoomsAndUser = async () => {
      try {
        // 1. أول حاجة: بنروح نجيب كل الغرف من قاعدة البيانات ونرتبهم برقم الغرفة.
        const { data: roomsData } = await supabase.from('rooms').select('*').order('room_id', { ascending: true });
        // وبنحفظ الغرف دي في مخزن الـ rooms.
        if (roomsData) setRooms(roomsData);

        // 2. بنشوف هو فيه حد مسجل دخول دلوقتي ولا الطالب بيتصفح كزائر؟
        const { data: { session } } = await supabase.auth.getSession();
        
        // لو مسجل دخول (الطالب ليه حساب مفتوح):
        if (session) {
          setUser(session.user); // بنحفظ بيانات الجلسة.
          
          // بنجيب بيانات الطالب ده من جدول students عشان محتاجين الـ student_id بتاعه.
          const { data: student } = await supabase.from('students').select('*').eq('auth_id', session.user.id).single();
          
          if (student) {
            setStudentData(student); // بنحفظ بيانات الطالب.
            
            // بنعمل تشييك سريع: هل الطالب ده حاجز غرفة ومخلصش الترم؟
            // فبنجيب كل حجوزاته اللي حالة الحجز بتاعها "مش ملغي" (يعني حجوزات نشطة).
            const { data: bookings } = await supabase
              .from('bookings')
              .select('*')
              .eq('student_id', student.student_id)
              .neq('booking_status', 'canceled');
            
            // لو لقينا إن عنده حجز نشط فعلاً:
            if (bookings && bookings.length > 0) {
              setHasActiveBooking(true); // بنعلم عليه إنه عنده حجز شغال، عشان نمنعه يحجز تاني.
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        // في الآخر بنقفل التحميل عشان الغرف تظهر.
        setLoading(false);
      }
    };

    fetchRoomsAndUser();
  }, []);

  // الدالة دي بتشتغل لما الطالب يقرر يدوس على زرار "احجز الآن" على أي غرفة.
  const handleBookingClick = (room) => {
    // 1. التفتيش الأول: لو هو زائر ومش مسجل دخول، بنطلعله نافذة بتقوله "لازم تسجل دخول أولاً".
    if (!user || !studentData) return setModalConfig({ isOpen: true, type: 'login', room: null, errorMessage: '' });
    
    // 2. التفتيش التاني: لو مسجل دخول بس الإدمن عامله حظر (Blacklist)، بنطلعله نافذة "حسابك موقوف".
    if (studentData.is_blacklisted) return setModalConfig({ isOpen: true, type: 'blocked', room: null, errorMessage: '' });
    
    // 3. التفتيش التالت: لو مسجل ومش محظور، بس هو أصلاً حاجز غرفة، بنقوله "لا يمكن حجز أكتر من غرفة".
    if (hasActiveBooking) return setModalConfig({ isOpen: true, type: 'alreadyBooked', room: null, errorMessage: '' });

    // 4. لو عدى من كل ده على خير، بنطلعله نافذة "تأكيد الحجز" عشان يتأكد إنه عايز الغرفة دي.
    setModalConfig({ isOpen: true, type: 'confirm', room: room, errorMessage: '' });
  };

  // دي الدالة الفعلية اللي بتنفذ عملية الحجز بعد ما الطالب يدوس "تأكيد" جوه النافذة.
  const executeBooking = async () => {
    const { room } = modalConfig; // بنجيب الغرفة اللي هو اختارها من المخزن بتاع المودال.
    
    try {
      // بنجهز السنة الدراسية الحالية (مثلاً 2024/2025).
      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}/${currentYear + 1}`;

      // 1. بنسجل حجز جديد للطالب في جدول الحجوزات (bookings).
      // بنحطله إن الدفع لسه "غير مدفوع" والحالة "معلقة" لحد ما يدفع للإدارة.
      const { error: bookingError } = await supabase.from('bookings').insert([{
        student_id: studentData.student_id,
        room_id: room.room_id,
        payment_status: 'unpaid',
        booking_status: 'pending',
        academic_year: academicYear
      }]);

      // لو حصل خطأ في الحجز (مثلاً النت فصل أو قاعدة البيانات رفضت)، ارمي الخطأ للـ catch.
      if (bookingError) throw bookingError;

      // 2. بعد ما الحجز اتسجل، بنروح نغير حالة الغرفة دي في جدول الغرف ونخليها "محجوزة" (booked) عشان مفيش حد تاني يختارها.
      const { error: roomError } = await supabase.from('rooms').update({ status: 'booked' }).eq('room_id', room.room_id);
      if (roomError) throw roomError;

      // 3. لو كل ده تم بنجاح، بنغير شكل المودال لنافذة خضرا بتقوله "تم الحجز بنجاح".
      setModalConfig({ isOpen: true, type: 'success', room: null, errorMessage: '' });

    } catch (error) {
      console.error("Booking error:", error);
      // لو حصل خطأ، بنغير شكل المودال لنافذة حمرا بتعرض رسالة الخطأ.
      setModalConfig({ isOpen: true, type: 'error', room: null, errorMessage: error.message || "تأكد من البيانات" });
    }
  };

  // =====================================================================
  // واجهة المستخدم (الـ UI اللي الطالب بيشوفه)
  // =====================================================================
  return (
    // الغلاف الخارجي للصفحة.
    <div className={`min-h-screen bg-gray-50 flex flex-col ${lang === 'en' ? 'font-en' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* ================== المودال (النافذة المنبثقة الذكية) ================== */}
      {/* النافذة دي بتظهر بس لو modalConfig.isOpen كانت true */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-down">
            
            {/* رأس المودال: لونه بيتغير (أخضر للنجاح، أحمر للأخطاء والحظر، وأبيض للتأكيد العادي) */}
            <div className={`p-6 border-b border-gray-100 ${
              modalConfig.type === 'success' ? 'bg-green-50' : 
              (modalConfig.type === 'blocked' || modalConfig.type === 'alreadyBooked' || modalConfig.type === 'error') ? 'bg-red-50' : 'bg-white'
            }`}>
              <h3 className={`text-xl font-extrabold ${
                modalConfig.type === 'success' ? 'text-green-600' : 
                (modalConfig.type === 'blocked' || modalConfig.type === 'alreadyBooked' || modalConfig.type === 'error') ? 'text-red-600' : 'text-[#1b2a47]'
              }`}>
                {/* بنختار العنوان الصح بناءً على نوع المودال المفتوح */}
                {modalConfig.type === 'login' ? t.modalLoginTitle : 
                 modalConfig.type === 'blocked' ? t.modalBlockTitle : 
                 modalConfig.type === 'alreadyBooked' ? t.modalAlreadyBookedTitle : 
                 modalConfig.type === 'success' ? t.modalSuccessTitle :
                 modalConfig.type === 'error' ? t.modalErrorTitle : t.modalConfirmTitle}
              </h3>
            </div>
            
            {/* جسم المودال اللي فيه التفاصيل أو رسالة الخطأ */}
            <div className="p-6 text-gray-600 font-bold text-lg leading-relaxed">
              {modalConfig.type === 'login' ? t.modalLoginText : 
               modalConfig.type === 'blocked' ? t.modalBlockText : 
               modalConfig.type === 'alreadyBooked' ? t.modalAlreadyBookedText :
               modalConfig.type === 'success' ? t.modalSuccessText :
               modalConfig.type === 'error' ? modalConfig.errorMessage :
               // لو نوعه confirm (تأكيد الحجز) بنطبعله الجملة ومعاها رقم الغرفة
               `${t.modalConfirmText} (${modalConfig.room?.room_id})؟`}
            </div>

            {/* زراير التحكم اللي تحت المودال */}
            <div className="p-4 bg-gray-50 flex justify-end gap-3">
              {/* لو المودال مش شاشة "نجاح"، بنعرضله زرار للإلغاء أو التراجع يقفل المودال */}
              {modalConfig.type !== 'success' && (
                <button 
                  onClick={() => setModalConfig({ isOpen: false, type: null, room: null, errorMessage: '' })} 
                  className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {modalConfig.type === 'confirm' ? t.btnCancel : (modalConfig.type === 'login' ? t.btnCancel : t.btnOkay)}
                </button>
              )}
              
              {/* لو المودال بيقوله "لازم تسجل دخول"، بنعرض زرار يوديه لصفحة الـ login */}
              {modalConfig.type === 'login' && (
                <button onClick={() => navigate('/login')} className="px-5 py-2.5 bg-[#1b2a47] text-white font-bold rounded-lg hover:bg-[#2a406b] transition-colors shadow-md">
                  {t.btnLogin}
                </button>
              )}

              {/* لو المودال بيقوله "أكد الحجز"، بنعرض زرار أخضر بينفذ دالة executeBooking */}
              {modalConfig.type === 'confirm' && (
                <button onClick={executeBooking} className="px-5 py-2.5 bg-[#5ca393] text-white font-bold rounded-lg hover:bg-[#458b7c] transition-colors shadow-md">
                  {t.btnConfirm}
                </button>
              )}

              {/* لو المودال "نجاح"، بنعرضله زرار واحد يقفل المودال ويوديه على صفحة "حجوزاتي" */}
              {modalConfig.type === 'success' && (
                <button onClick={() => { setModalConfig({ isOpen: false }); navigate('/my-bookings'); }} className="px-5 py-2.5 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors shadow-md w-full">
                  {t.btnGoToBookings}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================== الشريط العلوي العادي بتاع الصفحة ================== */}
      <nav className="bg-white px-4 md:px-12 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <img src={logo} alt="Logo" className="h-10" />
          <span className="text-2xl font-extrabold text-[#1b2a47]">UniHome</span>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="font-bold text-gray-500 hover:text-[#1b2a47]">
            {t.toggleLang}
          </button>
          <button onClick={() => navigate('/')} className="text-[#5ca393] font-bold hover:underline">
            {t.backHome}
          </button>
        </div>
      </nav>

      {/* ================== قائمة الغرف (الشبكة اللي فيها الكروت) ================== */}
      <div className="flex-grow max-w-7xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl md:text-5xl font-extrabold text-[#1b2a47] mb-12 text-center">
          {t.title}
        </h1>

        {/* لو لسه بيحمل الداتا من قاعدة البيانات بنعرض رسالة جاري التحميل */}
        {loading ? (
          <div className="text-center text-xl font-bold text-[#5ca393] mt-20">جاري التحميل...</div>
        ) : (
          // لو خلص تحميل، بنرسم شبكة (Grid) من الكروت لكل غرفة موجودة.
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {rooms.map((room) => (
              // الكارت الواحد بتاع الغرفة.
              <div key={room.room_id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow overflow-hidden flex flex-col border border-gray-100">
                
                {/* الجزء اللي فوق في الكارت (صورة الغرفة والحالة بتاعتها) */}
                <div className="relative h-48">
                  {/* صورة الغرفة أو صورة افتراضية لو مفيش */}
                  <img src={room.image_url || "https://images.unsplash.com/photo-1522771731478-44eb10e5c836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} alt="Room" className="w-full h-full object-cover" />
                  
                  {/* بادج (علامة صغيرة) فوق الصورة بتبين الغرفة متاحة ولا لأ */}
                  <div className="absolute top-3 right-3 rtl:left-3 rtl:right-auto">
                    {room.status === 'available' ? (
                      <span className="bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full text-xs shadow-sm">متاحة</span>
                    ) : room.status === 'booked' ? (
                      <span className="bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full text-xs shadow-sm">{t.booked}</span>
                    ) : (
                      <span className="bg-orange-100 text-orange-700 font-bold px-3 py-1 rounded-full text-xs shadow-sm">{t.maintenance}</span>
                    )}
                  </div>
                </div>

                {/* الجزء اللي تحت في الكارت (رقم الغرفة، السعر، وزرار الحجز) */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-extrabold text-[#1b2a47]">{room.room_id}</span>
                    <span className="text-xl font-bold text-[#5ca393]">{room.price} <span className="text-sm text-gray-400">{t.price}</span></span>
                  </div>
                  
                  <div className="mt-auto pt-4">
                    {/* زرار "احجز الآن" */}
                    <button 
                      // لما يدوس بنشغل الدالة اللي بتعمل تفتيش وتفتح المودال.
                      onClick={() => handleBookingClick(room)}
                      // الزرار مقفول (مش شغال) لو الغرفة محجوزة أو في صيانة.
                      disabled={room.status !== 'available'}
                      // شكل ولون الزرار بيتغير (شغال أزرق غامق، مقفول رمادي).
                      className={`w-full py-3 rounded-xl font-bold text-white transition-all shadow-md ${
                        room.status === 'available' 
                          ? 'bg-[#1b2a47] hover:bg-[#2a406b] hover:scale-[1.02]' 
                          : 'bg-gray-300 cursor-not-allowed'
                      }`}
                    >
                      {room.status === 'available' ? t.bookBtn : (room.status === 'booked' ? t.booked : t.maintenance)}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// بنصدر الصفحة عشان الموقع يشوفها.
export default Rooms;