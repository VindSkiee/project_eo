import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

// --- IMPORT PAGES & LAYOUT ---
import LoginPage from "@/pages/auth/LoginPage";
import DashboardLayout from "@/layouts/DashboardLayout";
import LeaderDashboard from "@/pages/dashboard/LeaderDashboard";
import AdminDashboard from "@/pages/dashboard/AdminDashboard";
import ResidentDashboard from "@/pages/dashboard/ResidentDashboard";
import FinanceDashboard from "@/pages/dashboard/FinanceDashboard";

// --- 1. UTILITY FUNCTIONS ---
const isAuthenticated = () => {
  return localStorage.getItem("user") !== null;
};

const getUserRole = () => {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.role;
    } catch (e) {
      return null;
    }
  }
  return null;
};

const getDashboardPathByRole = (role: string | null) => {
  switch (role) {
    case "LEADER": return "/dashboard/rw";
    case "ADMIN": return "/dashboard/rt";
    case "TREASURER": return "/dashboard/finance";
    case "RESIDENT": return "/dashboard/warga";
    default: return "/dashboard/warga";
  }
};

// --- 2. GUARDS (SATPAM) ---

// Satpam 1: Cek Login
const ProtectedRoute = () => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

// Satpam 2: Cek Role (BARU 🚀)
// Menerima array role apa saja yang boleh masuk ke rute ini
const RoleProtectedRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const role = getUserRole();
  
  // Jika role user tidak ada di dalam daftar allowedRoles, tendang!
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={getDashboardPathByRole(role)} replace />;
  }
  
  // Jika cocok, silakan lewat
  return <Outlet />;
};

// Satpam 3: Cek Guest (Cegah user login buka halaman login lagi)
const PublicRoute = () => {
  if (isAuthenticated()) {
    const role = getUserRole();
    return <Navigate to={getDashboardPathByRole(role)} replace />;
  }
  return <Outlet />;
};

// Redirector Index Dashboard
const DashboardIndexRedirect = () => {
  const role = getUserRole();
  return <Navigate to={getDashboardPathByRole(role)} replace />;
};

// --- 3. APP ROUTER ---
function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/" element={ isAuthenticated() ? <DashboardIndexRedirect /> : <Navigate to="/login" replace /> } />

        <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
                
                <Route index element={<DashboardIndexRedirect />} />
                
                {/* --- RUTE DENGAN PROTEKSI ROLE --- */}
                
                {/* Hanya LEADER (Ketua RW) yang bisa buka ini */}
                <Route element={<RoleProtectedRoute allowedRoles={["LEADER"]} />}>
                  <Route path="rw" element={<LeaderDashboard />} />
                </Route>

                {/* Hanya ADMIN (Ketua RT) yang bisa buka ini */}
                <Route element={<RoleProtectedRoute allowedRoles={["ADMIN"]} />}>
                  <Route path="rt" element={<AdminDashboard />} />
                </Route>

                {/* Hanya TREASURER (Bendahara) yang bisa buka ini */}
                <Route element={<RoleProtectedRoute allowedRoles={["TREASURER"]} />}>
                  <Route path="finance" element={<FinanceDashboard />} />
                </Route>

                {/* RW, RT, dan Warga boleh buka halaman warga (misal untuk lihat pengumuman) */}
                <Route element={<RoleProtectedRoute allowedRoles={["RESIDENT"]} />}>
                  <Route path="warga" element={<ResidentDashboard />} />
                </Route>

                {/* Profil bisa dibuka oleh SEMUA role yang sudah login */}
                <Route path="profile" element={<div className="p-4 font-medium text-slate-500">Halaman Profil Segera Hadir</div>} />
            </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster position="top-center" richColors /> 
    </BrowserRouter>
  );
}

export default App;

const NotFound = () => (
    <div className="flex flex-col items-center justify-center min-h-screen text-slate-500 bg-slate-50">
        <h1 className="text-6xl font-bold mb-2 font-poppins text-slate-900">404</h1>
        <p className="text-lg">Halaman tidak ditemukan</p>
        <a href="/" className="mt-4 text-primary hover:text-brand-green hover:underline transition-colors font-medium">Kembali ke Beranda</a>
    </div>
);