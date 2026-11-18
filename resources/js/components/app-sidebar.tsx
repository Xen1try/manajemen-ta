import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Calendar,
    CalendarCheck,
    ClipboardCheck,
    Clock,
    Database,
    FileText,
    FolderGit2,
    LayoutGrid,
    MessageSquareText,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
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

interface NavConfigItem {
    title: string;
    href: any;
    icon: any;
    /** Selalu tampil untuk semua user yang sudah login */
    public?: boolean;
    /** Tampil jika user punya SALAH SATU permission di daftar ini */
    permissions?: string[];
    /** Tampil otomatis jika user punya permission apa pun pada prefix modul ini (mis. 'bimbingan' -> 'bimbingan.*') */
    modules?: string[];
}

export function AppSidebar() {
    const page = usePage();
    const teamSlug = (page.props.currentTeam as any)?.slug;

    // Ambil daftar permission aktual user dari HandleInertiaRequests
    const userPermissions: string[] = (page.props.auth as any)?.permissions || [];

    // Cek apakah user punya salah satu permission spesifik
    const canAny = (keys: string[] = []) =>
        keys.some((key) => userPermissions.includes(key));

    // Cek otomatis apakah user punya akses apa pun pada modul (mis. 'bimbingan.read', 'bimbingan.verify', dll.)
    const canAnyModule = (prefixes: string[] = []) =>
        prefixes.some((prefix) =>
            userPermissions.some(
                (perm) => perm === prefix || perm.startsWith(`${prefix}.`),
            ),
        );

    const dashboardUrl = teamSlug ? dashboard(teamSlug) : '/';
    const teamUrl = (path: string) => (teamSlug ? `/${teamSlug}/${path}` : `/${path}`);

    // Konfigurasi Menu Otomatis Berbasis Matriks RBAC
    const allNavItems: NavConfigItem[] = [
        {
            title: 'Dashboard',
            href: dashboardUrl,
            icon: LayoutGrid,
            public: true,
        },
        {
            title: 'Bimbingan',
            href: teamUrl('bimbingan'),
            icon: MessageSquareText,
            modules: ['bimbingan'],
            permissions: ['bimbingan.read', 'bimbingan.create', 'bimbingan.verify'],
        },
        {
            title: 'Tema & Matchmaking',
            href: teamUrl('tema-matchmaking'),
            icon: Sparkles,
            modules: ['judul', 'tema', 'matchmaking'],
            permissions: ['judul.read', 'judul.create', 'judul.update', 'judul.approve', 'master.manage'],
        },
        {
            title: 'Dokumen TA',
            href: teamUrl('dokumen'),
            icon: FileText,
            modules: ['dokumen'],
            permissions: ['dokumen.read', 'dokumen.create', 'dokumen.verify'],
        },
        {
            title: 'Kehadiran Seminar',
            href: teamUrl('kehadiran-seminar'),
            icon: ClipboardCheck,
            modules: ['kehadiran', 'seminar'],
            permissions: ['kehadiran.read', 'kehadiran.create', 'kehadiran.verify', 'judul.create'],
        },
        {
            title: 'Pendaftaran',
            href: teamUrl('pendaftaran'),
            icon: CalendarCheck,
            modules: ['pendaftaran'],
            permissions: ['pendaftaran.read', 'pendaftaran.create', 'pendaftaran.verify', 'sidang.create'],
        },
        {
            title: 'Jadwal & Sidang',
            href: teamUrl('jadwal'),
            icon: Calendar,
            modules: ['sidang', 'jadwal'],
            permissions: ['sidang.read', 'sidang.create', 'jadwal.read'],
        },
        {
            title: 'Kontrol Timeline',
            href: teamUrl('timeline-kontrol'),
            icon: Clock,
            modules: ['timeline'],
            permissions: ['master.manage', 'timeline.manage'],
        },
        {
            title: 'Data Master',
            href: teamUrl('master-data'),
            icon: Database,
            modules: ['master'],
            permissions: ['master.manage'],
        },
        {
            title: 'Pengaturan RBAC',
            href: teamUrl('rbac'),
            icon: ShieldCheck,
            modules: ['rbac'],
            permissions: ['rbac.manage', 'rbac.view'],
        },
    ];

    // Filter otomatis: hanya tampilkan menu yang permission/modulnya dimiliki user
    const mainNavItems = allNavItems
        .filter((item) => {
            if (item.public) return true;
            return canAny(item.permissions) || canAnyModule(item.modules);
        })
        .map(({ title, href, icon }) => ({ title, href, icon }));

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