import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { LayoutDashboard, BookOpen, Users, Calendar, Menu, Bell, Search, ChevronDown, FileText } from 'lucide-react';

export default function DashboardLayout({ header, children }: { header?: React.ReactNode, children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Sesuaikan route dengan nama route di web.php Anda nantinya
    const menus = [
        { name: 'Overview', icon: LayoutDashboard, route: 'dashboard' },
        { name: 'Pengajuan Judul', icon: BookOpen, route: '#' },
        { name: 'Tema & Matchmaking', icon: Users, route: '#' },
        { name: 'Dokumen TA', icon: FileText, route: '#' },
        { name: 'Jadwal & Sidang', icon: Calendar, route: '#' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col`}>
                <div className="h-16 flex items-center px-4 border-b border-slate-200 justify-between">
                    {sidebarOpen && (
                        <div className="flex items-center gap-2 font-bold text-lg text-slate-800">
                            <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center font-serif italic">p</div>
                            <span>polman<span className="text-slate-500 font-normal text-sm block -mt-1">bandung</span></span>
                        </div>
                    )}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                        <Menu size={20} />
                    </button>
                </div>

                <div className="p-4 flex-1">
                    <p className="text-xs font-bold text-slate-400 mb-4 tracking-wider">{sidebarOpen ? 'MENU UTAMA' : 'MENU'}</p>
                    <ul className="space-y-1">
                        {menus.map((menu, idx) => (
                            <li key={idx}>
                                <Link 
                                    href={route().has(menu.route) ? route(menu.route) : '#'} 
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors"
                                >
                                    <menu.icon size={18} />
                                    {sidebarOpen && <span>{menu.name}</span>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
                    <div className="font-semibold text-slate-700">
                        {header}
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input type="text" placeholder="Cari apa saja..." className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <button className="text-slate-500 hover:text-slate-700 relative">
                            <Bell size={20} />
                            <span className="absolute top-0 right-0 w-2 h-2 bg-orange-500 rounded-full"></span>
                        </button>
                        <div className="flex items-center gap-2 cursor-pointer border-l pl-4 border-slate-200">
                            <div className="w-8 h-8 bg-blue-900 text-white rounded-full flex items-center justify-center text-xs font-bold">MR</div>
                            <span className="text-sm font-medium text-slate-700 hidden md:block">Arbiyan Saputra</span>
                            <ChevronDown size={14} className="text-slate-400" />
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}