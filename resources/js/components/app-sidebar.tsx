import { Link, usePage } from '@inertiajs/react';
import { BookOpen, FolderGit2, LayoutGrid, MessageSquareText, Calendar, FileText, Sparkles, ClipboardCheck, ShieldCheck } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import { Database } from 'lucide-react';
import { Clock } from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';

export function AppSidebar() {
    const page = usePage();
    const teamSlug = page.props.currentTeam?.slug;
    
    // Ambil akumulasi permissions dari user (via HandleInertiaRequests)
    const permissions = (page.props.auth as any)?.permissions || [];
    
    // Helper function untuk cek granular permission
    const can = (permissionKey: string) => permissions.includes(permissionKey);

    const dashboardUrl = teamSlug ? dashboard(teamSlug) : '/';
    const teamUrl = (path: string) => (teamSlug ? `/${teamSlug}/${path}` : `/${path}`);

    // Konfigurasi visibility menu berdasarkan permissions (CRUD-based)
    const allNavItems = [
        {
            title: 'Dashboard',
            href: dashboardUrl,
            icon: LayoutGrid,
            show: true, // Publik setelah login
        },
        {
            title: 'Bimbingan',
            href: teamUrl('bimbingan'),
            icon: MessageSquareText,
            show: can('bimbingan.read'), 
        },
        {
            title: 'Pengajuan Judul',
            href: teamUrl('pengajuan-judul'),
            icon: BookOpen,
            show: can('judul.read'), 
        },
        {
            title: 'Tema & Matchmaking',
            href: teamUrl('tema-matchmaking'),
            icon: Sparkles,
            show: can('judul.create') || can('judul.update'), // Contoh logika gabungan
        },
        {
            title: 'Dokumen TA',
            href: teamUrl('dokumen'),
            icon: FileText,
            show: true, // Asumsi semua bisa melihat dokumen
        },
        {
            title: 'Kehadiran Seminar',
            href: teamUrl('kehadiran-seminar'),
            icon: ClipboardCheck,
            show: can('judul.create'), // Misal hanya Mhs/Panitia
        },
        {
            title: 'Pendaftaran',
            href: teamUrl('pendaftaran'),
            icon: ClipboardCheck,
            show: true,
        },
        {   
            title: 'Jadwal & Sidang',
            href: teamUrl('jadwal'),
            icon: Calendar,
            show: can('sidang.read'),
        },
        {
            title: 'Kontrol Timeline',
            href: teamUrl('timeline-kontrol'),
            icon: Clock,
            show: can('master.manage'), // Hanya untuk admin/panitia
        },
        {
            title: 'Data Master',
            href: teamUrl('master-data'),
            icon: Database,
            show: can('master.manage'), 
        },
        {
            title: 'Pengaturan RBAC',
            href: teamUrl('rbac'),
            icon: ShieldCheck,
            show: can('rbac.view'), // Granular check khusus admin
        },
    ];

    // Filter menu dinamis
    const mainNavItems = allNavItems.filter(item => item.show);

    const footerNavItems = [
        {
            title: 'Repository',
            href: 'https://github.com/laravel/react-starter-kit',
            icon: FolderGit2,
        },
        {
            title: 'Documentation',
            href: 'https://laravel.com/docs/starter-kits#react',
            icon: BookOpen,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardUrl} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <TeamSwitcher />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}