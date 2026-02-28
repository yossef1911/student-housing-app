import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { supabase } from '../services/supabaseClient';

const Rooms = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [studentData, setStudentData] = useState(null);

  const t = {
    en: {
      toggleLang: "عربي", back: "Back to Home", title: "Available Rooms",
      price: "Price per term", bookBtn: "Book Now", loginToBook: "Login to Book",
      successMsg: "Room booked successfully!", noRooms: "No available rooms at the moment.",
    },
    ar: {
      toggleLang: "English", back: "الرئيسية", title: "الغرف المتاحة",
      price: "السعر للترم", bookBtn: "احجز الآن", loginToBook: "سجل دخولك للحجز",
      successMsg: "تم حجز الغرفة بنجاح!", noRooms: "لا توجد غرف متاحة حالياً.",
    }
  }[lang];

  // جلب الغرف المتاحة وبيانات الطالب عند فتح الصفحة
  useEffect(() => {
    const fetchData = async () => {
      // 1. جلب المستخدم الحالي
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        // جلب الـ student_id الخاص به من قاعدة البيانات
        const { data: student } = await supabase
          .from('students')
          .select('student_id')
          .eq('auth_id', session.user.id)
          .single();
        if (student) setStudentData(student);
      }

      // 2. جلب الغرف المتاحة فقط
      const { data: availableRooms } = await supabase
        .from('rooms')
        .select('*')
        .eq('status', 'available');
      
      if (availableRooms) setRooms(availableRooms);
      setLoading(false);
    };

    fetchData();
  }, []);

  // دالة الحجز
  const handleBookRoom = async (roomId) => {
    if (!user || !studentData) {
      alert(lang === 'ar' ? 'يجب تسجيل الدخول كطالب أولاً.' : 'You must login as a student first.');
      navigate('/login');
      return;
    }

    const confirmBooking = window.confirm(lang === 'ar' ? `تأكيد حجز الغرفة ${roomId}؟` : `Confirm booking for room ${roomId}?`);
    if (!confirmBooking) return;

    // توليد ID عشوائي للحجز مكون من 6 حروف/أرقام بالضبط لتجاوز مشكلة الـ 6 حروف
    const bookingId = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      // 1. إضافة الحجز في جدول bookings
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          booking_id: bookingId,           // 6 حروف بالضبط
          student_id: studentData.student_id, 
          room_id: roomId,
          academic_year: 'Term 1',         
          payment_status: 'unpaid',        // الكلمة التي تقبلها قاعدة بياناتك
          booking_status: 'pending'        // الكلمة التي تقبلها قاعدة بياناتك
        }]);

      if (bookingError) throw bookingError;

      // 2. تحديث حالة الغرفة لتصبح محجوزة
      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: 'booked' })
        .eq('room_id', roomId);

      if (roomError) throw roomError;

      // 3. تحديث الواجهة لإخفاء الغرفة التي تم حجزها
      setRooms(rooms.filter(room => room.room_id !== roomId));
      alert(t.successMsg);

    } catch (error) {
      console.error("Booking error:", error);
      alert("حدث خطأ أثناء الحجز، راجع الـ Console.");
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col ${lang === 'en' ? 'font-en' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Navbar بسيط */}
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

      {/* محتوى الصفحة */}
      <div className="flex-grow max-w-6xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1b2a47] mb-10 text-center border-b-4 border-[#5ca393] inline-block pb-2">
          {t.title}
        </h1>

        {loading ? (
          <div className="text-center text-xl font-bold text-gray-500 mt-20">جاري التحميل...</div>
        ) : rooms.length === 0 ? (
          <div className="text-center text-xl font-bold text-red-500 mt-20 bg-red-50 p-6 rounded-xl border border-red-200">{t.noRooms}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rooms.map((room) => (
              <div key={room.room_id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 flex flex-col overflow-hidden text-center group">
                
                {/* 1. قسم الصورة العلوي */}
                <div className="w-full h-52 relative overflow-hidden bg-gray-200">
                  <img 
                    src={room.image_url || "https://images.unsplash.com/photo-1522771731478-44eb10e5c836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} 
                    alt={`Room ${room.room_id}`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                  {/* رقم الغرفة يطفو فوق الصورة */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-[#1b2a47] px-4 py-1 border-2 border-[#1b2a47] font-black text-xl rounded-full shadow-lg">
                    {room.room_id}
                  </div>
                </div>

                {/* 2. قسم البيانات والسعر */}
                <div className="p-6 flex flex-col items-center">
                  <div className="text-gray-500 font-bold mb-1">{t.price}</div>
                  <div className="text-3xl font-extrabold text-[#5ca393] mb-6">
                    {room.price} <span className="text-sm text-gray-400">EGP</span>
                  </div>
                  
                  {/* 3. زر الحجز */}
                  {user ? (
                    <button 
                      onClick={() => handleBookRoom(room.room_id)}
                      className="w-full py-3 bg-gradient-to-r from-[#1b2a47] to-[#2a406b] text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-md"
                    >
                      {t.bookBtn}
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate('/login')}
                      className="w-full py-3 bg-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-300 transition-colors"
                    >
                      {t.loginToBook}
                    </button>
                  )}
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