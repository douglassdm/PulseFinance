import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

interface UseIdleTimerProps {
  timeout?: number; // em milissegundos, padrão 2 horas
  onIdle?: () => void;
  events?: string[];
}

export const useIdleTimer = ({
  timeout = 30 * 60 * 1000, // 30 minutos em milissegundos
  onIdle,
  events = [
    'mousedown',
    'mousemove', 
    'keypress',
    'scroll',
    'touchstart',
    'click'
  ]
}: UseIdleTimerProps = {}) => {
  const { signOut } = useAuth();
  const timeoutId = useRef<NodeJS.Timeout>();
  const eventListenerRef = useRef<() => void>();

  const resetTimer = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    timeoutId.current = setTimeout(() => {
      if (onIdle) {
        onIdle();
      } else {
        // Logout automático por inatividade
        signOut();
      }
    }, timeout);
  }, [timeout, onIdle, signOut]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    // Inicializar o timer
    resetTimer();

    // Adicionar event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    eventListenerRef.current = () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };

    // Cleanup
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      if (eventListenerRef.current) {
        eventListenerRef.current();
      }
    };
  }, [events, handleActivity, resetTimer]);

  return {
    resetTimer
  };
};