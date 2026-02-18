import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { User } from "lucide-react";

interface Account {
    email: string;
    fullName: string;
    password: string;
    role: string;
    roleType: string;
}

const seedAccounts: Account[] = [
    {
        email: "rw@warga.id",
        fullName: "Bapak Ketua RW",
        password: "123456",
        role: "Ketua RW",
        roleType: "LEADER"
    },
    {
        email: "rt01@warga.id",
        fullName: "Bapak RT Satu",
        password: "123456",
        role: "Ketua RT",
        roleType: "ADMIN"
    },
    {
        email: "bendahara.rw@warga.id",
        fullName: "Ibu Bendahara RW",
        password: "123456",
        role: "Bendahara RW",
        roleType: "TREASURER"
    },
    {
        email: "warga01@warga.id",
        fullName: "Udin Warga",
        password: "123456",
        role: "Warga",
        roleType: "RESIDENT"
    }
];

const getRoleBadgeColor = (roleType: string) => {
    switch (roleType) {
        case "LEADER":
            return "bg-purple-100 text-purple-700";
        case "ADMIN":
            return "bg-blue-100 text-blue-700";
        case "TREASURER":
            return "bg-green-100 text-green-700";
        case "RESIDENT":
            return "bg-gray-100 text-gray-700";
        default:
            return "bg-gray-100 text-gray-700";
    }
};

export function AccountInfoCards() {

    return (
        <Card className="w-full max-w-sm shadow-md border-slate-200 bg-white/95 backdrop-blur">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <User className="w-4 h-4" />
                    Akun Demo
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {seedAccounts.map((account, index) => (
                    <div key={index} className="group pb-3 border-b border-slate-200 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getRoleBadgeColor(account.roleType)}`}>
                                {account.role}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-700 truncate">{account.email}</p>
                                <p className="text-[10px] text-slate-500">Password: {account.password}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
