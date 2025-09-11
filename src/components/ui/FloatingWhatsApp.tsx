import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
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
  if (location.pathname === '/auth') {
    return null;
  }

  return (
    <motion.button
      onClick={handleWhatsAppClick}
      className="fixed bottom-28 right-4 bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-lg z-50 transition-colors duration-300"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: 0.5, type: "spring", stiffness: 260, damping: 20 }}
    >
      <MessageCircle className="w-6 h-6" />
    </motion.button>
  );
}