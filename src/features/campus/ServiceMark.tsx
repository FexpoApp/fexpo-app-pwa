import { PersonStanding, ArrowUpRight, Car, DoorOpen, Info, Utensils, Waves } from 'lucide-react';
export function ServiceMark({ label, size = 16 }: { label: string; size?: number }) {
  const Icon = /baños/i.test(label)
    ? PersonStanding
    : /escalera|ascensor|rampa/i.test(label)
      ? ArrowUpRight
      : /ingreso|acceso|salida/i.test(label)
        ? DoorOpen
        : /parqueo/i.test(label)
          ? Car
          : /comida|mesas/i.test(label)
            ? Utensils
            : /plaza/i.test(label)
              ? Waves
              : Info;
  return <Icon size={size} aria-hidden="true" />;
}
