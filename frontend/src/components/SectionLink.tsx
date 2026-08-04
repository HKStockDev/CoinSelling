'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { goToHomeSection } from '@/lib/scroll-section';

type Props = {
  section: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

export function SectionLink({ section, children, className, onClick }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Link
      href="/"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
        goToHomeSection(section, pathname, (href) => {
          void router.push(href);
        });
      }}
    >
      {children}
    </Link>
  );
}
