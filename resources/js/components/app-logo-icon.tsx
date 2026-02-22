import type { ComponentPropsWithoutRef } from 'react';

type AppLogoIconProps = ComponentPropsWithoutRef<'img'> & {
    src?: string;
};

export default function AppLogoIcon({
    src = '/img/ico.png',
    alt = 'Animabook',
    ...props
}: AppLogoIconProps) {
    return <img src={src} alt={alt} {...props} />;
}
