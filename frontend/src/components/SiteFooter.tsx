import Image from 'next/image';
import Link from 'next/link';
import { SITE, whatsappUrl } from '@/lib/site';

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-gold/15 bg-[#050505] text-white">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <Image
            src="/brand/logo-png.png"
            alt={SITE.name}
            width={150}
            height={44}
            className="h-11 w-auto"
          />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
            {SITE.tagline}
          </p>
        </div>
        <div>
          <p className="font-display text-xs uppercase tracking-[0.16em] text-gold">
            Navegação
          </p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-white/75">
            <Link href="/" className="hover:text-gold">
              Início
            </Link>
            <Link href="/#comprar" className="hover:text-gold">
              Comprar
            </Link>
            <Link href="/#como-funciona" className="hover:text-gold">
              Como Funciona
            </Link>
            <Link href="/buy" className="hover:text-gold">
              Pacotes
            </Link>
            <Link href="/account" className="hover:text-gold">
              Conta
            </Link>
          </div>
        </div>
        <div>
          <p className="font-display text-xs uppercase tracking-[0.16em] text-gold">
            Suporte
          </p>
          <p className="mt-3 text-sm text-white/75">WhatsApp {SITE.whatsappDisplay}</p>
          <a
            href={whatsappUrl('Olá Empire, preciso de ajuda com coins FC 26.')}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-gold hover:underline"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-white/40">
        © {new Date().getFullYear()} {SITE.name}. Não afiliado à EA Sports.
      </div>
    </footer>
  );
}
