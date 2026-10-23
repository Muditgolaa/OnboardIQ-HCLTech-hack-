import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-line bg-white px-3 text-sm placeholder:text-ink-soft/60 focus-visible:border-forest disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}
