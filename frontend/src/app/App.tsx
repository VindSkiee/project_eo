import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "@/shared/ui/sonner";

// --- IMPORT PAGES & LAYOUT ---
import LoginPage from "@/features/auth/pages/LoginPage";
import DashboardLayout from "@/layouts/DashboardLayout";

// Dashboard Pages
import LeaderDashboard from "@/features/dashboard/pages/LeaderDashboard";
import AdminDashboard from "@/features/dashboard/pages/AdminDashboard";
import TreasurerDashboard from "@/features/dashboard/pages/TreasurerDashboard";
import ResidentDashboard from "@/features/dashboard/pages/ResidentDashboard";

// Feature Pages
import EventsPage from "@/features/event/pages/EventsPage";
import EventDetailPage from "@/features/event/pages/EventDetailPage";
import FinancePage from "@/features/finance/pages/FinancePage";
import PaymentPage from "@/features/payment/pages/PaymentPage";
import ResidentPaymentPage from "@/features/payment/pages/ResidentPaymentPage";
import PaymentDetailPage from "@/features/payment/pages/PaymentDetailPage";
import OrganizationPage from "@/features/organization/pages/OrganizationPage";
import ProfilePage from "@/features/profile/pages/ProfilePage";
import UserDetailPage from "@/features/profile/pages/UserDetailPage";
import DuesConfigPage from "@/features/finance/pages/DuesConfigPage";
import GroupFinanceDetailPage from "@/features/finance/pages/GroupFinanceDetailPage";
import TransactionDetailPage from "@/features/finance/pages/TransactionDetailPage";
import GroupDuesProgressPage from "@/features/finance/pages/GroupDuesProgressPage";
import RoleLabelSettingsPage from "@/features/settings/pages/RoleLabelSettingsPage";

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
                  <Route path="kegiatan" element={<EventsPage />} />
                  <Route path="events/:id" element={<EventDetailPage />} />
                  <Route path="kas" element={<FinancePage />} />
                  <Route path="pembayaran" element={<PaymentPage />} />
                  <Route path="pembayaran/:id" element={<PaymentDetailPage />} />
                  <Route path="keuangan-rt/:groupId" element={<GroupFinanceDetailPage />} />
                  <Route path="transaksi/:id" element={<TransactionDetailPage />} />
                </Route>

                {/* Hanya ADMIN (Ketua RT) yang bisa buka ini */}
                <Route element={<RoleProtectedRoute allowedRoles={["ADMIN"]} />}>
                  <Route path="rt" element={<AdminDashboard />} />
                  <Route path="kegiatan-rt" element={<EventsPage />} />
                  <Route path="events-rt/:id" element={<EventDetailPage />} />
                  <Route path="kas-rt" element={<FinancePage />} />
                  <Route path="pembayaran-rt" element={<PaymentPage />} />
                  <Route path="pembayaran-rt/:id" element={<PaymentDetailPage />} />
                  <Route path="keuangan-rt/:groupId" element={<GroupFinanceDetailPage />} />
                  <Route path="transaksi-rt/:id" element={<TransactionDetailPage />} />
                </Route>

                {/* Hanya TREASURER (Bendahara) yang bisa buka ini */}
                <Route element={<RoleProtectedRoute allowedRoles={["TREASURER"]} />}>
                  <Route path="finance" element={<TreasurerDashboard />} />
                  <Route path="organisasi-bendahara" element={<OrganizationPage />} />
                  <Route path="kegiatan-bendahara" element={<EventsPage />} />
                  <Route path="events-bendahara/:id" element={<EventDetailPage />} />
                  <Route path="kas-bendahara" element={<FinancePage />} />
                  <Route path="pembayaran-bendahara" element={<PaymentPage />} />
                  <Route path="pembayaran-bendahara/:id" element={<PaymentDetailPage />} />
                  <Route path="transaksi-bendahara/:id" element={<TransactionDetailPage />} />
                  <Route path="keuangan-rt-bendahara/:groupId" element={<GroupFinanceDetailPage />} />
                  <Route path="progres-iuran-bendahara/:groupId" element={<GroupDuesProgressPage />} />
                </Route>

                {/* LEADER boleh buka halaman organisasi */}
                <Route element={<RoleProtectedRoute allowedRoles={["LEADER"]} />}>
                  <Route path="organisasi" element={<OrganizationPage />} />
                  <Route path="pengaturan" element={<RoleLabelSettingsPage />} />
                </Route>

                {/* ADMIN boleh buka halaman organisasi */}
                <Route element={<RoleProtectedRoute allowedRoles={["ADMIN"]} />}>
                  <Route path="organisasi-rt" element={<OrganizationPage />} />
                </Route>

                {/* Detail User — Accessible by LEADER, ADMIN, TREASURER, dan RESIDENT */}
                <Route element={<RoleProtectedRoute allowedRoles={["LEADER", "ADMIN", "TREASURER", "RESIDENT"]} />}>
                  <Route path="users/:id" element={<UserDetailPage />} />
                </Route>

                {/* Pengaturan Iuran — LEADER dan ADMIN */}
                <Route element={<RoleProtectedRoute allowedRoles={["LEADER", "ADMIN"]} />}>
                  <Route path="pengaturan-iuran" element={<DuesConfigPage />} />
                </Route>

                {/* Warga dashboard */}
                <Route element={<RoleProtectedRoute allowedRoles={["RESIDENT"]} />}>
                  <Route path="warga" element={<ResidentDashboard />} />
                  <Route path="organisasi-warga" element={<OrganizationPage />} />
                  <Route path="kegiatan-warga" element={<EventsPage />} />
                  <Route path="events-warga/:id" element={<EventDetailPage />} />
                  <Route path="pembayaran-warga" element={<ResidentPaymentPage />} />
                  <Route path="pembayaran-warga/:id" element={<PaymentDetailPage />} />
                </Route>

                {/* Profil bisa dibuka oleh SEMUA role yang sudah login */}
                <Route path="profile" element={<ProfilePage />} />
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