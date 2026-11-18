import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <div className="flex items-center gap-2">
            <img
                src="/images/logo-polman.png"
                alt="Polman Bandung"
                className="h-10 w-auto object-contain"
            />
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-none font-semibold">
                    SIMTA
                </span>
            </div>
        </div>
    );
}