// الملف ده اسمه App.jsx، وده نقدر نعتبره "عسكري المرور" أو "خريطة المبنى" للموقع بتاعنا كله.
// وظيفته إنه يربط الروابط (اللينكات اللي فوق في المتصفح) بالصفحات اللي إحنا برمجناها.

// هنا بنجيب أداة React الأساسية عشان الملف يشتغل.
import React from 'react';

// بنجيب أدوات التوجيه (Routing) من مكتبة اسمها react-router-dom.
// Router: ده الغلاف الكبير اللي بيشغل نظام الخرائط والتنقل في الموقع.
// Routes: ده زي شارع رئيسي بيجمع كل الطرق أو المسارات جواه.
// Route: دي اليافطة أو العنوان اللي بيحدد كل رابط بيودي على أي صفحة بالظبط.
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// السطور اللي جاية دي كلها عبارة عن إننا بنجيب (نستورد) كل الصفحات اللي صممناها في ملفات تانية جوه مجلد pages.
// بنجيبهم هنا عشان نقدر نستخدمهم ونربطهم بالعناوين بتاعتهم.
import Home from './pages/Home';
import Signup from './pages/Signup';
import LoginPage from './pages/LoginPage';
import Rooms from './pages/Rooms';
import MyBookings from './pages/MyBookings';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';

// دي الدالة الرئيسية للمشروع كله، واسمها App. 
// أي حاجة مكتوبة جوه الدالة دي هي اللي بتحدد مسار وخط سير اليوزر جوه الموقع.
function App() {
  return (
    // Router: بنقول للموقع "ابتدى شغل نظام الخرائط والتنقل من هنا".
    <Router>
      {/* Routes: هنا بنحط قائمة بكل المسارات (الطرق) المتاحة في الموقع بتاعنا */}
      <Routes>
        
        {/* Route 1: السطر ده معناه، لو اليوزر كتب رابط الموقع بس ومكتبش أي حاجة بعده (path="/")، 
            اعرضله فوراً الصفحة الرئيسية اللي اسمها <Home /> */}
        <Route path="/" element={<Home />} />
        
        {/* Route 2: لو اليوزر داس على لينك أو كتب في الرابط فوق كلمة signup (path="/signup")، 
            افتحله صفحة إنشاء الحساب <Signup /> */}
        <Route path="/signup" element={<Signup />} />
        
        {/* Route 3: لو كتب login في الرابط، وديه على صفحة تسجيل الدخول <LoginPage /> */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Route 4: لو كتب rooms، اعرضله صفحة تصفح الغرف المتاحة <Rooms /> */}
        <Route path="/rooms" element={<Rooms />} />
        
        {/* Route 5: لو كتب my-bookings، اعرضله الصفحة اللي فيها حجوزاته <MyBookings /> */}
        <Route path="/my-bookings" element={<MyBookings />} />
        
        {/* Route 6: لو كتب admin، افتحله صفحة لوحة تحكم الإدارة <AdminDashboard /> */}
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* Route 7: لو كتب profile، وديه على صفحة الملف الشخصي بتاعه عشان يعرض بياناته ويغير الباسورد <Profile /> */}
        <Route path="/profile" element={<Profile />} /> 
        
      </Routes>
    </Router>
  );
}

// في النهاية، بنصدر ملف الـ App ده بالكامل عشان ملف التشغيل الرئيسي (main.jsx) يقدر ياخده ويعرضه على شاشة المتصفح للمستخدم.
export default App;