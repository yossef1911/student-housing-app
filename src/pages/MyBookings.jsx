// بنجيب الأدوات اللي هنحتاجها من مكتبة React.
import React, { useState, useEffect } from 'react';
// بنجيب أداة التنقل عشان ننقل الطالب بين الصفحات.
import { useNavigate } from 'react-router-dom';
// بنجيب لوجو الموقع عشان نعرضه فوق.
import logo from '../assets/logo.png';
// بنجيب أداة الاتصال بقاعدة البيانات بتاعتنا (Supabase).
import { supabase } from '../services/supabaseClient';

// دي الدالة أو المكون الأساسي لصفحة "حجوزاتي" اللي الطالب بيشوف فيها كل الغرف اللي حجزها.
const MyBookings = () => {
  // بنجهز أداة الـ navigate عشان نستخدمها لو حبينا نرجع الطالب للصفحة الرئيسية مثلاً.
  const navigate = useNavigate();
  
  // مخزن للغة الصفحة (عربي ولا إنجليزي)، والافتراضي 'en'.
  const [lang, setLang] = useState('en');
  
  // مخزن بنشيل فيه قائمة الحجوزات اللي هنجيبها من قاعدة البيانات. الافتراضي مصفوفة فاضية [].
  const [bookings, setBookings] = useState([]);
  
  // مخزن حالة التحميل، بيبقى true أول ما الصفحة تفتح عشان نظهر كلمة "جاري التحميل...".
  const [loading, setLoading] = useState(true);

  // ده قاموس الترجمة بتاع الصفحة، فيه النصوص باللغتين عشان تتغير على طول لما اليوزر يغير اللغة.
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
  }[lang]; // هنا بنقوله: اختار القاموس المناسب بناءً على قيمة المخزن 'lang' اللي فوق.

  // الـ useEffect دي بتشتغل "مرة واحدة بس" أول ما الطالب يفتح صفحة حجوزاتي.
  // وظيفتها تروح تكلم قاعدة البيانات وتجيب الحجوزات بتاعته.
  useEffect(() => {
    const fetchMyBookings = async () => {
      try {
        // 1. أول خطوة: بنتأكد إن فيه حد مسجل دخول أصلاً.
        const { data: { session } } = await supabase.auth.getSession();
        
        // لو مفيش حد مسجل دخول (الطالب مش عامل لوجين)، هنطرده ونوديه على صفحة الدخول.
        if (!session) {
          navigate('/login');
          return; // ونوقف الدالة هنا وماتكملش.
        }

        // 2. الخطوة التانية: إحنا معانا الـ ID بتاع الحساب، بس عايزين الـ ID الجامعي بتاع الطالب نفسه (student_id).
        // فبنروح لجدول الطلاب (students) ونسأله: مين الطالب اللي مربوط بالحساب اللي مسجل دخول ده؟
        const { data: student } = await supabase
          .from('students')
          .select('student_id')
          .eq('auth_id', session.user.id)
          .single(); // single يعني هاتلي سجل واحد بس لأن المفروض هو طالب واحد.

        // لو لقينا الطالب فعلاً في الجدول وجبنا الـ student_id بتاعه:
        if (student) {
          // 3. الخطوة التالتة: بنروح لجدول الحجوزات (bookings) ونجيب كل الحجوزات اللي مسجلة باسم الـ student_id ده بس.
          const { data: myBookingsData, error } = await supabase
            .from('bookings')
            .select('*') // هات كل تفاصيل الحجز (رقم الغرفة، السعر، الحالة.. الخ)
            .eq('student_id', student.student_id) // بشرط إنها تكون بتاعة الطالب ده.
            .order('created_at', { ascending: false }); // ورتبهم من الأحدث للأقدم.

          // لو حصل خطأ واحنا بنجيب الداتا، بنرمي الخطأ ده عشان الـ catch يمسكه.
          if (error) throw error;
          
          // لو الداتا جت سليمة، بنحطها في المخزن بتاع bookings اللي عملناه فوق.
          if (myBookingsData) setBookings(myBookingsData);
        }
      } catch (error) {
        // لو حصل أي مشكلة في النت أو قاعدة البيانات، بنطبع الخطأ في الكونسول للمبرمجين.
        console.error("Error fetching bookings:", error);
      } finally {
        // في الآخر خالص، سواء جبنا الداتا بنجاح أو حصل خطأ، لازم نقفل "حالة التحميل" عشان الصفحة تتعرض للطالب.
        setLoading(false);
      }
    };

    // بنشغل الدالة اللي كتبناها فوق دي فوراً.
    fetchMyBookings();
  }, [navigate]); // المتغير navigate محطوط هنا عشان الـ useEffect ميعملش تحذيرات.

  // دي دالة مساعدة (Helper Function) صغيرة.
  // وظيفتها إنها تاخد حالة الحجز أو حالة الدفع ككلمة (زي مدفوع، ملغي، معلق) وترجع كود الألوان المناسب ليها.
  // عشان نخلي "المدفوع" لونه أخضر، و"الملغي" لونه أحمر، وهكذا.
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) { // بنحول الكلمة لحروف صغيرة عشان المقارنة تبقى مظبوطة.
      // لو الحالة (مدفوع، أو مؤكد، أو محجوز) -> رجع ألوان خضراء.
      case 'paid':
      case 'confirmed':
      case 'booked':
        return 'bg-green-100 text-green-700 border-green-200';
      // لو الحالة (معلق، أو غير مدفوع) -> رجع ألوان صفرا/برتقالي.
      case 'pending':
      case 'unpaid':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      // لو الحالة (ملغي) -> رجع ألوان حمراء.
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      // لو حالة تانية غريبة منعرفهاش -> رجع لون رمادي افتراضي.
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // =====================================================================
  // واجهة المستخدم (التصميم اللي الطالب بيشوفه بعينيه)
  // =====================================================================
  return (
    // ده الغلاف الخارجي للصفحة اللي بيحدد اتجاه النص ونوع الخط حسب اللغة.
    <div className={`min-h-screen bg-gray-50 flex flex-col ${lang === 'en' ? 'font-en' : 'font-sans'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* الشريط العلوي (Navbar) */}
      <nav className="bg-white px-4 md:px-12 py-4 flex justify-between items-center shadow-sm" dir="ltr">
        {/* اللوجو واسم الموقع، ولما تدوس عليهم بيرجعك للصفحة الرئيسية. */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <img src={logo} alt="Logo" className="h-12 object-contain" />
          <span className="text-2xl font-extrabold text-[#1b2a47] font-en">UniHome</span>
        </div>
        
        {/* الزراير اللي على الجنب (تغيير اللغة، والرجوع للرئيسية) */}
        <div className="flex gap-4">
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="font-bold text-gray-500 hover:text-[#5ca393]">{t.toggleLang}</button>
          <button onClick={() => navigate('/')} className="font-bold text-[#1b2a47] hover:text-[#5ca393]">{t.back}</button>
        </div>
      </nav>

      {/* المحتوى الرئيسي بتاع الصفحة */}
      <div className="flex-grow max-w-5xl mx-auto px-4 py-12 w-full">
        {/* العنوان الرئيسي "حجوزاتي" */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1b2a47] mb-10 text-center border-b-4 border-[#5ca393] inline-block pb-2">
          {t.title}
        </h1>

        {/* هنا بنعمل شرط عشان نشوف هنعرض إيه للطالب: */}
        {loading ? (
          // لو لسه بنحمل البيانات من السيرفر، بنعرضله كلمة "جاري التحميل..."
          <div className="text-center text-xl font-bold text-gray-500 mt-20">جاري التحميل...</div>
        ) : bookings.length === 0 ? (
          // لو خلصنا تحميل واكتشفنا إن مخزن الحجوزات فاضي (يعني الطالب لسه محجزش أي حاجة):
          // بنعرضله رسالة لطيفة وزرار بيشجعه يروح يتصفح الغرف ويحجز.
          <div className="text-center mt-20 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-2xl font-bold text-gray-400 mb-6">{t.noBookings}</div>
            <button onClick={() => navigate('/rooms')} className="px-8 py-3 bg-[#5ca393] text-white font-bold rounded-xl hover:bg-[#458b7c] transition-colors">
              {t.browse}
            </button>
          </div>
        ) : (
          // لو الطالب عنده حجوزات فعلاً (بنعرضهم على هيئة كروت جنب أو تحت بعض).
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* بنلف (Loop) على كل حجز جوه مصفوفة bookings عشان نرسم كارت خاص بيه */}
            {bookings.map((booking) => (
              // الغلاف بتاع كارت الحجز الواحد.
              <div key={booking.booking_id} className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow">
                
                {/* الجزء العلوي في الكارت: فيه رقم الحجز والفصل الدراسي */}
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

                {/* الجزء السفلي في الكارت: فيه رقم الغرفة، وحالة الحجز والدفع */}
                <div className="flex items-center gap-4 mb-6">
                  {/* المربع الكحلي الصغير اللي جواه رقم الغرفة */}
                  <div className="w-16 h-16 bg-[#1b2a47] text-white rounded-xl flex flex-col items-center justify-center font-black shadow-inner">
                    <span className="text-xs font-normal opacity-70 mb-1">{t.room}</span>
                    <span className="text-xl leading-none">{booking.room_id}</span>
                  </div>
                  
                  {/* الحالات (الدفع والحجز) بألوانها المختلفة اللي بتيجي من الدالة اللي فوق */}
                  <div className="flex-grow space-y-2">
                    {/* سطر حالة الحجز */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-600">{t.bookingStatus}:</span>
                      {/* هنا بننادي على دالة الألوان وبنديها حالة الحجز عشان ترجعلنا اللون الصح */}
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(booking.booking_status)} capitalize`}>
                        {booking.booking_status}
                      </span>
                    </div>
                    {/* سطر حالة الدفع */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-600">{t.paymentStatus}:</span>
                      {/* نفس الكلام مع حالة الدفع */}
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

// بنصدر الصفحة دي عشان نقدر نستخدمها ونربطها في المشروع.
export default MyBookings;