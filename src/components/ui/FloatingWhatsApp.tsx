import { MessageCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function FloatingWhatsApp() {
  const location = useLocation();

  const handleWhatsAppClick = () => {
    const phoneNumber = '4491431962';
    const message = encodeURIComponent('¡Hola! Me gustaría obtener más información.');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  // Don't render on auth page
  return location.pathname === '/auth' ? null : (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-28 right-4 bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-lg z-50 transition-all duration-300 hover:scale-110 active:scale-90 animate-fade-scale"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
    </button>
  );
}