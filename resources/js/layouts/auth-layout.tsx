import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    children,
    title,
    description,
    canRegister,
    ...props
}: {
    children: React.ReactNode;
    title: string;
    description: string;
    canRegister?: boolean;
}) {
    return (
        <AuthLayoutTemplate
            title={title}
            description={description}
            canRegister={canRegister}
            {...props}
        >
            {children}
        </AuthLayoutTemplate>
    );
}
