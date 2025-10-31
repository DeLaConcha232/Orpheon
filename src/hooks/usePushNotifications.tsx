import { useState, useEffect, useCallback } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { useToast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const { toast } = useToast();

  const initializePushNotifications = useCallback(async () => {
    // Request permission for push notifications
    const permissionResult = await PushNotifications.requestPermissions();
    
    if (permissionResult.receive === 'granted') {
      setPermissionGranted(true);
      
      // Register for push notifications
      PushNotifications.register();
      
      // On success, we should be able to receive notifications
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token: ', token.value);
      });

      // Some issue with your setup and push will not work
      PushNotifications.addListener('registrationError', (error) => {
        console.error('Push registration error: ', error);
        toast({
          title: "Error de notificaciones",
          description: "No se pudieron configurar las notificaciones push",
          variant: "destructive",
        });
      });

      // Show us the notification payload if the app is open on our device
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        toast({
          title: notification.title || "Nueva notificación",
          description: notification.body || "Tienes una nueva notificación de Orpheon",
        });
      });

      // Method called when tapping on a notification
      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push notification action performed', notification);
      });
    } else {
      console.log('Push notification permissions denied');
      toast({
        title: "Permisos requeridos",
        description: "Activa las notificaciones para recibir ofertas y actualizaciones",
        variant: "default",
      });
    }
  }, [toast]);

  useEffect(() => {
    initializePushNotifications();
  }, [initializePushNotifications]);

  const sendLocalNotification = (title: string, body: string) => {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png'
        });
      });
    }
  };

  return {
    permissionGranted,
    sendLocalNotification,
    initializePushNotifications
  };
};