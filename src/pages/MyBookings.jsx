import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { supabase } from '../services/supabaseClient';

const MyBookings = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const t = {
    en: {
      toggleLang: "عربي", back: "Back to Home", title: "My Bookings",
      bookingId: "Booking ID", room: "Room", term: "Term",
      paymentStatus: "Payment", bookingStatus: "Status",
      noBookings: "You don't have any bookings yet.", browse: "Browse Rooms"
    },
    ar: {
      toggleLang: "English", back: "الرئيسية", title: "حجوزاتي",
      bookingId: "رقم الحجز", room: "غرفة", term: "الفصل الدراسي",
      paymentStatus: "حالة الدفع", bookingStatus: "حالة الحجز",
      noBookings: "ليس لديك أي حجوزات حتى الآن.", browse: "تصفح الغرف"
    }
  }[lang];

  useEffect(() => {
    const fetchMyBookings = async () => {
      try {
        // 1. معرفة المستخدم الحالي
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate('/login');
          return;
        }

        // 2. جلب رقم الطالب (student_id)
        const { data: student } = await supabase
          .from('students')
          .select('student_id')
          .eq('auth_id', session.user.id)
          .single();

        if (student) {
          // 3. جلب حجوزات هذا الطالب فقط
          const { data: myBookingsData, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('student_id', student.student_id)
            .order('created_at', { ascending: false }); // الأحدث أولاً

          if (error) throw error;
          if (myBookingsData) setBookings(myBookingsData);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyBookings();
  }, [navigate]);

  // دالة لتلوين حالة الدفع والحجز
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'paid':
      case 'confirmed':
      case 'booked':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
      case 'unpaid':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col ${lang === 'en' ? 'font-en' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Navbar */}
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

      {/* المحتوى */}
      <div className="flex-grow max-w-5xl mx-auto px-4 py-12 w-full">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1b2a47] mb-10 text-center border-b-4 border-[#5ca393] inline-block pb-2">
          {t.title}
        </h1>

        {loading ? (
          <div className="text-center text-xl font-bold text-gray-500 mt-20">جاري التحميل...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center mt-20 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-gray-400 mb-6">{t.noBookings}</div>
            <button onClick={() => navigate('/rooms')} className="px-8 py-3 bg-[#5ca393] text-white font-bold rounded-xl hover:bg-[#458b7c] transition-colors">
              {t.browse}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookings.map((booking) => (
              <div key={booking.booking_id} className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-center mb-4 border-b pb-4">
                  <div>
                    <span className="text-sm text-gray-400 block mb-1">{t.bookingId}</span>
                    <span className="font-extrabold text-[#1b2a47] tracking-wider">{booking.booking_id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-400 block mb-1">{t.term}</span>
                    <span className="font-bold text-[#5ca393]">{booking.academic_year}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-[#1b2a47] text-white rounded-xl flex flex-col items-center justify-center font-black shadow-inner">
                    <span className="text-xs font-normal opacity-70 mb-1">{t.room}</span>
                    <span className="text-xl leading-none">{booking.room_id}</span>
                  </div>
                  <div className="flex-grow space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-600">{t.bookingStatus}:</span>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(booking.booking_status)} capitalize`}>
                        {booking.booking_status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-600">{t.paymentStatus}:</span>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(booking.payment_status)} capitalize`}>
                        {booking.payment_status}
                      </span>
                    </div>
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

export default MyBookings;