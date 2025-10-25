import React from 'react';

interface ButtonProps {
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    className?: string;
    children: React.ReactNode;
    type: 'primary' | 'secondary' | 'error';
    variant?: 'default' | 'outlined';
    disabled?: boolean;
    startIcon?: React.ReactNode;
    sx?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({
    type,
    variant = 'default',
    children,
    className,
    onClick,
    disabled = false,
    startIcon,
    sx
}) => {
    return (
        <button
            className={`btn btn-${type} btn-${variant} ${className}`}
            onClick={onClick}
            disabled={disabled}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                ...sx
            }}
        >
            {startIcon}
            {children}
        </button>
    );
};
