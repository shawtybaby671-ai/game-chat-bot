import { ReactNode } from 'react';

interface NeonButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function NeonButton({ children, onClick, className = '' }: NeonButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-8 py-4 rounded-xl text-2xl font-bold transition-all hover:scale-110 shadow-lg ${className}`}
    >
      {children}
    </button>
  );
}
