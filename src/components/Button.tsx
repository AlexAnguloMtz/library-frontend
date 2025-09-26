import React from 'react';

interface ButtonProps {
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
    className?: string;
    children: React.ReactNode;
    type: 'primary' | 'secondary' | 'error';
    disabled?: boolean;
    startIcon?: React.ReactNode;
    sx?: React.CSSProperties;
}

export const Button: React.FC<ButtonProps> = ({ 
    type, 
    children, 
    className, 
    onClick, 
    disabled = false, 
    startIcon,
    sx 
}) => {
    return (
        <button 
            className={`btn btn-${type} ${className}`} 
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
