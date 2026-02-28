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

  // حالات النوافذ المنبثقة (Modals)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); // 👈 حالة نافذة النجاح الجديدة

  const t = {
    en: {
      toggleLang: "عربي", back: "Back to Home", title: "Available Rooms",
      price: "Price per term", bookBtn: "Book Now", loginToBook: "Login to Book",
      successMsg: "Room booked successfully!", noRooms: "No available rooms at the moment.",
      confirmTitle: "Confirm Booking", confirmQuestion: "Are you sure you want to book room number",
      yesBtn: "Yes, Book it", noBtn: "Cancel", okBtn: "OK"
    },
    ar: {
      toggleLang: "English", back: "الرئيسية", title: "الغرف المتاحة",
      price: "السعر للترم", bookBtn: "احجز الآن", loginToBook: "سجل دخولك للحجز",
      successMsg: "تم حجز الغرفة بنجاح!", noRooms: "لا توجد غرف متاحة حالياً.",
      confirmTitle: "تأكيد الحجز", confirmQuestion: "هل أنت متأكد أنك تريد حجز الغرفة رقم",
      yesBtn: "نعم، تأكيد الحجز", noBtn: "تراجع", okBtn: "حسناً"
    }
  }[lang];

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        const { data: student } = await supabase
          .from('students')
          .select('student_id')
          .eq('auth_id', session.user.id)
          .single();
        if (student) setStudentData(student);
      }

      const { data: availableRooms } = await supabase
        .from('rooms')
        .select('*')
        .eq('status', 'available');
      
      if (availableRooms) setRooms(availableRooms);
      setLoading(false);
    };

    fetchData();
  }, []);

  const openConfirmModal = (roomId) => {
    if (!user || !studentData) {
      alert(lang === 'ar' ? 'يجب تسجيل الدخول كطالب أولاً.' : 'You must login as a student first.');
      navigate('/login');
      return;
    }
    setSelectedRoomId(roomId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRoomId(null);
  };

  const executeBooking = async () => {
    const roomId = selectedRoomId;
    closeModal(); 

    const bookingId = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          booking_id: bookingId,
          student_id: studentData.student_id, 
          room_id: roomId,
          academic_year: 'Term 1',         
          payment_status: 'unpaid',
          booking_status: 'pending'
        }]);

      if (bookingError) throw bookingError;

      const { error: roomError } = await supabase
        .from('rooms')
        .update({ status: 'booked' })
        .eq('room_id', roomId);

      if (roomError) throw roomError;

      setRooms(rooms.filter(room => room.room_id !== roomId));
      
      // 👈 إظهار نافذة النجاح الأنيقة بدلاً من رسالة المتصفح
      setIsSuccessModalOpen(true);

    } catch (error) {
      console.error("Booking error:", error);
      alert("حدث خطأ أثناء الحجز، راجع الـ Console.");
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col relative ${lang === 'en' ? 'font-en' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* ================== نافذة تأكيد الحجز (Modal) ================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full transform transition-all scale-100">
            <div className="w-16 h-16 bg-blue-50 text-[#5ca393] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🏠
            </div>
            <h3 className="text-2xl font-bold text-[#1b2a47] text-center mb-2">{t.confirmTitle}</h3>
            <p className="text-gray-500 text-center font-bold mb-8">
              {t.confirmQuestion} <span className="text-[#5ca393] text-xl ml-1">{selectedRoomId}</span>؟
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={executeBooking} className="w-full py-3 bg-[#1b2a47] text-white font-bold rounded-xl hover:bg-[#2a406b] transition-colors shadow-md">
                {t.yesBtn}
              </button>
              <button onClick={closeModal} className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                {t.noBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================== نافذة النجاح (Success Modal) ================== */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full transform transition-all scale-100 text-center">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl">
              ✅
            </div>
            <h3 className="text-2xl font-bold text-[#1b2a47] mb-2">{t.successMsg}</h3>
            <p className="text-gray-500 font-medium mb-8">
              {lang === 'ar' ? 'يمكنك متابعة تفاصيل حجزك من صفحة حجوزاتي.' : 'You can track your booking details from My Bookings page.'}
            </p>
            <button 
              onClick={() => setIsSuccessModalOpen(false)} 
              className="w-full py-3 bg-[#5ca393] text-white font-bold rounded-xl hover:bg-[#458b7c] transition-colors shadow-md"
            >
              {t.okBtn}
            </button>
          </div>
        </div>
      )}
      {/* ========================================================== */}

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
                
                <div className="w-full h-52 relative overflow-hidden bg-gray-200">
                  <img 
                    src={room.image_url || "https://images.unsplash.com/photo-1522771731478-44eb10e5c836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} 
                    alt={`Room ${room.room_id}`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-[#1b2a47] px-4 py-1 border-2 border-[#1b2a47] font-black text-xl rounded-full shadow-lg">
                    {room.room_id}
                  </div>
                </div>

                <div className="p-6 flex flex-col items-center">
                  <div className="text-gray-500 font-bold mb-1">{t.price}</div>
                  <div className="text-3xl font-extrabold text-[#5ca393] mb-6">
                    {room.price} <span className="text-sm text-gray-400">EGP</span>
                  </div>
                  
                  {user ? (
                    <button onClick={() => openConfirmModal(room.room_id)} className="w-full py-3 bg-gradient-to-r from-[#1b2a47] to-[#2a406b] text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-md">
                      {t.bookBtn}
                    </button>
                  ) : (
                    <button onClick={() => navigate('/login')} className="w-full py-3 bg-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-300 transition-colors">
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