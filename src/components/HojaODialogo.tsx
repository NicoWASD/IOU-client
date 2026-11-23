import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
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
  children: ReactNode;
};

/** Diálogo centrado en desktop y hoja inferior en mobile (design.md 5 y 7.4). */
export function HojaODialogo({ open, onOpenChange, titulo, descripcion, children }: Props) {
  const esDesktop = useEsDesktop();

  if (esDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[480px]"
          {...(descripcion ? {} : { 'aria-describedby': undefined })}
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
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent {...(descripcion ? {} : { 'aria-describedby': undefined })}>
        <DrawerHeader className="text-left">
          <DrawerTitle>{titulo}</DrawerTitle>
          {descripcion && <DrawerDescription>{descripcion}</DrawerDescription>}
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
