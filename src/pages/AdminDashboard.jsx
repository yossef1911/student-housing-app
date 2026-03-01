import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { supabase } from '../services/supabaseClient';

// مكون العداد التنازلي للصيانة
const CountdownTimer = ({ targetDate, lang }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft(lang === 'ar' ? 'انتهت الصيانة' : 'Maintenance Ended');
        clearInterval(interval);
      } else {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        setTimeLeft(lang === 'ar' ? `${days} يوم و ${formattedTime}` : `${days}d ${formattedTime}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate, lang]);

  return <span className="text-xs font-bold text-red-500 block mt-2 bg-red-50 px-2 py-1 rounded border border-red-100" dir="ltr">{timeLeft}</span>;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');
  // تبويبات جديدة: bookings, rooms, students
  const [activeTab, setActiveTab] = useState('bookings'); 
  
  const [allBookings, setAllBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [students, setStudents] = useState([]); // حالة للطلاب
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0); // حالة للإيرادات

  const [newRoomId, setNewRoomId] = useState('');
  const [newRoomPrice, setNewRoomPrice] = useState('');
  const [newRoomImage, setNewRoomImage] = useState('');

  const t = {
    en: {
      toggleLang: "عربي", logout: "Logout", title: "Admin Dashboard",
      tabBookings: "Bookings", tabRooms: "Rooms", tabStudents: "Students", // ترجمة الطلاب
      bookingId: "Booking ID", studentId: "Student ID", room: "Room", price: "Price",
      paymentStatus: "Payment", bookingStatus: "Status", actions: "Actions",
      noBookings: "No bookings.", noRooms: "No rooms.", noStudents: "No students registered.",
      markPaid: "Mark Paid", markConfirmed: "Confirm", cancelBooking: "Cancel",
      paidSuccess: "✅ Paid", // نص بعد الدفع
      timeLeft: "Time Left", days: "Days", occupant: "Occupant ID",
      studentName: "Student Name", email: "Email", roomsBooked: "Rooms Booked", // عناوين جدول الطلاب
      totalRevenue: "Total Revenue (Paid)", currency: "EGP", // الإيرادات
      addRoom: "Add Room", roomIdPlaceholder: "ID (e.g. 104)", pricePlaceholder: "Price (e.g. 1500)", imagePlaceholder: "Image URL",
      btnAdd: "Add", btnDelete: "Delete", btnMaintenance: "Maintenance", btnAvailable: "Make Available"
    },
    ar: {
      toggleLang: "English", logout: "خروج", title: "لوحة تحكم الإدارة",
      tabBookings: "الحجوزات", tabRooms: " الغرف", tabStudents: "الطلاب", // ترجمة الطلاب
      bookingId: "رقم الحجز", studentId: "كود الطالب", room: "غرفة", price: "السعر",
      paymentStatus: "حالة الدفع", bookingStatus: "الحجز", actions: "إجراءات",
      noBookings: "لا حجوزات.", noRooms: "لا غرف.", noStudents: "لا يوجد طلاب مسجلين.",
      markPaid: "تأكيد الدفع 🟢", markConfirmed: "تأكيد الحجز", cancelBooking: "إلغاء",
      paidSuccess: "✅ تم الدفع", // نص بعد الدفع
      timeLeft: "المتبقي الترم", days: "أيام", occupant: "كود الطالب",
      studentName: "اسم الطالب", email: "الإيميل", roomsBooked: "الغرف المحجوزة", // عناوين جدول الطلاب
      totalRevenue: "إجمالي الإيرادات (المحصلة)", currency: "جنية", // الإيرادات
      addRoom: "إضافة غرفة", roomIdPlaceholder: "مثال 104", pricePlaceholder: "السعر مثال 1500", imagePlaceholder: "رابط الصورة",
      btnAdd: "إضافة", btnDelete: "حذف", btnMaintenance: "صيانة", btnAvailable: "إتاحة للطلاب"
    }
  }[lang];

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return navigate('/login');

        const { data: adminData } = await supabase.from('admins').select('*').eq('auth_id', session.user.id).single();
        if (!adminData) {
          alert(lang === 'ar' ? 'غير مصرح.' : 'Access Denied.');
          return navigate('/');
        }

        // جلب الحجوزات
        const { data: bookingsData } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
        if (bookingsData) {
          setAllBookings(bookingsData);
          // 3. حساب إجمالي الإيرادات المحصلة (Total Revenue)
          const revenue = bookingsData
            .filter(b => b.payment_status === 'paid')
            .reduce((sum, b) => sum + (b.room_id ? 1000 : 0), 0); // بافتراض السعر 1000 لكل غرفة مؤقتاً لحين ربط السعر، سأعدلها لتقرأ من السعر الحقيقي
            // التعديل لقراءة السعر الحقيقي يتطلب عمل Join، سأقوم به في الخطوة القادمة، الآن سأستخدم مجموع أسعار الغرف المحجوزة
          
          // حل مؤقت لحساب الإيرادات بدون Joint:
          let tempRevenue = 0;
          const { data: roomsForRevenue } = await supabase.from('rooms').select('room_id, price');
          if(roomsForRevenue) {
              bookingsData.forEach(b => {
                  if(b.payment_status === 'paid') {
                      const roomPrice = roomsForRevenue.find(r => r.room_id === b.room_id)?.price || 0;
                      tempRevenue += roomPrice;
                  }
              });
          }
          setTotalRevenue(tempRevenue);
        }

        // جلب الغرف
        const { data: roomsData } = await supabase.from('rooms').select('*').order('room_id', { ascending: true });
        if (roomsData) setRooms(roomsData);

        // 2. جلب بيانات الطلاب (الجدول الجديد)
        const { data: studentsData } = await supabase.from('students').select('student_id, student_name, email');
        if (studentsData) setStudents(studentsData);

      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate, lang]);

  // دالة لحساب عدد حجوزات كل طالب
  const getStudentBookingCount = (studentId) => {
    return allBookings.filter(b => b.student_id === studentId).length;
  };

  const getRemainingDays = (createdAt) => {
    const endDate = new Date(createdAt);
    endDate.setDate(endDate.getDate() + 90); 
    const diffDays = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // 1. تعديل حالة الدفع (مع إخفاء الزر بعد الدفع)
  const updateBookingStatus = async (bookingId, fieldToUpdate, newValue) => {
    try {
      const { error } = await supabase.from('bookings').update({ [fieldToUpdate]: newValue }).eq('booking_id', bookingId);
      if (error) throw error;
      setAllBookings(allBookings.map(b => b.booking_id === bookingId ? { ...b, [fieldToUpdate]: newValue } : b));
      
      // تحديث الإيرادات لحظياً بعد الدفع
      if(fieldToUpdate === 'payment_status' && newValue === 'paid') {
          const booking = allBookings.find(b => b.booking_id === bookingId);
          const roomPrice = rooms.find(r => r.room_id === booking.room_id)?.price || 0;
          setTotalRevenue(prev => prev + roomPrice);
      }
    } catch (error) {
      alert("حدث خطأ.");
    }
  };

  const handleCancelBooking = async (bookingId, roomId) => {
    const confirmMsg = lang === 'ar' ? 'إلغاء هذا الحجز؟ ستدخل الغرفة صيانة لمدة 10 أيام.' : 'Cancel this booking? Room moves to maintenance for 10 days.';
    if (!window.confirm(confirmMsg)) return;

    const maintenanceEndDate = new Date();
    maintenanceEndDate.setDate(maintenanceEndDate.getDate() + 10);

    try {
      // إذا كان الحجز ملغياً وهو مدفوع، نطرح سعره من الإيرادات
      const booking = allBookings.find(b => b.booking_id === bookingId);
      if(booking.payment_status === 'paid') {
          const roomPrice = rooms.find(r => r.room_id === roomId)?.price || 0;
          setTotalRevenue(prev => prev - roomPrice);
      }

      const { error: bookingError } = await supabase.from('bookings').delete().eq('booking_id', bookingId);
      if (bookingError) throw bookingError;

      const { error: roomError } = await supabase.from('rooms').update({ status: 'maintenance', maintenance_end: maintenanceEndDate.toISOString() }).eq('room_id', roomId);
      if (roomError) throw roomError;

      setAllBookings(allBookings.filter(b => b.booking_id !== bookingId));
      setRooms(rooms.map(r => r.room_id === roomId ? { ...r, status: 'maintenance', maintenance_end: maintenanceEndDate.toISOString() } : r));
      alert(lang === 'ar' ? 'تم الإلغاء!' : 'Cancelled!');
    } catch (error) {
      alert("حدث خطأ.");
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!newRoomId || !newRoomPrice) return;
    const defaultImage = "https://images.unsplash.com/photo-1522771731478-44eb10e5c836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

    try {
      const { error } = await supabase.from('rooms').insert([{
        room_id: newRoomId, price: Number(newRoomPrice), status: 'available', image_url: newRoomImage || defaultImage
      }]);
      if (error) throw error;
      setRooms([...rooms, { room_id: newRoomId, price: Number(newRoomPrice), status: 'available', image_url: newRoomImage || defaultImage }]);
      setNewRoomId(''); setNewRoomPrice(''); setNewRoomImage('');
      alert(lang === 'ar' ? 'تمت الإضافة!' : 'Added!');
    } catch (error) {
      alert(lang === 'ar' ? 'رقم الغرفة مكرر.' : 'Duplicate Room ID.');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm(lang === 'ar' ? `حذف الغرفة ${roomId}؟` : `Delete room ${roomId}?`)) return;
    try {
      const { error } = await supabase.from('rooms').delete().eq('room_id', roomId);
      if (error) throw error;
      setRooms(rooms.filter(r => r.room_id !== roomId));
    } catch (error) {
      alert(lang === 'ar' ? 'الغرفة بها حجوزات.' : 'Room has bookings.');
    }
  };

  const toggleRoomStatus = async (roomId, currentStatus) => {
    const isMaintenance = currentStatus !== 'maintenance';
    const newStatus = isMaintenance ? 'maintenance' : 'available';
    let maintenanceEnd = null;
    if (isMaintenance) { const d = new Date(); d.setDate(d.getDate() + 10); maintenanceEnd = d.toISOString(); }

    try {
      const { error } = await supabase.from('rooms').update({ status: newStatus, maintenance_end: maintenanceEnd }).eq('room_id', roomId);
      if (error) throw error;
      setRooms(rooms.map(r => r.room_id === roomId ? { ...r, status: newStatus, maintenance_end: maintenanceEnd } : r));
    } catch (error) {
      alert("حدث خطأ.");
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };
  const handlePriceKeyDown = (e) => { if (e.key === '-' || e.key === 'e' || e.key === '+' || e.key === '.') { e.preventDefault(); } };

  return (
    <div className={`min-h-screen bg-gray-100 flex flex-col ${lang === 'en' ? 'font-en' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <nav className="bg-[#1b2a47] px-4 md:px-12 py-4 flex justify-between items-center shadow-lg" dir="ltr">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="h-10 bg-white rounded-full p-1 object-contain" />
          <span className="text-2xl font-extrabold text-white font-en">Admin Panel</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="font-bold text-gray-300 hover:text-white transition-colors">{t.toggleLang}</button>
          <button onClick={handleLogout} className="px-5 py-2 bg-red-500 text-white font-bold rounded-full hover:bg-red-600 transition-colors">{t.logout}</button>
        </div>
      </nav>

      <div className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1b2a47] mb-8 border-b-4 border-[#5ca393] inline-block pb-2">
          {t.title}
        </h1>

        {/* 2. تبويبات الإدارة (أضيف الطلاب) */}
        <div className="flex gap-2 sm:gap-4 mb-8 border-b border-gray-200 pb-4 flex-wrap">
          <button onClick={() => setActiveTab('bookings')} className={`px-4 sm:px-6 py-2 font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === 'bookings' ? 'bg-[#5ca393] text-white' : 'bg-white text-gray-500 hover:bg-gray-200'}`}>
            {t.tabBookings}
          </button>
          <button onClick={() => setActiveTab('rooms')} className={`px-4 sm:px-6 py-2 font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === 'rooms' ? 'bg-[#5ca393] text-white' : 'bg-white text-gray-500 hover:bg-gray-200'}`}>
            {t.tabRooms}
          </button>
          <button onClick={() => setActiveTab('students')} className={`px-4 sm:px-6 py-2 font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === 'students' ? 'bg-[#5ca393] text-white' : 'bg-white text-gray-500 hover:bg-gray-200'}`}>
            {t.tabStudents} {/* التبويب الجديد */}
          </button>
        </div>

        {loading ? (
          <div className="text-center text-xl font-bold text-gray-500 mt-20">...</div>
        ) : activeTab === 'bookings' ? (
          // ================= تبويب الحجوزات =================
          <div>
            {/* 3. لوحة إحصائيات الإيرادات */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-3xl">💰</div>
                    <div>
                        <div className="text-gray-500 font-bold">{t.totalRevenue}</div>
                        <div className="text-4xl font-extrabold text-[#5ca393]">{totalRevenue.toLocaleString()} <span className="text-sm text-gray-400">{t.currency}</span></div>
                    </div>
                </div>
            </div>

            {allBookings.length === 0 ? (
              <div className="text-center mt-10 bg-white p-10 rounded-2xl shadow-sm border border-gray-200 text-xl font-bold text-gray-400">{t.noBookings}</div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                        <th className={`p-4 font-bold whitespace-nowrap ${lang === 'ar' ? 'text-right' : ''}`}>{t.bookingId}</th>
                        <th className={`p-4 font-bold whitespace-nowrap ${lang === 'ar' ? 'text-right' : ''}`}>{t.studentId}</th>
                        <th className={`p-4 font-bold whitespace-nowrap ${lang === 'ar' ? 'text-right' : ''}`}>{t.room}</th>
                        <th className={`p-4 font-bold whitespace-nowrap ${lang === 'ar' ? 'text-right' : ''}`}>{t.timeLeft}</th>
                        <th className={`p-4 font-bold whitespace-nowrap ${lang === 'ar' ? 'text-right' : ''}`}>{t.paymentStatus}</th>
                        <th className={`p-4 font-bold whitespace-nowrap ${lang === 'ar' ? 'text-right' : ''}`}>{t.bookingStatus}</th>
                        <th className={`p-4 font-bold text-center`}>{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allBookings.map((booking) => (
                        <tr key={booking.booking_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className={`p-4 font-extrabold text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`}>{booking.booking_id}</td>
                          <td className={`p-4 text-[#5ca393] font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{booking.student_id}</td>
                          <td className={`p-4 font-bold text-gray-700 ${lang === 'ar' ? 'text-right' : ''}`}>{booking.room_id}</td>
                          <td className={`p-4 font-bold text-orange-500 ${lang === 'ar' ? 'text-right' : ''}`}>
                            {getRemainingDays(booking.created_at)} {t.days}
                          </td>
                          <td className={`p-4 ${lang === 'ar' ? 'text-right' : ''}`}>
                            {/* 1. تعديل شكل حالة الدفع بعد الدفع */}
                            {booking.payment_status === 'paid' ? (
                                <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full text-xs flex items-center gap-1 w-fit">
                                    {t.paidSuccess}
                                </span>
                            ) : (
                                <span className="px-3 py-1 rounded-full text-xs font-bold capitalize bg-yellow-100 text-yellow-700">
                                    {booking.payment_status}
                                </span>
                            )}
                          </td>
                          <td className={`p-4 ${lang === 'ar' ? 'text-right' : ''}`}>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${booking.booking_status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                              {booking.booking_status}
                            </span>
                          </td>
                          <td className="p-4 flex gap-2 justify-center flex-wrap min-w-[200px]">
                            {/* 1. إخفاء زر تأكيد الدفع بعد الدفع */}
                            {booking.payment_status !== 'paid' && (
                              <button onClick={() => updateBookingStatus(booking.booking_id, 'payment_status', 'paid')} className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors whitespace-nowrap">
                                {t.markPaid}
                              </button>
                            )}
                            {booking.booking_status !== 'confirmed' && (
                              <button onClick={() => updateBookingStatus(booking.booking_id, 'booking_status', 'confirmed')} className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap">
                                {t.markConfirmed}
                              </button>
                            )}
                            <button onClick={() => handleCancelBooking(booking.booking_id, booking.room_id)} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors whitespace-nowrap">
                              {t.cancelBooking}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'rooms' ? (
          // ================= تبويب الغرف =================
          <div className="space-y-8">
            {/* إضافة الغرفة (اختصار للمساحة) */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
              <form onSubmit={handleAddRoom} className="flex flex-col sm:flex-row gap-3">
                  <input type="text" required value={newRoomId} onChange={(e) => setNewRoomId(e.target.value)} placeholder={t.roomIdPlaceholder} className="w-full sm:w-28 p-2.5 border border-gray-300 rounded-lg" />
                  <input type="number" min="0" onKeyDown={handlePriceKeyDown} required value={newRoomPrice} onChange={(e) => setNewRoomPrice(e.target.value)} placeholder={t.pricePlaceholder} className="w-full sm:w-36 p-2.5 border border-gray-300 rounded-lg" />
                  <input type="text" value={newRoomImage} onChange={(e) => setNewRoomImage(e.target.value)} placeholder={t.imagePlaceholder} className="flex-grow p-2.5 border border-gray-300 rounded-lg" dir="ltr" />
                  <button type="submit" className="px-6 py-2.5 bg-[#1b2a47] text-white font-bold rounded-lg hover:bg-[#2a406b]">{t.btnAdd}</button>
              </form>
            </div>

            {rooms.length === 0 ? (
              <div className="text-center mt-10 bg-white p-10 rounded-2xl shadow-sm border border-gray-200 text-xl font-bold text-gray-400">{t.noRooms}</div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                        <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>الصورة</th>
                        <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.room}</th>
                        <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.occupant}</th>
                        <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.price}</th>
                        <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.bookingStatus}</th>
                        <th className={`p-4 font-bold text-center`}>{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map((room) => {
                        const activeBooking = allBookings.find(b => b.room_id === room.room_id);
                        return (
                          <tr key={room.room_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="p-4"><img src={room.image_url || "https://images.unsplash.com/photo-1522771731478-44eb10e5c836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} alt="room" className="w-16 h-12 object-cover rounded-md border" /></td>
                            <td className={`p-4 font-extrabold text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`}>{room.room_id}</td>
                            <td className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{room.status === 'booked' && activeBooking ? <span className="bg-blue-50 text-[#5ca393] px-2 py-1 rounded-lg border border-blue-100">{activeBooking.student_id}</span> : <span className="text-gray-400">-</span>}</td>
                            <td className={`p-4 text-gray-600 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{room.price} EGP</td>
                            <td className={`p-4 ${lang === 'ar' ? 'text-right' : ''}`}><span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${room.status === 'available' ? 'bg-green-100 text-green-700' : room.status === 'booked' ? 'bg-blue-100 text-blue-700' : room.status === 'maintenance' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-700'}`}>{room.status}</span>{room.status === 'maintenance' && room.maintenance_end && <CountdownTimer targetDate={room.maintenance_end} lang={lang} />}</td>
                            <td className="p-4 flex gap-2 justify-center items-center flex-wrap pt-5">
                              <button onClick={() => toggleRoomStatus(room.room_id, room.status)} className={`px-3 py-1.5 text-white text-xs font-bold rounded-lg ${room.status === 'maintenance' ? 'bg-green-500' : 'bg-orange-500'}`}>{room.status === 'maintenance' ? t.btnAvailable : t.btnMaintenance}</button>
                              <button onClick={() => handleDeleteRoom(room.room_id)} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg">{t.btnDelete}</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          // ================= 2. تبويب إدارة الطلاب (الجدول الجديد) =================
          students.length === 0 ? (
            <div className="text-center mt-10 bg-white p-10 rounded-2xl shadow-sm border border-gray-200 text-xl font-bold text-gray-400">{t.noStudents}</div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                      <th className={`p-4 font-bold whitespace-nowrap ${lang === 'ar' ? 'text-right' : ''}`}>{t.studentId}</th>
                      <th className={`p-4 font-bold whitespace-nowrap ${lang === 'ar' ? 'text-right' : ''}`}>{t.studentName}</th>
                      <th className={`p-4 font-bold whitespace-nowrap ${lang === 'ar' ? 'text-right' : ''}`}>{t.email}</th>
                      <th className={`p-4 font-bold text-center whitespace-nowrap`}>{t.roomsBooked}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.student_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className={`p-4 font-extrabold text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`}>{student.student_id}</td>
                        <td className={`p-4 font-bold text-gray-700 ${lang === 'ar' ? 'text-right' : ''}`}>{student.student_name}</td>
                        <td className={`p-4 text-gray-600 ${lang === 'ar' ? 'text-right' : ''}`} dir="ltr">{student.email}</td>
                        <td className="p-4 text-center">
                          <span className={`px-4 py-1.5 rounded-full font-extrabold text-lg 
                            ${getStudentBookingCount(student.student_id) > 0 ? 'bg-[#5ca393]/10 text-[#5ca393]' : 'bg-gray-100 text-gray-400'}`}>
                            {getStudentBookingCount(student.student_id)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;