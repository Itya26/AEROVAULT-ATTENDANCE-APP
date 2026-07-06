import { Link, useLocation } from "wouter";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { clearToken } from "@/lib/auth";
import { LogOut, Home, History, CalendarDays, Users, Shield, Settings, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";
import logoIcon from "@assets/image_(8)_1783358569533.png";

function NavLinks({ role, onClick }: { role?: string; onClick?: () => void }) {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: Home, roles: ["employee"] },
    { href: "/hr", label: "HR Dashboard", icon: Users, roles: ["hr", "admin"] },
    { href: "/attendance", label: "My Attendance", icon: History, roles: ["employee", "hr", "admin"] },
    { href: "/leaves", label: "Leave Requests", icon: CalendarDays, roles: ["employee", "hr", "admin"] },
    { href: "/admin", label: "Admin Panel", icon: Shield, roles: ["admin"] },
  ];

  return (
    <nav className="flex flex-col gap-2">
      {links.map((link) => {
        if (!role || !link.roles.includes(role)) return null;
        const isActive = location === link.href;
        return (
          <Link key={link.href} href={link.href}>
            <a
              onClick={onClick}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </a>
          </Link>
        );
      })}
    </nav>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { data: user } = useGetCurrentUser();
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearToken();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <img src={logoIcon} alt="AEROVAULT" className="h-8 w-8 rounded-md" />
          <span className="font-bold text-lg tracking-tight">AEROVAULT</span>
        </div>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 flex flex-col">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-8">
                <img src={logoIcon} alt="AEROVAULT" className="h-8 w-8 rounded-md" />
                <span className="font-bold text-lg tracking-tight">AEROVAULT</span>
              </div>
              <NavLinks role={user?.role} onClick={() => setMobileMenuOpen(false)} />
            </div>
            <div className="mt-auto flex flex-col gap-2">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.employeeId}</p>
              </div>
              <Link href="/settings">
                <a onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                  <Settings className="h-4 w-4" />
                  Settings
                </a>
              </Link>
              <Button variant="ghost" className="justify-start px-3 text-muted-foreground hover:text-foreground" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-card h-screen sticky top-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <img src={logoIcon} alt="AEROVAULT" className="h-10 w-10 rounded-lg shadow-sm" />
            <div>
              <span className="block font-bold text-lg tracking-tight leading-none">AEROVAULT</span>
              <span className="block text-xs text-muted-foreground font-medium mt-1 uppercase tracking-wider">Attendance</span>
            </div>
          </div>
          <NavLinks role={user?.role} />
        </div>
        <div className="mt-auto p-6 border-t bg-muted/20">
          <div className="mb-4">
            <p className="text-sm font-semibold text-foreground">{user?.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
              {user?.employeeId} • {user?.role}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <Link href="/settings">
              <a className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <Settings className="h-4 w-4" />
                Settings
              </a>
            </Link>
            <Button variant="ghost" className="justify-start px-3 text-muted-foreground hover:text-foreground" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
