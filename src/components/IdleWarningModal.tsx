import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface IdleWarningModalProps {
  open: boolean;
  onExtendSession: () => void;
  timeUntilLogout: number; // em milissegundos
}

export const IdleWarningModal = ({ 
  open, 
  onExtendSession, 
  timeUntilLogout 
}: IdleWarningModalProps) => {
  const [countdown, setCountdown] = useState(Math.floor(timeUntilLogout / 1000));

  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  useEffect(() => {
    setCountdown(Math.floor(timeUntilLogout / 1000));
  }, [timeUntilLogout]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Sessão Expirando
          </DialogTitle>
          <DialogDescription>
            Sua sessão expirará em <strong>{formatTime(countdown)}</strong> devido à inatividade.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button 
            onClick={onExtendSession}
            style={{ background: "var(--income-gradient)" }}
          >
            Continuar Conectado
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};