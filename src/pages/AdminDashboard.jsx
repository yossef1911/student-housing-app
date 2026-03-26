// بنجيب الأدوات الأساسية من مكتبة React.
import React, { useState, useEffect } from 'react';
// بنجيب أداة التنقل عشان ننقل اليوزر بين الصفحات.
import { useNavigate } from 'react-router-dom';
// اللوجو بتاع الموقع.
import logo from '../assets/logo.png';
// أداة الاتصال بقاعدة البيانات بتاعتنا.
import { supabase } from '../services/supabaseClient';

// =====================================================================
// المكون الأول: CountdownTimer (عداد تنازلي)
// ده مكون صغير وظيفته إنه ياخد تاريخ معين (targetDate) ويفضل يحسب 
// الوقت المتبقي لحد التاريخ ده (أيام، ساعات، دقايق، ثواني) ويعرضه.
// بنستخدمه عشان نبين للطلاب الغرفة اللي في "صيانة" هتخلص صيانة إمتى.
// =====================================================================
const CountdownTimer = ({ targetDate, lang }) => {
  // مخزن بنشيل فيه النص اللي هيتعرض على الشاشة (الوقت المتبقي).
  const [timeLeft, setTimeLeft] = useState('');

  // الـ useEffect دي بتشتغل أول ما المكون يظهر، وبنشغل جواه عداد (interval) بيشتغل كل ثانية.
  useEffect(() => {
    // لو مفيش تاريخ مبعوت، متعملش حاجة ووقف.
    if (!targetDate) return;
    
    // بنعمل عداد يتكرر كل 1000 ملي ثانية (يعني كل ثانية).
    const interval = setInterval(() => {
      const now = new Date().getTime(); // الوقت بتاع دلوقتي
      const target = new Date(targetDate).getTime(); // الوقت اللي المفروض الصيانة تخلص فيه
      const difference = target - now; // الفرق بينهم بالملي ثانية

      // لو الفرق بقى صفر أو أقل، معناه إن الوقت خلص.
      if (difference <= 0) {
        setTimeLeft(lang === 'ar' ? 'انتهت الصيانة' : 'Maintenance Ended');
        clearInterval(interval); // بنوقف العداد عشان ميفضلش يعد في الفاضي
      } else {
        // لو لسه فيه وقت، بنحسب كام يوم، وساعة، ودقيقة، وثانية.
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        // بنظبط شكل الوقت عشان لو رقم واحد (زي 5) يكتبه (05).
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        // بنحط النص النهائي في المخزن عشان يتعرض.
        setTimeLeft(lang === 'ar' ? `${days} يوم و ${formattedTime}` : `${days}d ${formattedTime}`);
      }
    }, 1000); // سرعة العداد ثانية واحدة

    // دي دالة تنضيف (cleanup) بتشتغل لما المكون ده يختفي من الشاشة عشان تمسح العداد وتوفر موارد الجهاز.
    return () => clearInterval(interval);
  }, [targetDate, lang]);

  // هنا بنرسم العداد على الشاشة بلون أحمر صغير.
  return <span className="text-xs font-bold text-red-500 block mt-2 bg-red-50 px-2 py-1 rounded border border-red-100" dir="ltr">{timeLeft}</span>;
};


// =====================================================================
// المكون التاني والأساسي: AdminDashboard (لوحة تحكم الإدارة)
// =====================================================================
const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // مخزن اللغة.
  const [lang, setLang] = useState('en');
  // مخزن عشان نعرف إحنا فاتحين أي تبويب (حجوزات، غرف، ولا طلاب). الافتراضي 'bookings'.
  const [activeTab, setActiveTab] = useState('bookings'); 
  
  // مخازن البيانات اللي هنجيبها من قاعدة البيانات.
  const [allBookings, setAllBookings] = useState([]); // كل الحجوزات
  const [rooms, setRooms] = useState([]); // كل الغرف
  const [students, setStudents] = useState([]); // كل الطلاب
  const [loading, setLoading] = useState(true); // حالة التحميل عشان نظهر شاشة "جاري التحميل"
  const [totalRevenue, setTotalRevenue] = useState(0); // إجمالي الفلوس اللي ادفعت

  // مخازن للبيانات اللي الإدمن بيكتبها لما يحب يضيف غرفة جديدة.
  const [newRoomId, setNewRoomId] = useState('');
  const [newRoomPrice, setNewRoomPrice] = useState('');
  const [newRoomImage, setNewRoomImage] = useState('');

  // مخزن عشان نعرف أي طالب مفتوح السجل بتاعه (عشان نظهر حجوزاته القديمة).
  const [expandedStudentId, setExpandedStudentId] = useState(null);

  // ده مخزن للمودال (النافذة المنبثقة) اللي بنستخدمها بدل الـ alert بتاع المتصفح عشان شكلها أشيك.
  // بتحفظ حالة المودال مفتوح ولا لأ، نوعه إيه (تعديل سعر، حذف غرفة، خطأ)، والرسالة اللي جواه.
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null, data: null, message: '' });
  // مخزن للقيمة اللي الإدمن بيكتبها جوه المودال (زي السعر الجديد أو رابط الصورة).
  const [modalInput, setModalInput] = useState('');

  // دالة صغيرة بتقفل المودال وتمسح اللي جواه.
  const closeModal = () => {
    setModalConfig({ isOpen: false, type: null, data: null, message: '' });
    setModalInput('');
  };

  // قاموس الترجمة بتاع صفحة الإدمن.
  const t = {
    en: {
      toggleLang: "عربي", logout: "Logout", title: "Admin Dashboard",
      tabBookings: "Bookings", tabRooms: "Rooms", tabStudents: "Students",
      bookingId: "Booking ID", studentId: "Student ID", room: "Room", price: "Price",
      paymentStatus: "Payment", bookingStatus: "Status", actions: "Actions",
      noBookings: "No bookings.", noRooms: "No rooms.", noStudents: "No students registered.",
      markPaid: "Mark Paid", markConfirmed: "Confirm", cancelBooking: "Cancel",
      paidSuccess: "✅ Paid", canceled: "Canceled", refunded: "Refunded",
      timeLeft: "Time Left", days: "Days", occupant: "Occupant ID",
      studentName: "Student Name", email: "Email", roomsBooked: "Active Rooms",
      totalRevenue: "Total Revenue (Paid)", currency: "EGP",
      addRoom: "Add Room", roomIdPlaceholder: "ID (e.g. 104)", pricePlaceholder: "Price (e.g. 1500)", imagePlaceholder: "Image URL",
      btnAdd: "Add", btnDelete: "Delete", btnMaintenance: "Maintenance", btnAvailable: "Make Available",
      btnEditImage: "Edit Image", btnEditPrice: "Edit Price", viewBookings: "Booking History", hideBookings: "Hide History",
      btnBlock: "Block 🚫", btnUnblock: "Unblock ✅", blacklisted: "Blacklisted",
      modalCancelTitle: "Cancel Booking", modalCancelText: "Cancelling this booking will move it to history and put the room in maintenance. Are you sure?",
      modalDeleteTitle: "Delete Room", modalDeleteText: "Are you sure you want to permanently delete this room?",
      modalEditImageTitle: "Edit Room Image", modalEditImagePlaceholder: "Paste the new image URL here...",
      modalEditPriceTitle: "Edit Room Price", modalEditPricePlaceholder: "Enter the new price...",
      btnModalCancel: "Go Back", btnModalConfirm: "Confirm", btnModalSave: "Save",
      modalErrorTitle: "Notice ❌",
      btnOkay: "OK",
      errorDuplicateRoom: "Duplicate Room ID. This room already exists.",
      errorHasHistory: "Cannot delete, room has booking history.",
      errorUpdate: "An error occurred during update.",
      errorGeneral: "An unexpected error occurred.",
      errorAuth: "Access Denied."
    },
    ar: {
      toggleLang: "English", logout: "خروج", title: "لوحة تحكم الإدارة",
      tabBookings: "الحجوزات", tabRooms: " الغرف", tabStudents: "الطلاب",
      bookingId: "رقم الحجز", studentId: "كود الطالب", room: "غرفة", price: "السعر",
      paymentStatus: "حالة الدفع", bookingStatus: "الحجز", actions: "إجراءات",
      noBookings: "لا حجوزات.", noRooms: "لا غرف.", noStudents: "لا يوجد طلاب مسجلين.",
      markPaid: "تأكيد الدفع 🟢", markConfirmed: "تأكيد الحجز", cancelBooking: "إلغاء",
      paidSuccess: "✅ تم الدفع", canceled: "ملغي", refunded: "مسترد",
      timeLeft: "المتبقي الترم", days: "أيام", occupant: "كود الطالب",
      studentName: "اسم الطالب", email: "الإيميل", roomsBooked: "الغرف النشطة",
      totalRevenue: "إجمالي الإيرادات (المحصلة)", currency: "جنية",
      addRoom: "إضافة غرفة", roomIdPlaceholder: "مثال 104", pricePlaceholder: "السعر مثال 1500", imagePlaceholder: "رابط الصورة",
      btnAdd: "إضافة", btnDelete: "حذف", btnMaintenance: "صيانة", btnAvailable: "إتاحة للطلاب",
      btnEditImage: "تعديل الصورة", btnEditPrice: "تعديل السعر", viewBookings: "سجل الحجوزات", hideBookings: "إخفاء السجل",
      btnBlock: "حظر الطالب 🚫", btnUnblock: "إلغاء الحظر ✅", blacklisted: "محظور",
      modalCancelTitle: "إلغاء الحجز", modalCancelText: "إلغاء هذا الحجز سيحوله إلى سجل الحجوزات الملغية ويجعل الغرفة في صيانة. هل أنت متأكد؟",
      modalDeleteTitle: "حذف الغرفة", modalDeleteText: "هل أنت متأكد من حذف هذه الغرفة نهائياً؟",
      modalEditImageTitle: "تعديل صورة الغرفة", modalEditImagePlaceholder: "ضع رابط الصورة الجديد هنا...",
      modalEditPriceTitle: "تعديل سعر الغرفة", modalEditPricePlaceholder: "أدخل السعر الجديد للغرفة...",
      btnModalCancel: "تراجع", btnModalConfirm: "تأكيد", btnModalSave: "حفظ",
      modalErrorTitle: "تنبيه ❌",
      btnOkay: "حسناً",
      errorDuplicateRoom: "رقم الغرفة مكرر. هذه الغرفة مسجلة بالفعل.",
      errorHasHistory: "لا يمكن الحذف، الغرفة بها حجوزات مسجلة (حتى لو كانت ملغية).",
      errorUpdate: "حدث خطأ أثناء التحديث.",
      errorGeneral: "حدث خطأ غير متوقع.",
      errorAuth: "غير مصرح لك بالدخول."
    }
  }[lang];

  // =====================================================================
  // تحميل البيانات الأساسية (useEffect)
  // الدالة دي بتشتغل أول ما صفحة الإدارة تفتح عشان تجيب كل الداتا.
  // =====================================================================
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // 1. بنتأكد الأول إن فيه حد مسجل دخول أصلاً.
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return navigate('/login'); // لو مفيش، بنطرده لصفحة الدخول.

        // 2. بنتأكد إن اليوزر اللي دخل ده "إدمن" فعلاً مش طالب عادي.
        const { data: adminData } = await supabase.from('admins').select('*').eq('auth_id', session.user.id).single();
        if (!adminData) {
          // لو طلع مش إدمن، بنظهرله مودال خطأ، وبعد ثانيتين بنرميه على الصفحة الرئيسية.
          setModalConfig({ isOpen: true, type: 'error', message: t.errorAuth });
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        // 3. بنجيب كل الحجوزات اللي في السيستم، ونرتبهم من الأحدث للأقدم.
        const { data: bookingsData } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
        let tempRevenue = 0; // ده متغير هنحسب فيه الفلوس.
        
        // 4. بنجيب بيانات كل الغرف.
        const { data: roomsData } = await supabase.from('rooms').select('*').order('room_id', { ascending: true });
        if (roomsData) setRooms(roomsData); // وبنحفظها في المخزن.

        // 5. بنحفظ الحجوزات في المخزن، وبنحسب إجمالي الإيرادات.
        if (bookingsData) {
          setAllBookings(bookingsData);
          if(roomsData) {
              bookingsData.forEach(b => {
                  // الفلوس بتتحسب بس للحجوزات اللي الدفع بتاعها "تم (paid)" ومش ملغية.
                  if(b.payment_status === 'paid' && b.booking_status !== 'canceled') {
                      const roomPrice = roomsData.find(r => r.room_id === b.room_id)?.price || 0;
                      tempRevenue += roomPrice; // بنجمع سعر الغرفة على الإجمالي
                  }
              });
          }
          setTotalRevenue(tempRevenue); // بنحفظ الإجمالي النهائي في المخزن
        }

        // 6. بنجيب بيانات كل الطلاب ونحفظهم.
        const { data: studentsData } = await supabase.from('students').select('*');
        if (studentsData) setStudents(studentsData);

      } catch (error) {
        console.error("Error:", error);
      } finally {
        // في الآخر بنقفل حالة التحميل عشان الشاشة تظهر الداتا.
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [navigate, lang]); // الـ effect ده بيعتمد على المتغيرين دول.

  // =====================================================================
  // دوال مساعدة (Helper Functions)
  // =====================================================================
  
  // دالة بتجيب كل حجوزات طالب معين عن طريق الآي دي بتاعه.
  const getStudentBookingsList = (studentId) => {
    return allBookings.filter(b => b.student_id === studentId);
  };

  // دالة بتحسب فاضل كام يوم على نهاية الترم (بافتراض إن الترم 90 يوم من تاريخ الحجز).
  const getRemainingDays = (createdAt) => {
    const endDate = new Date(createdAt);
    endDate.setDate(endDate.getDate() + 90); 
    const diffDays = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // دالة عامة لتحديث حالة أي حجز (مثلاً من معلق لـ مؤكد، أو من غير مدفوع لـ مدفوع).
  const updateBookingStatus = async (bookingId, fieldToUpdate, newValue) => {
    try {
      // بنبعت التحديث لقاعدة البيانات
      const { error } = await supabase.from('bookings').update({ [fieldToUpdate]: newValue }).eq('booking_id', bookingId);
      if (error) throw error;
      
      // بنحدث الداتا اللي في الشاشة فوراً عشان منضطرش نعمل ريفريش للصفحة.
      setAllBookings(allBookings.map(b => b.booking_id === bookingId ? { ...b, [fieldToUpdate]: newValue } : b));
      
      // لو التحديث ده كان إننا أكدنا عملية الدفع (paid)، بنزود سعر الغرفة دي على إجمالي الإيرادات.
      if(fieldToUpdate === 'payment_status' && newValue === 'paid') {
          const booking = allBookings.find(b => b.booking_id === bookingId);
          const roomPrice = rooms.find(r => r.room_id === booking.room_id)?.price || 0;
          setTotalRevenue(prev => prev + roomPrice);
      }
    } catch (error) {
      setModalConfig({ isOpen: true, type: 'error', message: t.errorGeneral });
    }
  };

  // =====================================================================
  // دوال تنفيذ الـ المودال (لما الإدمن يدوس تأكيد جوه النافذة المنبثقة)
  // =====================================================================
  
  // دالة إلغاء الحجز
  const executeCancelBooking = async () => {
    // بنجيب رقم الحجز ورقم الغرفة من الداتا اللي بعتناها للمودال.
    const { bookingId, roomId } = modalConfig.data;
    // بنحسب تاريخ نهاية الصيانة (بعد 10 أيام من النهارده).
    const maintenanceEndDate = new Date();
    maintenanceEndDate.setDate(maintenanceEndDate.getDate() + 10);

    try {
      const booking = allBookings.find(b => b.booking_id === bookingId);
      // لو الطالب كان دافع، فلوسه هتبقى "مستردة" (refunded). لو مكانش دافع، بتفضل زي ما هي.
      const newPaymentStatus = booking.payment_status === 'paid' ? 'refunded' : booking.payment_status;

      // 1. بنخلي حالة الحجز ملغية وحالة الدفع تتحدث في قاعدة البيانات.
      const { error: bookingError } = await supabase.from('bookings').update({ 
        booking_status: 'canceled',
        payment_status: newPaymentStatus
      }).eq('booking_id', bookingId);

      // لو قاعدة البيانات اعترضت (عشان الـ constraints اللي شارحينها في رسالة الخطأ دي).
      if (bookingError) {
        setModalConfig({ 
          isOpen: true, 
          type: 'error', 
          message: lang === 'ar' ? "قاعدة البيانات ترفض حالة الإلغاء بسبب القيود الصارمة (Constraints).\n\nيرجى فتح الـ SQL Editor في Supabase وتنفيذ الكود لحل المشكلة نهائياً." : "Database constraint error. Please run the SQL fix."
        });
        return;
      }

      // 2. بنخلي حالة الغرفة "صيانة" ونديها تاريخ النهاية.
      const { error: roomError } = await supabase.from('rooms').update({ status: 'maintenance', maintenance_end: maintenanceEndDate.toISOString() }).eq('room_id', roomId);
      if (roomError) throw roomError;

      // 3. بننقص الفلوس بتاعة الغرفة دي من الإيرادات (لأننا لغيناها).
      if(booking.payment_status === 'paid') {
          const roomPrice = rooms.find(r => r.room_id === roomId)?.price || 0;
          setTotalRevenue(prev => prev - roomPrice);
      }

      // 4. بنحدث الشاشة.
      setAllBookings(allBookings.map(b => b.booking_id === bookingId ? { ...b, booking_status: 'canceled', payment_status: newPaymentStatus } : b));
      setRooms(rooms.map(r => r.room_id === roomId ? { ...r, status: 'maintenance', maintenance_end: maintenanceEndDate.toISOString() } : r));
      
      closeModal();
    } catch (error) {
      setModalConfig({ isOpen: true, type: 'error', message: t.errorGeneral + " " + error.message });
    }
  };

  // دالة حذف الغرفة
  const executeDeleteRoom = async () => {
    const { roomId } = modalConfig.data;
    try {
      // بنحذف الغرفة من الجدول.
      const { error } = await supabase.from('rooms').delete().eq('room_id', roomId);
      if (error) throw error;
      // بنشيلها من الشاشة.
      setRooms(rooms.filter(r => r.room_id !== roomId));
      closeModal();
    } catch (error) {
      // غالباً الخطأ ده بيحصل لو الغرفة دي كان ليها حجز قديم، فقاعدة البيانات بترفض تمسحها عشان السجلات متبوظش.
      setModalConfig({ isOpen: true, type: 'error', message: t.errorHasHistory });
    }
  };

  // دالة تعديل صورة الغرفة
  const executeEditImage = async () => {
    const { roomId } = modalConfig.data;
    if (!modalInput || modalInput.trim() === '') return; // لو الخانة فاضية، متعملش حاجة.
    try {
      const { error } = await supabase.from('rooms').update({ image_url: modalInput }).eq('room_id', roomId);
      if (error) throw error;
      setRooms(rooms.map(r => r.room_id === roomId ? { ...r, image_url: modalInput } : r));
      closeModal();
    } catch (error) {
      setModalConfig({ isOpen: true, type: 'error', message: t.errorUpdate });
    }
  };

  // دالة تعديل سعر الغرفة
  const executeEditPrice = async () => {
    const { roomId } = modalConfig.data;
    const newPrice = Number(modalInput); // بنحول القيمة لرقم.
    if (!newPrice || isNaN(newPrice)) return;
    try {
      const { error } = await supabase.from('rooms').update({ price: newPrice }).eq('room_id', roomId);
      if (error) throw error;
      setRooms(rooms.map(r => r.room_id === roomId ? { ...r, price: newPrice } : r));
      closeModal();
    } catch (error) {
      setModalConfig({ isOpen: true, type: 'error', message: t.errorUpdate });
    }
  };

  // =====================================================================
  // دوال أخرى (الطلاب وإضافة غرف)
  // =====================================================================

  // دالة بتعمل حظر (Blacklist) للطالب أو تلغيه.
  const toggleStudentBlacklist = async (studentId, currentStatus) => {
    const newStatus = !currentStatus; // بنعكس الحالة (لو محظور نفكه، ولو مش محظور نحظره).
    try {
      const { error } = await supabase.from('students').update({ is_blacklisted: newStatus }).eq('student_id', studentId);
      if (error) throw error;
      setStudents(students.map(s => s.student_id === studentId ? { ...s, is_blacklisted: newStatus } : s));
    } catch (error) {
      setModalConfig({ isOpen: true, type: 'error', message: t.errorGeneral });
    }
  };

  // دالة إضافة غرفة جديدة.
  const handleAddRoom = async (e) => {
    e.preventDefault(); // نمنع الريفريش
    if (!newRoomId || !newRoomPrice) return;
    // صورة افتراضية لو الإدمن محطش صورة للغرفة.
    const defaultImage = "https://images.unsplash.com/photo-1522771731478-44eb10e5c836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

    try {
      const { error } = await supabase.from('rooms').insert([{
        room_id: newRoomId, price: Number(newRoomPrice), status: 'available', image_url: newRoomImage || defaultImage
      }]);
      if (error) throw error;
      
      // بنزود الغرفة في الشاشة وبنفضي خانات الإدخال.
      setRooms([...rooms, { room_id: newRoomId, price: Number(newRoomPrice), status: 'available', image_url: newRoomImage || defaultImage }]);
      setNewRoomId(''); setNewRoomPrice(''); setNewRoomImage('');
    } catch (error) {
      // لو الغرفة متسجلة قبل كده (مكررة)، بنطلع النافذة المنبثقة بخطأ.
      setModalConfig({ isOpen: true, type: 'error', message: t.errorDuplicateRoom });
    }
  };

  // دالة بتغير حالة الغرفة من صيانة لمتاحة، والعكس.
  const toggleRoomStatus = async (roomId, currentStatus) => {
    const isMaintenance = currentStatus !== 'maintenance';
    const newStatus = isMaintenance ? 'maintenance' : 'available';
    let maintenanceEnd = null;
    // لو هنخليها صيانة، بنحسب تاريخ 10 أيام قدام ونحفظه.
    if (isMaintenance) { const d = new Date(); d.setDate(d.getDate() + 10); maintenanceEnd = d.toISOString(); }

    try {
      const { error } = await supabase.from('rooms').update({ status: newStatus, maintenance_end: maintenanceEnd }).eq('room_id', roomId);
      if (error) throw error;
      setRooms(rooms.map(r => r.room_id === roomId ? { ...r, status: newStatus, maintenance_end: maintenanceEnd } : r));
    } catch (error) {
      setModalConfig({ isOpen: true, type: 'error', message: t.errorGeneral });
    }
  };

  // دالة تسجيل الخروج.
  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };
  
  // دالة بتمنع الإدمن إنه يكتب حروف زي (-) أو (e) في خانة السعر لأنها المفروض أرقام بس.
  const handlePriceKeyDown = (e) => { if (e.key === '-' || e.key === 'e' || e.key === '+' || e.key === '.') { e.preventDefault(); } };

  // =====================================================================
  // واجهة المستخدم (التصميم والـ JSX)
  // =====================================================================
  return (
    <div className={`min-h-screen bg-gray-100 flex flex-col ${lang === 'en' ? 'font-en' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* ================== شاشة المودال الاحترافية ================== */}
      {/* دي النافذة المنبثقة اللي بتظهر في نص الشاشة لما الإدمن يحب يعمل أكشن خطير (زي حذف أو تعديل) */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-down">
            
            {/* عنوان المودال */}
            <div className={`p-6 border-b border-gray-100 ${modalConfig.type === 'error' ? 'bg-red-50' : 'bg-white'}`}>
              <h3 className={`text-xl font-extrabold ${modalConfig.type === 'error' ? 'text-red-600' : 'text-[#1b2a47]'}`}>
                {modalConfig.type === 'editImage' ? t.modalEditImageTitle : 
                 modalConfig.type === 'editPrice' ? t.modalEditPriceTitle :
                 modalConfig.type === 'deleteRoom' ? t.modalDeleteTitle : 
                 modalConfig.type === 'error' ? t.modalErrorTitle : t.modalCancelTitle}
              </h3>
            </div>
            
            {/* محتوى المودال (الخانات أو الرسالة اللي جواه) */}
            <div className="p-6 text-gray-600 font-bold">
              {modalConfig.type === 'editImage' ? (
                // خانة تعديل رابط الصورة
                <input type="text" value={modalInput} onChange={(e) => setModalInput(e.target.value)} placeholder={t.modalEditImagePlaceholder} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#5ca393]" dir="ltr" />
              ) : modalConfig.type === 'editPrice' ? (
                // خانة تعديل السعر
                <input type="number" value={modalInput} onChange={(e) => setModalInput(e.target.value)} onKeyDown={handlePriceKeyDown} placeholder={t.modalEditPricePlaceholder} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#5ca393]" dir="ltr" />
              ) : modalConfig.type === 'deleteRoom' ? (
                // رسالة تأكيد الحذف
                <p className="text-red-500">{t.modalDeleteText} الغرفة: {modalConfig.data?.roomId}</p>
              ) : modalConfig.type === 'error' ? (
                // رسالة الخطأ (لو المودال نوعه إيرور)
                <p className="text-red-500 whitespace-pre-line leading-relaxed">{modalConfig.message}</p>
              ) : (
                // رسالة تأكيد إلغاء الحجز
                <p className="text-orange-500">{t.modalCancelText}</p>
              )}
            </div>

            {/* زراير المودال اللي تحت (تأكيد أو إلغاء) */}
            <div className="p-4 bg-gray-50 flex justify-end gap-3">
              {modalConfig.type === 'error' ? (
                // لو هو مودال خطأ بنظهر زرار "حسناً" بس اللي بيقفل المودال.
                <button onClick={closeModal} className="px-5 py-2.5 bg-red-500 text-white font-bold hover:bg-red-600 rounded-lg transition-colors shadow-md">
                  {t.btnOkay}
                </button>
              ) : (
                // لو مودال أكشن بنظهر زرارين: تأكيد وإلغاء.
                <>
                  <button onClick={closeModal} className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-200 rounded-lg transition-colors">{t.btnModalCancel}</button>
                  <button 
                    onClick={() => {
                      // هنا بنشوف المودال كان مفتوح عشان إيه، ونشغل الدالة الصح.
                      if(modalConfig.type === 'editImage') executeEditImage();
                      if(modalConfig.type === 'editPrice') executeEditPrice();
                      if(modalConfig.type === 'deleteRoom') executeDeleteRoom();
                      if(modalConfig.type === 'cancelBooking') executeCancelBooking();
                    }} 
                    className={`px-5 py-2.5 text-white font-bold rounded-lg transition-colors shadow-md ${
                      (modalConfig.type === 'editImage' || modalConfig.type === 'editPrice') ? 'bg-[#5ca393] hover:bg-[#458b7c]' : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {(modalConfig.type === 'editImage' || modalConfig.type === 'editPrice') ? t.btnModalSave : t.btnModalConfirm}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* الشريط العلوي الخاص بلوحة التحكم */}
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
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1b2a47] mb-8 border-b-4 border-[#5ca393] inline-block pb-2">{t.title}</h1>

        {/* زراير التنقل بين الأقسام (حجوزات، غرف، طلاب) */}
        <div className="flex gap-2 sm:gap-4 mb-8 border-b border-gray-200 pb-4 flex-wrap">
          <button onClick={() => setActiveTab('bookings')} className={`px-4 sm:px-6 py-2 font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === 'bookings' ? 'bg-[#5ca393] text-white' : 'bg-white text-gray-500 hover:bg-gray-200'}`}>{t.tabBookings}</button>
          <button onClick={() => setActiveTab('rooms')} className={`px-4 sm:px-6 py-2 font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === 'rooms' ? 'bg-[#5ca393] text-white' : 'bg-white text-gray-500 hover:bg-gray-200'}`}>{t.tabRooms}</button>
          <button onClick={() => setActiveTab('students')} className={`px-4 sm:px-6 py-2 font-bold rounded-lg transition-colors whitespace-nowrap ${activeTab === 'students' ? 'bg-[#5ca393] text-white' : 'bg-white text-gray-500 hover:bg-gray-200'}`}>{t.tabStudents}</button>
        </div>

        {/* لو الداتا لسه بتحمل نظهر النقط دي، لو خلصت تحميل نعرض المحتوى حسب التبويب اللي اختاره الإدمن */}
        {loading ? (
          <div className="text-center text-xl font-bold text-gray-500 mt-20">...</div>
        ) : activeTab === 'bookings' ? (
          // ================== تبويب الحجوزات ==================
          <div>
            {/* مربع إجمالي الإيرادات */}
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 mb-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-3xl">💰</div>
                    <div>
                        <div className="text-gray-500 font-bold">{t.totalRevenue}</div>
                        <div className="text-4xl font-extrabold text-[#5ca393]">{totalRevenue.toLocaleString()} <span className="text-sm text-gray-400">{t.currency}</span></div>
                    </div>
                </div>
            </div>

            {/* جدول الحجوزات */}
            {allBookings.length === 0 ? (
              <div className="text-center mt-10 bg-white p-10 rounded-2xl shadow-sm border border-gray-200 text-xl font-bold text-gray-400">{t.noBookings}</div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600">
                        {/* رؤوس الأعمدة */}
                        <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.bookingId}</th>
                        <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.studentId}</th>
                        <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.room}</th>
                        <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.timeLeft}</th>
                        <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.paymentStatus}</th>
                        <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.bookingStatus}</th>
                        <th className={`p-4 font-bold text-center`}>{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* بنلف على كل حجز ونرسمه في سطر */}
                      {allBookings.map((booking) => (
                        <tr key={booking.booking_id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${booking.booking_status === 'canceled' ? 'opacity-60 bg-gray-50' : ''}`}>
                          <td className={`p-4 font-extrabold text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`}>{booking.booking_id}</td>
                          <td className={`p-4 text-[#5ca393] font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{booking.student_id}</td>
                          <td className={`p-4 font-bold text-gray-700 ${lang === 'ar' ? 'text-right' : ''}`}>{booking.room_id}</td>
                          {/* الوقت المتبقي من الترم */}
                          <td className={`p-4 font-bold text-orange-500 ${lang === 'ar' ? 'text-right' : ''}`}>
                            {booking.booking_status !== 'canceled' ? `${getRemainingDays(booking.created_at)} ${t.days}` : '-'}
                          </td>
                          {/* حالة الدفع وتنسيق الألوان بتاعها */}
                          <td className={`p-4 ${lang === 'ar' ? 'text-right' : ''}`}>
                            {booking.payment_status === 'paid' ? (
                                <span className="text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full text-xs">{t.paidSuccess}</span>
                            ) : booking.payment_status === 'refunded' ? (
                                <span className="text-gray-500 font-bold bg-gray-200 px-3 py-1 rounded-full text-xs">{t.refunded}</span>
                            ) : (
                                <span className="px-3 py-1 rounded-full text-xs font-bold capitalize bg-yellow-100 text-yellow-700">{booking.payment_status}</span>
                            )}
                          </td>
                          {/* حالة الحجز نفسه */}
                          <td className={`p-4 ${lang === 'ar' ? 'text-right' : ''}`}>
                            {booking.booking_status === 'canceled' ? (
                                <span className="px-3 py-1 rounded-full text-xs font-bold capitalize bg-red-100 text-red-700">{t.canceled}</span>
                            ) : (
                                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${booking.booking_status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>{booking.booking_status}</span>
                            )}
                          </td>
                          {/* زراير الإجراءات (دفع، تأكيد، إلغاء) */}
                          <td className="p-4 flex gap-2 justify-center flex-wrap min-w-[200px]">
                            {booking.booking_status !== 'canceled' && (
                              <>
                                {booking.payment_status !== 'paid' && (
                                  <button onClick={() => updateBookingStatus(booking.booking_id, 'payment_status', 'paid')} className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg hover:bg-green-600">{t.markPaid}</button>
                                )}
                                {booking.booking_status !== 'confirmed' && (
                                  <button onClick={() => updateBookingStatus(booking.booking_id, 'booking_status', 'confirmed')} className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600">{t.markConfirmed}</button>
                                )}
                                <button onClick={() => setModalConfig({ isOpen: true, type: 'cancelBooking', data: { bookingId: booking.booking_id, roomId: booking.room_id } })} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600">{t.cancelBooking}</button>
                              </>
                            )}
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
          // ================== تبويب الغرف ==================
          <div className="space-y-8">
            {/* فورمة إضافة غرفة جديدة */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
              <form onSubmit={handleAddRoom} className="flex flex-col sm:flex-row gap-3">
                  <input type="text" required value={newRoomId} onChange={(e) => setNewRoomId(e.target.value)} placeholder={t.roomIdPlaceholder} className="w-full sm:w-28 p-2.5 border border-gray-300 rounded-lg" />
                  <input type="number" min="0" onKeyDown={handlePriceKeyDown} required value={newRoomPrice} onChange={(e) => setNewRoomPrice(e.target.value)} placeholder={t.pricePlaceholder} className="w-full sm:w-36 p-2.5 border border-gray-300 rounded-lg" />
                  <input type="text" value={newRoomImage} onChange={(e) => setNewRoomImage(e.target.value)} placeholder={t.imagePlaceholder} className="flex-grow p-2.5 border border-gray-300 rounded-lg" dir="ltr" />
                  <button type="submit" className="px-6 py-2.5 bg-[#1b2a47] text-white font-bold rounded-lg hover:bg-[#2a406b]">{t.btnAdd}</button>
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
                        <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.occupant}</th>
                        <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.price}</th>
                        <th className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{t.bookingStatus}</th>
                        <th className={`p-4 font-bold text-center`}>{t.actions}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* بنلف على كل الغرف لعرضها */}
                      {rooms.map((room) => {
                        // بندور لو الغرفة دي ليها حجز شغال دلوقتي عشان نعرض رقم الطالب اللي قاعد فيها.
                        const activeBooking = allBookings.find(b => b.room_id === room.room_id && b.booking_status !== 'canceled');
                        return (
                          <tr key={room.room_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="p-4"><img src={room.image_url || "https://images.unsplash.com/photo-1522771731478-44eb10e5c836?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"} alt="room" className="w-16 h-12 object-cover rounded-md border" /></td>
                            <td className={`p-4 font-extrabold text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`}>{room.room_id}</td>
                            <td className={`p-4 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{room.status === 'booked' && activeBooking ? <span className="bg-blue-50 text-[#5ca393] px-2 py-1 rounded-lg border border-blue-100">{activeBooking.student_id}</span> : <span className="text-gray-400">-</span>}</td>
                            <td className={`p-4 text-gray-600 font-bold ${lang === 'ar' ? 'text-right' : ''}`}>{room.price} EGP</td>
                            <td className={`p-4 ${lang === 'ar' ? 'text-right' : ''}`}>
                              {/* حالة الغرفة (متاحة، محجوزة، صيانة) */}
                              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${room.status === 'available' ? 'bg-green-100 text-green-700' : room.status === 'booked' ? 'bg-blue-100 text-blue-700' : room.status === 'maintenance' ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-700'}`}>{room.status}</span>
                              {/* لو صيانة، بنعرض المكون بتاع العداد التنازلي اللي شرحناه فوق */}
                              {room.status === 'maintenance' && room.maintenance_end && <CountdownTimer targetDate={room.maintenance_end} lang={lang} />}
                            </td>
                            {/* زراير الإجراءات بتاعت الغرفة وكلها بتنادي على المودال المنبثق اللي شرحناه */}
                            <td className="p-4 flex gap-2 justify-center items-center flex-wrap pt-5">
                              <button onClick={() => { setModalInput(room.price); setModalConfig({ isOpen: true, type: 'editPrice', data: { roomId: room.room_id } }); }} className="px-3 py-1.5 bg-purple-500 text-white text-xs font-bold rounded-lg hover:bg-purple-600">{t.btnEditPrice}</button>
                              <button onClick={() => { setModalInput(room.image_url || ''); setModalConfig({ isOpen: true, type: 'editImage', data: { roomId: room.room_id } }); }} className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600">{t.btnEditImage}</button>
                              <button onClick={() => toggleRoomStatus(room.room_id, room.status)} className={`px-3 py-1.5 text-white text-xs font-bold rounded-lg ${room.status === 'maintenance' ? 'bg-green-500' : 'bg-orange-500'}`}>{room.status === 'maintenance' ? t.btnAvailable : t.btnMaintenance}</button>
                              <button onClick={() => setModalConfig({ isOpen: true, type: 'deleteRoom', data: { roomId: room.room_id } })} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600">{t.btnDelete}</button>
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
          // ================== تبويب الطلاب ==================
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
                      <th className={`p-4 font-bold text-center whitespace-nowrap`}>{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* بنلف على قائمة الطلاب عشان نعرضهم */}
                    {students.map((student) => {
                      // بنجيب حجوزات الطالب ده عشان نعرف عدد الغرف النشطة بتاعته.
                      const studentBookingsHistory = getStudentBookingsList(student.student_id);
                      const activeRoomsCount = studentBookingsHistory.filter(b => b.booking_status !== 'canceled').length;
                      // بنعرف هل الطالب ده هو اللي الإدمن داس عليه عشان يوسع ويعرض سجله ولا لأ.
                      const isExpanded = expandedStudentId === student.student_id;
                      
                      return (
                        <React.Fragment key={student.student_id}>
                          {/* سطر بيانات الطالب */}
                          <tr className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${student.is_blacklisted ? 'bg-red-50/50' : ''}`}>
                            <td className={`p-4 font-extrabold text-[#1b2a47] ${lang === 'ar' ? 'text-right' : ''}`}>
                              {student.student_id}
                              {/* لو الطالب محظور بنكتب جنبه إنه محظور */}
                              {student.is_blacklisted && <span className="ml-2 rtl:mr-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{t.blacklisted}</span>}
                            </td>
                            <td className={`p-4 font-bold text-gray-700 ${lang === 'ar' ? 'text-right' : ''}`}>{student.student_name}</td>
                            <td className={`p-4 text-gray-600 ${lang === 'ar' ? 'text-right' : ''}`} dir="ltr">{student.email}</td>
                            <td className="p-4 text-center">
                              <span className={`px-4 py-1.5 rounded-full font-extrabold text-lg ${activeRoomsCount > 0 ? 'bg-[#5ca393]/10 text-[#5ca393]' : 'bg-gray-100 text-gray-400'}`}>
                                {activeRoomsCount}
                              </span>
                            </td>
                            <td className="p-4 flex gap-2 justify-center flex-wrap">
                              {/* زرار عرض أو إخفاء سجل الحجوزات */}
                              <button 
                                onClick={() => setExpandedStudentId(isExpanded ? null : student.student_id)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${isExpanded ? 'bg-gray-200 text-gray-600' : 'bg-[#1b2a47] text-white hover:bg-[#2a406b]'}`}
                              >
                                {isExpanded ? t.hideBookings : t.viewBookings}
                              </button>
                              
                              {/* زرار الحظر */}
                              <button 
                                onClick={() => toggleStudentBlacklist(student.student_id, student.is_blacklisted)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors text-white shadow-sm ${student.is_blacklisted ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                              >
                                {student.is_blacklisted ? t.btnUnblock : t.btnBlock}
                              </button>
                            </td>
                          </tr>
                          
                          {/* ده السجل الداخلي اللي بيظهر لما بندوس "عرض السجل" */}
                          {isExpanded && (
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <td colSpan="5" className="p-4 shadow-inner">
                                {studentBookingsHistory.length === 0 ? (
                                  <div className="text-gray-400 font-bold text-center py-2">{t.noBookings}</div>
                                ) : (
                                  <div className="grid gap-2">
                                    {/* بنعرض تفاصيل كل حجز الطالب عمله */}
                                    {studentBookingsHistory.map(b => (
                                      <div key={b.booking_id} className={`flex justify-between items-center bg-white p-3 rounded border shadow-sm ${b.booking_status === 'canceled' ? 'border-red-200 opacity-75' : 'border-gray-200'}`}>
                                        <div className="font-bold text-[#1b2a47]">
                                          <span className="text-gray-400 text-sm me-2">{t.room}:</span>{b.room_id}
                                        </div>
                                        <div className="flex gap-2">
                                          {b.booking_status === 'canceled' ? (
                                            <>
                                              <span className="px-2 py-1 rounded text-xs font-bold bg-gray-200 text-gray-600">{b.payment_status === 'refunded' ? t.refunded : b.payment_status}</span>
                                              <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">{t.canceled}</span>
                                            </>
                                          ) : (
                                            <>
                                              <span className={`px-2 py-1 rounded text-xs font-bold ${b.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{b.payment_status}</span>
                                              <span className={`px-2 py-1 rounded text-xs font-bold ${b.booking_status === 'confirmed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>{b.booking_status}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
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

// بنصدر المكون عشان المشروع يشوفه كصفحة كاملة.
export default AdminDashboard;