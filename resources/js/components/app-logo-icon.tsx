import type { SVGAttributes } from 'react';

import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            src="/images/logo-polman-icon.png"
            alt="Logo Polman"
            {...props}
        />
    );
}