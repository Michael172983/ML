import { Shield } from 'lucide-react';

interface Props {
  active: boolean;
  size?: number;
}

export function ShieldIcon({ active, size = 48 }: Props) {
  return (
    <div className="relative inline-flex items-center justify-center">
      {active && (
        <>
          <span className="absolute inline-flex rounded-full h-full w-full animate-ping opacity-20 bg-green-400" />
          <span className="absolute inline-flex rounded-full h-3/4 w-3/4 animate-ping opacity-10 bg-green-400 delay-150" />
        </>
      )}
      <Shield
        size={size}
        className={active ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'text-gray-600'}
        fill={active ? 'rgba(34,197,94,0.15)' : 'transparent'}
      />
    </div>
  );
}
