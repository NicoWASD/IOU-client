import { XIcon } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useEsDesktop } from '@/hooks/useMediaQuery';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titulo: string;
  descripcion?: string;
  /** Mientras se envía, no se puede cerrar (Esc, overlay ni botón). */
  bloqueado?: boolean;
  children: ReactNode;
};

/** Diálogo centrado en desktop y hoja inferior en mobile (design.md 5 y 7.4). */
export function HojaODialogo({
  open,
  onOpenChange,
  titulo,
  descripcion,
  bloqueado = false,
  children,
}: Props) {
  const esDesktop = useEsDesktop();

  // Es un diálogo controlado (sin Trigger): al cerrarse, el foco vuelve a quien lo abrió.
  const origen = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (open && document.activeElement instanceof HTMLElement) {
      origen.current = document.activeElement;
    }
  }, [open]);
  const devolverFoco = (e: Event) => {
    if (origen.current?.isConnected) {
      e.preventDefault();
      origen.current.focus();
    }
  };

  const cambiar = (abierto: boolean) => {
    if (!abierto && bloqueado) return;
    onOpenChange(abierto);
  };
  const sinDescripcion = descripcion ? {} : { 'aria-describedby': undefined };

  if (esDesktop) {
    return (
      <Dialog open={open} onOpenChange={cambiar}>
        <DialogContent
          className="sm:max-w-[480px]"
          onCloseAutoFocus={devolverFoco}
          {...sinDescripcion}
        >
          <DialogHeader className="pr-10 text-left">
            <DialogTitle>{titulo}</DialogTitle>
            {descripcion && <DialogDescription>{descripcion}</DialogDescription>}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={cambiar} dismissible={!bloqueado}>
      <DrawerContent onCloseAutoFocus={devolverFoco} {...sinDescripcion}>
        <DrawerHeader className="flex-row items-start justify-between gap-3 text-left">
          <div className="grid gap-1">
            <DrawerTitle>{titulo}</DrawerTitle>
            {descripcion && <DrawerDescription>{descripcion}</DrawerDescription>}
          </div>
          <DrawerClose
            disabled={bloqueado}
            className="-mt-2 -mr-2 grid size-11 flex-none place-items-center rounded-full text-pencil hover:text-graphite disabled:opacity-50"
          >
            <XIcon aria-hidden="true" className="size-5" strokeWidth={1.75} />
            <span className="sr-only">Cerrar</span>
          </DrawerClose>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
