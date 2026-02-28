import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { supabase } from '../services/supabaseClient';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState('en');
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'rooms'
  
  const [allBookings, setAllBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // حالات إضافة غرفة جديدة
  const [newRoomId, setNewRoomId] = useState('');
  const [newRoomPrice, setNewRoomPrice] = useState('');
  const [newRoomImage, setNewRoomImage] = useState(''); // حالة الصورة الجديدة

  const t = {
    en: {
      toggleLang: "عربي", logout: "Logout", title: "Admin Dashboard",
      tabBookings: "Bookings Management", tabRooms: "Rooms Management",
      bookingId: "Booking ID", studentId: "Student ID", room: "Room", price: "Price",
      paymentStatus: "Payment", bookingStatus: "Status", actions: "Actions",
      noBookings: "No bookings found.", noRooms: "No rooms found.",
      markPaid: "Mark Paid", markConfirmed: "Confirm",
      addRoom: "Add New Room", roomIdPlaceholder: "Room ID (e.g. 104)", pricePlaceholder: "Price (e.g. 1500)", imagePlaceholder: "Image URL (Optional)",
      btnAdd: "Add Room", btnDelete: "Delete", btnMaintenance: "Maintenance", btnAvailable: "Make Available"
    },
    ar: {
      toggleLang: "English", logout: "تسجيل خروج", title: "لوحة تحكم الإدارة",
      tabBookings: "إدارة الحجوزات", tabRooms: "إدارة الغرف",
      bookingId: "رقم الحجز", studentId: "رقم الطالب", room: "غرفة", price: "السعر",
      paymentStatus: "حالة الدفع", bookingStatus: "حالة الحجز", actions: "إجراءات",
      noBookings: "لا توجد حجوزات.", noRooms: "لا توجد غرف.",
      markPaid: "تأكيد الدفع", markConfirmed: "تأكيد الحجز",
      addRoom: "إضافة غرفة جديدة", roomIdPlaceholder: "رقم الغرفة (مثال 104)", pricePlaceholder: "السعر (مثال 1500)", imagePlaceholder: "رابط الصورة (URL) - اختياري",
      btnAdd: "إضافة الغرفة", btnDelete: "حذف", btnMaintenance: "إدخال صيانة", btnAvailable: "إتاحة للطلاب"
    }
  }[lang];

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return navigate('/login');

        const { data: adminData } = await supabase
          .from('admins')
          .select('*')
          .eq('auth_id', session.user.id)
          .single();

        if (!adminData) {
          alert(lang === 'ar' ? 'غير مصرح لك بالدخول.' : 'Access Denied.');
          return navigate('/');
        }

        // جلب الحجوزات
        const { data: bookingsData } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
        if (bookingsData) setAllBookings(bookingsData);

        // جلب الغرف
        const { data: roomsData } = await supabase.from('rooms').select('*').order('room_id', { ascending: true });
        if (roomsData) setRooms(roomsData);

      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate, lang]);

  // دالة تحديث الحجوزات
  const updateBookingStatus = async (bookingId, fieldToUpdate, newValue) => {
    try {
      const { error } = await supabase.from('bookings').update({ [fieldToUpdate]: newValue }).eq('booking_id', bookingId);
      if (error) throw error;
      setAllBookings(allBookings.map(b => b.booking_id === bookingId ? { ...b, [fieldToUpdate]: newValue } : b));
    } catch (error) {
      alert("حدث خطأ أثناء التحديث.");
    }
  };

  // ================= دوال إدارة الغرف =================

  // 1. إضافة غرفة
  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!newRoomId || !newRoomPrice) return;

    // صورة افتراضية أنيقة إذا لم يقم المدير بوضع رابط
    const defaultImage = "https://images.unsplash.com/photo-1522771731478-44eb10e5c836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

    try {
      const { error } = await supabase.from('rooms').insert([{
        room_id: newRoomId,
        price: Number(newRoomPrice),
        status: 'available',
        image_url: newRoomImage || defaultImage
      }]);

      if (error) throw error;

      // تحديث الواجهة
      setRooms([...rooms, { 
        room_id: newRoomId, 
        price: Number(newRoomPrice), 
        status: 'available',
        image_url: newRoomImage || defaultImage
      }]);
      
      setNewRoomId('');
      setNewRoomPrice('');
      setNewRoomImage(''); // تفريغ حقل الصورة
      alert(lang === 'ar' ? 'تم إضافة الغرفة بنجاح!' : 'Room added successfully!');
    } catch (error) {
      console.error(error);
      alert(lang === 'ar' ? 'تأكد أن رقم الغرفة غير مكرر.' : 'Make sure Room ID is unique.');
    }
  };

  // 2. حذف غرفة
  const handleDeleteRoom = async (roomId) => {
    const confirmDelete = window.confirm(lang === 'ar' ? `هل أنت متأكد من حذف الغرفة ${roomId}؟` : `Delete room ${roomId}?`);
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('rooms').delete().eq('room_id', roomId);
      if (error) throw error;
      setRooms(rooms.filter(r => r.room_id !== roomId));
    } catch (error) {
      alert(lang === 'ar' ? 'لا يمكن حذف غرفة بها حجوزات مسجلة.' : 'Cannot delete a room with existing bookings.');
    }
  };

  // 3. تغيير حالة الغرفة (صيانة / متاحة)
  const toggleRoomStatus = async (roomId, currentStatus) => {
    const newStatus = currentStatus === 'maintenance' ? 'available' : 'maintenance';
    try {
      const { error } = await supabase.from('rooms').update({ status: newStatus }).eq('room_id', roomId);
      if (error) throw error;
      setRooms(rooms.map(r => r.room_id === roomId ? { ...r, status: newStatus } : r));
    } catch (error) {
      alert("حدث خطأ أثناء التحديث.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className={`min-h-screen bg-gray-100 flex flex-col ${lang === 'en' ? 'font-en' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Navbar للإدارة */}
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

      {/* محتوى لوحة التحكم */}
      <div className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1b2a47] mb-8 border-b-4 border-[#5ca393] inline-block pb-2">
          {t.title}
        </h1>

        {/* أزرار التبويبات */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 pb-4">
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-2 font-bold rounded-lg transition-colors ${activeTab === 'bookings' ? 'bg-[#5ca393] text-white' : 'bg-white text-gray-500 hover:bg-gray-200'}`}
          >
            {t.tabBookings}
          </button>
          <button 
            onClick={() => setActiveTab('rooms')}
            className={`px-6 py-2 font-bold rounded-lg transition-colors ${activeTab === 'rooms' ? 'bg-[#5ca393] text-white' : 'bg-white text-gray-500 hover:bg-gray-200'}`}
          >
            {t.tabRooms}
          </button>
        </div>

        {loading ? (
          <div className="text-center text-xl font-bold text-gray-500 mt-20">جاري التحميل...</div>
        ) : activeTab === 'bookings' ? (
          // ================= تبويب الحجوزات =================
          allBookings.length === 0 ? (
            <div className="text-center mt-10 bg-white p-10 rounded-2xl shadow-sm border border-gray-200 text-xl font-bold text-gray-400">{t.noBookings}</div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                      <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.bookingId}</th>
                      <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.studentId}</th>
                      <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.room}</th>
                      <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.paymentStatus}</th>
                      <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.bookingStatus}</th>
                      <th className={`p-4 font-bold text-center`}>{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allBookings.map((booking) => (
                      <tr key={booking.booking_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className={`p-4 font-extrabold text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`}>{booking.booking_id}</td>
                        <td className={`p-4 text-gray-600 ${lang === 'ar' ? 'text-right' : ''}`}>{booking.student_id}</td>
                        <td className={`p-4 font-bold text-[#5ca393] ${lang === 'ar' ? 'text-right' : ''}`}>{booking.room_id}</td>
                        <td className={`p-4 ${lang === 'ar' ? 'text-right' : ''}`}>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${booking.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {booking.payment_status}
                          </span>
                        </td>
                        <td className={`p-4 ${lang === 'ar' ? 'text-right' : ''}`}>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${booking.booking_status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                            {booking.booking_status}
                          </span>
                        </td>
                        <td className="p-4 flex gap-2 justify-center">
                          {booking.payment_status !== 'paid' && (
                            <button onClick={() => updateBookingStatus(booking.booking_id, 'payment_status', 'paid')} className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600 transition-colors">
                              {t.markPaid}
                            </button>
                          )}
                          {booking.booking_status !== 'confirmed' && (
                            <button onClick={() => updateBookingStatus(booking.booking_id, 'booking_status', 'confirmed')} className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors">
                              {t.markConfirmed}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          // ================= تبويب إدارة الغرف =================
          <div className="space-y-8">
            {/* نموذج إضافة غرفة */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-[#1b2a47] mb-4">{t.addRoom}</h2>
              <form onSubmit={handleAddRoom} className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <input type="text" required value={newRoomId} onChange={(e) => setNewRoomId(e.target.value)} placeholder={t.roomIdPlaceholder} className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-[#5ca393] outline-none" />
                  <input type="number" required value={newRoomPrice} onChange={(e) => setNewRoomPrice(e.target.value)} placeholder={t.pricePlaceholder} className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-[#5ca393] outline-none" />
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <input type="text" value={newRoomImage} onChange={(e) => setNewRoomImage(e.target.value)} placeholder={t.imagePlaceholder} className="flex-grow p-3 border border-gray-300 rounded-xl focus:ring-[#5ca393] outline-none" dir="ltr" />
                  <button type="submit" className="px-8 py-3 bg-[#1b2a47] text-white font-bold rounded-xl hover:bg-[#2a406b] transition-colors whitespace-nowrap">{t.btnAdd}</button>
                </div>
              </form>
            </div>

            {/* جدول الغرف */}
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
                        <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.price}</th>
                        <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.bookingStatus}</th>
                        <th className={`p-4 font-bold text-center`}>{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map((room) => (
                        <tr key={room.room_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <img src={room.image_url || "https://images.unsplash.com/photo-1522771731478-44eb10e5c836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} alt="room" className="w-16 h-12 object-cover rounded-md border" />
                          </td>
                          <td className={`p-4 font-extrabold text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`}>{room.room_id}</td>
                          <td className={`p-4 text-gray-600 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{room.price} EGP</td>
                          <td className={`p-4 ${lang === 'ar' ? 'text-right' : ''}`}>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize 
                              ${room.status === 'available' ? 'bg-green-100 text-green-700' : 
                                room.status === 'maintenance' ? 'bg-orange-100 text-orange-700' : 
                                'bg-gray-200 text-gray-700'}`}>
                              {room.status}
                            </span>
                          </td>
                          <td className="p-4 flex gap-2 justify-center items-center h-full mt-2">
                            {/* زر الصيانة / الإتاحة */}
                            <button 
                              onClick={() => toggleRoomStatus(room.room_id, room.status)} 
                              className={`px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-colors ${room.status === 'maintenance' ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                            >
                              {room.status === 'maintenance' ? t.btnAvailable : t.btnMaintenance}
                            </button>

                            {/* زر الحذف */}
                            <button 
                              onClick={() => handleDeleteRoom(room.room_id)} 
                              className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors"
                            >
                              {t.btnDelete}
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
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;