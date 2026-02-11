import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
// Pastikan nama file import sesuai (PascalCase)
import LoginPage from "@/pages/auth/LoginPage"; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* --- 1. Public Routes --- */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Redirect root (/) otomatis ke dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* --- 2. Protected Routes (Butuh Login) --- */}
        {/* TODO: Nanti ganti 'DashboardLayoutPlaceholder' dengan component 'DashboardLayout' asli */}
        <Route path="/dashboard" element={<DashboardLayoutPlaceholder />}>
            
            {/* Default redirect: jika buka /dashboard lari ke /dashboard/warga */}
            <Route index element={<Navigate to="/dashboard/warga" replace />} />
            
            {/* Role: LEADER (Ketua RW) */}
            <Route path="rw" element={<LeaderDashboard />} />
            
            {/* Role: ADMIN (Ketua RT) */}
            <Route path="rt" element={<AdminDashboard />} />

            {/* Role: TREASURER (Bendahara) */}
            <Route path="finance" element={<FinanceDashboard />} />
            
            {/* Role: RESIDENT (Warga) */}
            <Route path="warga" element={<ResidentDashboard />} />
            
            {/* Profile setup */}
            <Route path="profile" element={<UserProfilePlaceholder />} />
        </Route>

        {/* --- 3. Catch All (404) --- */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Global Toaster: Wajib ada agar toast.success/error di LoginPage muncul */}
      <Toaster position="top-center" richColors /> 
    </BrowserRouter>
  );
}

export default App;

// ==========================================
//  PLACEHOLDER COMPONENTS (HAPUS BERTAHAP)
// ==========================================

// Layout Sementara (Nanti kita buat file src/layouts/DashboardLayout.tsx)
const DashboardLayoutPlaceholder = () => (
  <div className="flex min-h-screen font-sans">
    <aside className="w-64 bg-slate-900 text-white p-6 hidden md:block">
      <h3 className="text-xl font-bold mb-6 font-poppins">Warga App</h3>
      <nav className="space-y-2">
        <div className="p-2 bg-slate-800 rounded text-sm">Menu Sementara</div>
      </nav>
    </aside>
    <main className="flex-1 bg-slate-50">
      <header className="bg-white p-4 border-b shadow-sm flex justify-between">
        <span className="font-medium font-poppins">Header</span>
        <button className="text-sm text-red-500 font-medium hover:underline">Logout</button>
      </header>
      <div className="p-8">
        <Outlet />
      </div>
    </main>
  </div>
);

// Halaman Dummy (Nanti diganti dengan page asli di folder src/pages/...)
const LeaderDashboard = () => (
    <div className="p-4 border rounded-lg border-indigo-200 bg-indigo-50 text-indigo-700">
        <h2 className="text-2xl font-bold font-poppins">Dashboard Ketua RW</h2>
        <p className="mt-2">Disini nanti statistik satu RW.</p>
    </div>
);

const AdminDashboard = () => (
    <div className="p-4 border rounded-lg border-blue-200 bg-blue-50 text-blue-700">
        <h2 className="text-2xl font-bold font-poppins">Dashboard Admin RT</h2>
        <p className="mt-2">Disini manajemen warga per RT.</p>
    </div>
);

const FinanceDashboard = () => (
    <div className="p-4 border rounded-lg border-amber-200 bg-amber-50 text-amber-700">
        <h2 className="text-2xl font-bold font-poppins">Keuangan & Kas</h2>
        <p className="mt-2">Approval dana dan laporan keuangan.</p>
    </div>
);

const ResidentDashboard = () => (
    <div className="p-4 border rounded-lg border-emerald-200 bg-emerald-50 text-emerald-700">
        <h2 className="text-2xl font-bold font-poppins">Dashboard Warga</h2>
        <p className="mt-2">Status iuran dan event warga.</p>
    </div>
);

const UserProfilePlaceholder = () => (
    <div className="p-4">Halaman Edit Profile</div>
);

const NotFound = () => (
    <div className="flex flex-col items-center justify-center min-h-screen text-slate-500">
        <h1 className="text-4xl font-bold mb-2 font-poppins">404</h1>
        <p>Halaman tidak ditemukan</p>
    </div>
);