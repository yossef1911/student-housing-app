import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import logo from '../assets/logo.png';

const Rooms = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [studentData, setStudentData] = useState(null);

  // نظام النوافذ المنبثقة (Modals)
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, room: null });

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
      // نصوص المودال
      modalLoginTitle: "Login Required",
      modalLoginText: "You must login as a student first to book a room.",
      modalBlockTitle: "Booking Suspended 🚫",
      modalBlockText: "Your account is currently suspended from booking. Please contact the administration for more details.",
      modalConfirmTitle: "Confirm Booking",
      modalConfirmText: "Are you sure you want to book room number",
      btnCancel: "Cancel",
      btnConfirm: "Confirm Booking",
      btnLogin: "Go to Login",
      btnOkay: "I Understand",
      successBooking: "Room booked successfully!"
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
      // نصوص المودال
      modalLoginTitle: "تنبيه تسجيل الدخول",
      modalLoginText: "يجب عليك تسجيل الدخول بحساب طالب أولاً لتتمكن من الحجز.",
      modalBlockTitle: "عذراً، حسابك موقوف 🚫",
      modalBlockText: "حسابك غير مصرح له بالحجز حالياً. يرجى مراجعة إدارة السكن الجامعي لمزيد من التفاصيل.",
      modalConfirmTitle: "تأكيد الحجز",
      modalConfirmText: "هل أنت متأكد من رغبتك في حجز الغرفة رقم",
      btnCancel: "إلغاء",
      btnConfirm: "تأكيد الحجز",
      btnLogin: "الذهاب لتسجيل الدخول",
      btnOkay: "حسناً، فهمت",
      successBooking: "تم حجز الغرفة بنجاح!"
    }
  }[lang];

  useEffect(() => {
    const fetchRoomsAndUser = async () => {
      try {
        // 1. جلب الغرف
        const { data: roomsData } = await supabase.from('rooms').select('*').order('room_id', { ascending: true });
        if (roomsData) setRooms(roomsData);

        // 2. التحقق من المستخدم الحالي وجلب بيانات الطالب (بما فيها حالة الحظر)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          const { data: student } = await supabase.from('students').select('*').eq('auth_id', session.user.id).single();
          if (student) setStudentData(student);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomsAndUser();
  }, []);

  const handleBookingClick = (room) => {
    // 1. إذا لم يكن مسجلاً للدخول -> مودال تسجيل الدخول
    if (!user || !studentData) {
      setModalConfig({ isOpen: true, type: 'login', room: null });
      return;
    }

    // 2. إذا كان الطالب محظوراً -> مودال الحظر الأحمر
    if (studentData.is_blacklisted) {
      setModalConfig({ isOpen: true, type: 'blocked', room: null });
      return;
    }

    // 3. إذا كان كل شيء سليماً -> مودال تأكيد الحجز
    setModalConfig({ isOpen: true, type: 'confirm', room: room });
  };

  const executeBooking = async () => {
    const { room } = modalConfig;
    try {
      // حساب العام الدراسي تلقائياً (مثال: 2026/2027)
      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}/${currentYear + 1}`;

      // إرسال الحجز مع إضافة عمود academic_year الإجباري
      const { error: bookingError } = await supabase.from('bookings').insert([{
        student_id: studentData.student_id,
        room_id: room.room_id,
        payment_status: 'pending',
        booking_status: 'pending',
        academic_year: academicYear // 👈 هذا هو السطر الذي حل المشكلة!
      }]);

      if (bookingError) throw bookingError;

      // تحديث حالة الغرفة لتصبح محجوزة
      const { error: roomError } = await supabase.from('rooms').update({ status: 'booked' }).eq('room_id', room.room_id);
      if (roomError) throw roomError;

      alert(t.successBooking);
      setModalConfig({ isOpen: false, type: null, room: null });
      navigate('/my-bookings');

    } catch (error) {
      console.error("Booking error:", error);
      alert("حدث خطأ أثناء الحجز: " + (error.message || "تأكد من البيانات"));
      setModalConfig({ isOpen: false, type: null, room: null });
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col ${lang === 'en' ? 'font-en' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* ================== شاشة المودال (النافذة المنبثقة) ================== */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-down">
            
            {/* عنوان المودال */}
            <div className={`p-6 border-b border-gray-100 ${modalConfig.type === 'blocked' ? 'bg-red-50' : 'bg-white'}`}>
              <h3 className={`text-xl font-extrabold ${modalConfig.type === 'blocked' ? 'text-red-600' : 'text-[#1b2a47]'}`}>
                {modalConfig.type === 'login' ? t.modalLoginTitle : 
                 modalConfig.type === 'blocked' ? t.modalBlockTitle : t.modalConfirmTitle}
              </h3>
            </div>
            
            {/* محتوى المودال */}
            <div className="p-6 text-gray-600 font-bold text-lg leading-relaxed">
              {modalConfig.type === 'login' ? t.modalLoginText : 
               modalConfig.type === 'blocked' ? t.modalBlockText : 
               `${t.modalConfirmText} (${modalConfig.room?.room_id})؟`}
            </div>

            {/* أزرار المودال */}
            <div className="p-4 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setModalConfig({ isOpen: false, type: null, room: null })} 
                className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-200 rounded-lg transition-colors"
              >
                {modalConfig.type === 'confirm' ? t.btnCancel : (modalConfig.type === 'login' ? t.btnCancel : t.btnOkay)}
              </button>
              
              {modalConfig.type === 'login' && (
                <button onClick={() => navigate('/login')} className="px-5 py-2.5 bg-[#1b2a47] text-white font-bold rounded-lg hover:bg-[#2a406b] transition-colors shadow-md">
                  {t.btnLogin}
                </button>
              )}

              {modalConfig.type === 'confirm' && (
                <button onClick={executeBooking} className="px-5 py-2.5 bg-[#5ca393] text-white font-bold rounded-lg hover:bg-[#458b7c] transition-colors shadow-md">
                  {t.btnConfirm}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* الشريط العلوي */}
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

      {/* محتوى الغرف */}
      <div className="flex-grow max-w-7xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl md:text-5xl font-extrabold text-[#1b2a47] mb-12 text-center">
          {t.title}
        </h1>

        {loading ? (
          <div className="text-center text-xl font-bold text-[#5ca393] mt-20">جاري التحميل...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {rooms.map((room) => (
              <div key={room.room_id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-shadow overflow-hidden flex flex-col border border-gray-100">
                <div className="relative h-48">
                  <img src={room.image_url || "https://images.unsplash.com/photo-1522771731478-44eb10e5c836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} alt="Room" className="w-full h-full object-cover" />
                  
                  {/* شارة الحالة (Badge) */}
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

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-extrabold text-[#1b2a47]">{room.room_id}</span>
                    <span className="text-xl font-bold text-[#5ca393]">{room.price} <span className="text-sm text-gray-400">{t.price}</span></span>
                  </div>
                  
                  <div className="mt-auto pt-4">
                    <button 
                      onClick={() => handleBookingClick(room)}
                      disabled={room.status !== 'available'}
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

export default Rooms;