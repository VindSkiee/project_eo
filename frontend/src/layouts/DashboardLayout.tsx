import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Wallet, 
  Users, 
  UserCircle, 
  LogOut, 
  Menu,
  Building2,
  CalendarDays,
  CreditCard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { authService } from "@/services/authService";

// Tipe data user dari LocalStorage
interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // 1. Ambil Data User Saat Komponen Dimuat
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 2. Fungsi Logout
  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success("Berhasil keluar.");
    } catch {
      // Fallback: clear manually if API fails
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
    }
    navigate("/login");
  };

  // 3. Konfigurasi Menu Berdasarkan Role
  const getMenuItems = (role?: string) => {
    const menu = [];

    if (role === "LEADER") {
      menu.push({ title: "Dashboard RW", path: "/dashboard/rw", icon: LayoutDashboard });
      menu.push({ title: "Organisasi", path: "/dashboard/organisasi", icon: Building2 });
      menu.push({ title: "Kegiatan", path: "/dashboard/kegiatan", icon: CalendarDays });
      menu.push({ title: "Kas & Keuangan", path: "/dashboard/kas", icon: Wallet });
      menu.push({ title: "Pembayaran", path: "/dashboard/pembayaran", icon: CreditCard });
    } 
    else if (role === "ADMIN") {
      menu.push({ title: "Dashboard RT", path: "/dashboard/rt", icon: LayoutDashboard });
      menu.push({ title: "Data Warga RT", path: "/dashboard/warga", icon: Users });
    } 
    else if (role === "TREASURER") {
      menu.push({ title: "Dashboard Keuangan", path: "/dashboard/finance", icon: Wallet });
    } 
    else {
      // Default / RESIDENT
      menu.push({ title: "Beranda Warga", path: "/dashboard/warga", icon: LayoutDashboard });
      menu.push({ title: "Organisasi", path: "/dashboard/organisasi", icon: Building2 });
    }

    // Menu global untuk semua role
    menu.push({ title: "Profil Saya", path: "/dashboard/profile", icon: UserCircle });

    return menu;
  };

  const menuItems = getMenuItems(user?.role);

  // 4. Sidebar Content (Glass Sidebar - Shared Desktop & Mobile)
  const SidebarContent = ({ collapsed = false }: { collapsed?: boolean }) => (
    <>
      

      {/* Profile Section */}
      <div className={`flex items-center gap-3 pt-6 pb-5 ${collapsed ? 'px-3 justify-center' : 'px-6'}`}>
        <Avatar className="h-12 w-12 border-2 border-white/20 shadow-lg">
          <AvatarFallback className="bg-white/10 text-white font-bold text-lg font-poppins">
            {user?.fullName?.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.4px] text-white/50 leading-[22px]">
              {user?.role || "GUEST"}
            </p>
            <p className="text-[14px] font-medium text-white leading-[20px] truncate">
              {user?.fullName || "User"}
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px w-full opacity-20">
        <div className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent" />
      </div>

      {/* Menu Section */}
      <div className={`flex-1 pt-4 pb-2 overflow-y-auto ${collapsed ? 'px-3' : 'px-5'}`}>
        {!collapsed && (
          <p className="text-[11px] font-medium uppercase tracking-[0.4px] text-white/40 px-4 mb-2 leading-[24px]">
            Menu
          </p>
        )}
        <nav className="flex flex-col gap-[2px]">
          {menuItems.map((item) => {
            const isActive = location.pathname.includes(item.path);
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <div
                  className={`relative flex items-center gap-4 rounded-xl transition-all duration-200 font-medium text-[14px] leading-[20px] ${collapsed ? 'px-3 py-[14px] justify-center' : 'px-4 py-[14px]'}
                    ${isActive
                      ? "bg-brand-green text-white shadow-lg shadow-brand-green/20 border-[0.5px] border-white/10"
                      : "text-white/70 hover:bg-white/10 hover:text-white border-[0.5px] border-transparent"
                    }`}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className="h-[22px] w-[22px] shrink-0" strokeWidth={1.8} />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Divider */}
      <div className="h-px w-full opacity-20">
        <div className="h-full w-full bg-gradient-to-r from-transparent via-red to-transparent" />
      </div>

      {/* Logout */}
      <div className={`py-4 ${collapsed ? 'px-3' : 'px-5'}`}>
        <button
          onClick={() => setShowLogoutDialog(true)}
          className={`flex items-center gap-4 w-full rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 text-[14px] font-medium leading-[20px] ${collapsed ? 'px-3 py-[14px] justify-center' : 'px-4 py-[14px]'}`}
          title={collapsed ? "Keluar" : undefined}
        >
          <LogOut className="h-[22px] w-[22px] shrink-0" strokeWidth={1.8} />
          {!collapsed && "Keluar"}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full font-sans bg-slate-50">
      
      {/* --- SIDEBAR (DESKTOP) --- */}
      <aside className={`hidden md:flex shrink-0 p-3 z-20 transition-all duration-300 ${isCollapsed ? 'w-[100px]' : 'w-[280px]'}`}>
        <div className="relative w-full backdrop-blur-[80px] bg-primary/80 border-[0.5px] border-solid border-white/10 rounded-[28px] shadow-[0px_24px_64px_-16px_rgba(7,44,82,0.3)] flex flex-col">
          {/* Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-20 z-50 w-8 h-8 rounded-full bg-white border-[0.5px] border-primary/20 shadow-[0px_4px_12px_rgba(7,44,82,0.15)] flex items-center justify-center hover:bg-brand-green transition-all duration-200 group"
            title={isCollapsed ? "Perluas sidebar" : "Tutup sidebar"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-primary group-hover:text-white transition-all duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          
          <SidebarContent collapsed={isCollapsed} />
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Mobile Header with Menu Button */}
        <header className="md:hidden sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 text-primary hover:text-primary hover:bg-slate-100">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            {/* Glass Sidebar Mobile */}
            <SheetContent side="left" className="w-[280px] p-0 border-r-0 bg-transparent shadow-none [&>button]:text-white/80">
              <div className="h-full m-3 backdrop-blur-[80px] bg-primary/90 rounded-[28px] shadow-[0px_24px_64px_-16px_rgba(7,44,82,0.3)] flex flex-col overflow-hidden">
                <SidebarContent collapsed={false} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold font-poppins text-slate-900 truncate">
              {menuItems.find(item => location.pathname.includes(item.path))?.title || "Dashboard"}
            </h1>
          </div>
          <Avatar className="h-8 w-8 border border-slate-200">
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm font-poppins">
              {user?.fullName?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </header>

        {/* CONTENT OUTLET - Full Screen */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <Outlet />
        </div>

      </main>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-poppins">Konfirmasi Keluar</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar dari akun ini? Anda perlu login kembali untuk mengakses dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Ya, Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}