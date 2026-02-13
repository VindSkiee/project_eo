import { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Wallet, 
  Users, 
  UserCircle, 
  LogOut, 
  Menu, 
  Settings
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

  // 1. Ambil Data User Saat Komponen Dimuat
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 2. Fungsi Logout
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // 3. Konfigurasi Menu Berdasarkan Role
  const getMenuItems = (role?: string) => {
    const menu = [];

    if (role === "LEADER") {
      menu.push({ title: "Dashboard RW", path: "/dashboard/rw", icon: LayoutDashboard });
      menu.push({ title: "Kas & Keuangan", path: "/dashboard/finance", icon: Wallet });
      menu.push({ title: "Manajemen Warga", path: "/dashboard/warga", icon: Users }); // RW bisa lihat data warga umum
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
    }

    // Menu global untuk semua role
    menu.push({ title: "Profil Saya", path: "/dashboard/profile", icon: UserCircle });

    return menu;
  };

  const menuItems = getMenuItems(user?.role);

  // 4. Komponen Render Menu (Bisa dipakai di Desktop & Mobile)
  const MenuLinks = () => (
    <nav className="space-y-2 mt-4 flex-1">
      {menuItems.map((item) => {
        const isActive = location.pathname.includes(item.path);
        const Icon = item.icon;
        
        return (
          <Link key={item.path} to={item.path}>
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm mb-1
              ${isActive 
                ? "bg-brand-green text-white shadow-md" 
                : "text-sidebar-foreground/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </div>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen w-full bg-slate-50 font-sans">
      
      {/* --- SIDEBAR (DESKTOP) --- */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground p-4 shadow-xl z-20">
        <div className="flex items-center gap-3 px-2 mb-8 mt-4">
          <div className="h-8 w-8 bg-brand-green rounded-lg flex items-center justify-center">
            <span className="text-white font-bold font-poppins text-lg leading-none mt-[-2px]">W</span>
          </div>
          <h2 className="text-2xl font-bold font-poppins tracking-tight text-white">Warga App</h2>
        </div>
        
        <MenuLinks />

        {/* Tombol Logout Bawah */}
        <div className="mt-auto pt-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-300 hover:bg-red-500 hover:text-white transition-colors text-sm font-medium"
          >
            <LogOut className="h-5 w-5" />
            Keluar
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 z-10 shadow-sm">
          
          {/* Bagian Kiri Header: Mobile Menu Trigger */}
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-slate-600">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              {/* Sidebar versi Mobile (Muncul dari kiri) */}
              <SheetContent side="left" className="w-64 bg-sidebar text-sidebar-foreground p-4 border-r-0 flex flex-col">
                <div className="flex items-center gap-3 px-2 mb-8 mt-4">
                  <div className="h-8 w-8 bg-brand-green rounded-lg"></div>
                  <h2 className="text-2xl font-bold font-poppins text-white">Warga App</h2>
                </div>
                <MenuLinks />
              </SheetContent>
            </Sheet>

            <span className="font-semibold text-slate-700 font-poppins hidden sm:block">
               {/* Teks Header Dinamis (Opsional) */}
               Selamat datang, {user?.fullName || "Warga"}
            </span>
          </div>

          {/* Bagian Kanan Header: Profil Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-slate-200 hover:bg-slate-100 p-0">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {user?.fullName?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none font-poppins">{user?.fullName || "User"}</p>
                  <p className="text-xs leading-none text-slate-500 mt-1">
                    {user?.email || "email@warga.id"}
                  </p>
                  <div className="mt-2 text-[10px] uppercase font-bold text-brand-green tracking-wider">
                    Role: {user?.role || "GUEST"}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/dashboard/profile")} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Pengaturan Profil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </header>

        {/* CONTENT OUTLET (Halaman anak dirender disini) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50">
          <Outlet />
        </div>

      </main>
    </div>
  );
}