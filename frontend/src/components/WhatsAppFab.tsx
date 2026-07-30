import { SITE, whatsappUrl } from '@/lib/site';

export function WhatsAppFab() {
  return (
    <a
      href={whatsappUrl('Hi CoinEmpire, I have a question about FC 26 coins.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat on WhatsApp ${SITE.whatsappDisplay}`}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-md bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.03] hover:brightness-105"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
        <path d="M20.52 3.48A11.78 11.78 0 0 0 12.04 0C5.5 0 .16 5.34.16 11.88c0 2.1.55 4.14 1.6 5.95L0 24l6.35-1.66a11.86 11.86 0 0 0 5.69 1.45h.01c6.54 0 11.88-5.34 11.88-11.88 0-3.17-1.23-6.16-3.41-8.43ZM12.05 21.7h-.01a9.8 9.8 0 0 1-5-1.37l-.36-.21-3.77.99 1.01-3.67-.24-.38a9.8 9.8 0 0 1-1.5-5.18c0-5.41 4.4-9.81 9.83-9.81 2.62 0 5.09 1.02 6.94 2.88a9.76 9.76 0 0 1 2.87 6.94c0 5.41-4.4 9.81-9.77 9.81Zm5.37-7.35c-.29-.15-1.73-.85-2-.95-.27-.1-.46-.15-.66.15-.2.29-.76.95-.93 1.14-.17.2-.34.22-.63.07-.29-.15-1.22-.45-2.33-1.43-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.34.43-.51.15-.17.2-.29.29-.48.1-.2.05-.36-.02-.51-.07-.15-.66-1.59-.9-2.18-.24-.58-.48-.5-.66-.51h-.56c-.2 0-.51.07-.78.36-.27.29-1.02.99-1.02 2.42s1.05 2.81 1.19 3c.15.2 2.06 3.15 5 4.42.7.3 1.25.48 1.68.61.7.22 1.34.19 1.85.12.56-.08 1.73-.71 1.97-1.39.24-.68.24-1.27.17-1.39-.07-.12-.26-.2-.55-.34Z" />
      </svg>
      WhatsApp
    </a>
  );
}
