import type { ReactNode } from 'react';

export type Paso = {
  /** Selector CSS del elemento que se resalta (y que el usuario toca). Sin objetivo: presentación. */
  objetivo?: string;
  texto: ReactNode;
  /** Cómo se pasa al siguiente: tocando el objetivo, escribiendo en él o cuando cambia la ruta. */
  avanzaCon: 'boton' | 'click' | 'input' | 'ruta' | 'fin';
  /** El globo va arriba del objetivo (por ejemplo, para no tapar una lista que se abre abajo). */
  arriba?: boolean;
};

/** Rutas en las que la guía tiene sentido: el detalle de un grupo. */
export const RUTA_GRUPO = /^\/grupos\/[^/]+$/;

/** Guía de primer uso (HU-38, design.md 13): crear el primer grupo e invitar. */
export const PASOS: Paso[] = [
  {
    texto: (
      <>
        ¡Hola! Soy <b>Ticky</b>, el ticket de IOU. Anoto quién pagó qué para que nadie se haga el
        distraído. ¿Te muestro cómo armar tu primer grupo?
      </>
    ),
    avanzaCon: 'boton',
  },
  {
    objetivo: '[data-tour="crear-grupo"]',
    texto: (
      <>
        Empecemos por acá: tocá <b>Crear grupo</b>.
      </>
    ),
    avanzaCon: 'click',
  },
  {
    objetivo: '#grupo-nombre',
    texto: <>Ponele un nombre, por ejemplo «Viaje con amigos».</>,
    avanzaCon: 'input',
  },
  {
    objetivo: '[data-tour="confirmar-grupo"]',
    texto: (
      <>
        ¡Buen nombre! Ahora tocá <b>Crear grupo</b>.
      </>
    ),
    avanzaCon: 'ruta',
  },
  {
    objetivo: '[data-tour="tab-miembros"]',
    texto: (
      <>
        Este es tu grupo. En <b>Miembros</b> invitás a tus amigos por su @usuario.
      </>
    ),
    avanzaCon: 'click',
  },
  {
    objetivo: '[data-tour="buscar-usuario"]',
    texto: (
      <>
        Escribí un @usuario y elegilo para invitarlo. Cuando acepte, ya pueden cargar gastos juntos.
        ¡Listo!
      </>
    ),
    avanzaCon: 'fin',
    arriba: true,
  },
];
