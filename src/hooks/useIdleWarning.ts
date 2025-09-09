import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from './useAuth';

interface UseIdleWarningProps {
  warningTimeout?: number; // Tempo para mostrar o aviso (padrão 1h45min)
  logoutTimeout?: number;   // Tempo total até logout (padrão 2h)
  events?: string[];
}

export const useIdleWarning = ({
  warningTimeout = 25 * 60 * 1000, // 25 minutos
  logoutTimeout = 30 * 60 * 1000, // 30 minutos
  events = [
    'mousedown',
    'mousemove',
    'keypress', 
    'scroll',
    'touchstart',
    'click'
  ]
}: UseIdleWarningProps = {}) => {
  const { signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const warningTimerId = useRef<NodeJS.Timeout>();
  const logoutTimerId = useRef<NodeJS.Timeout>();

  const resetTimers = useCallback(() => {
    // Limpar timers existentes
    if (warningTimerId.current) clearTimeout(warningTimerId.current);
    if (logoutTimerId.current) clearTimeout(logoutTimerId.current);
    
    // Esconder aviso se estiver mostrando
    setShowWarning(false);

    // Configurar timer para mostrar aviso
    warningTimerId.current = setTimeout(() => {
      setShowWarning(true);
    }, warningTimeout);

    // Configurar timer para logout automático
    logoutTimerId.current = setTimeout(() => {
      signOut();
    }, logoutTimeout);
  }, [warningTimeout, logoutTimeout, signOut]);

  const extendSession = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  useEffect(() => {
    // Inicializar timers
    resetTimers();

    // Adicionar event listeners para detectar atividade
    const handleActivity = () => {
      if (!showWarning) {
        resetTimers();
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup
    return () => {
      if (warningTimerId.current) clearTimeout(warningTimerId.current);
      if (logoutTimerId.current) clearTimeout(logoutTimerId.current);
      
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [events, resetTimers, showWarning]);

  return {
    showWarning,
    extendSession,
    timeUntilLogout: showWarning ? logoutTimeout - warningTimeout : 0
  };
};