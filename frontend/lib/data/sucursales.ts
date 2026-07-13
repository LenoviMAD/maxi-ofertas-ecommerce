import type { Sucursal } from "../types";

// Datos reales de https://maxiofertas.com.ar/sucursales (jul 2026).
// Coordenadas aproximadas (precisión de barrio), suficientes para la demo.
// Claypole va primero: es la sucursal default cuando el usuario no eligió.
export const SUCURSALES: Sucursal[] = [
  {
    id: "claypole",
    nombre: "Claypole",
    direccion: "Av. Lacaze 5948, Claypole",
    telefono: "11-2257-7736",
    horarios: "Lun a Vie: 7 a 18:30 hs · Sáb: 7 a 16 hs · Dom y feriados: 7 a 15:30 hs",
    lat: -34.8025,
    lng: -58.3372,
  },
  {
    id: "fcio-varela-1",
    nombre: "Fcio. Varela",
    direccion: "Av. Monteverde 2246, Villa La Florida",
    telefono: "11-5314-3597",
    horarios: "Lun a Vie: 7 a 16:30 hs · Sáb: 7 a 16 hs · Dom y feriados: 7 a 12:30 hs",
    lat: -34.7861,
    lng: -58.3222,
  },
  {
    id: "fcio-varela-2",
    nombre: "Fcio. Varela",
    direccion: "Av. Eva Perón 5743, Santa Rosa",
    telefono: "11-5058-3489",
    horarios: "Lun a Vie: 7 a 16:30 hs · Sáb: 7 a 16 hs · Dom y feriados: 7 a 12:30 hs",
    lat: -34.8232,
    lng: -58.2963,
  },
  {
    id: "solano",
    nombre: "Solano",
    direccion: "Av. Monteverde 376, San Francisco Solano",
    telefono: "11-3313-9137",
    horarios: "Lun a Vie: 7 a 16:30 hs · Sáb: 7 a 16 hs · Dom y feriados: 7 a 12:30 hs",
    lat: -34.777,
    lng: -58.313,
  },
  {
    id: "quilmes-oeste",
    nombre: "Quilmes",
    direccion: "Felipe Amoedo 1998, Quilmes Oeste",
    telefono: "11-2287-7530",
    horarios: "Lun a Vie: 7 a 16:30 hs · Sáb: 7 a 16 hs · Dom y feriados: 7 a 12:30 hs",
    lat: -34.7376,
    lng: -58.2867,
  },
  {
    id: "dardo-rocha",
    nombre: "Berazategui",
    direccion: "Dardo Rocha 1752, Bernal Oeste",
    telefono: "11-6604-8467",
    horarios: "Lun a Vie: 7 a 16:30 hs · Sáb: 7 a 16 hs · Dom y feriados: 7 a 12:30 hs",
    lat: -34.7247,
    lng: -58.305,
  },
  {
    id: "la-plata",
    nombre: "La Plata",
    direccion: "Av. 44 Nº 2574, La Plata",
    telefono: "11-5457-5418",
    horarios: "Lun a Vie: 7 a 16:30 hs · Sáb: 7 a 16 hs · Dom y feriados: 7 a 12:30 hs",
    lat: -34.9557,
    lng: -57.9645,
  },
  {
    id: "bernal",
    nombre: "Bernal",
    direccion: "Av. Los Quilmes 81, Bernal",
    telefono: "11-2376-9848",
    horarios: "Lun a Vie: 7 a 18 hs · Sáb: 7 a 16 hs · Dom y feriados: 8 a 14 hs",
    lat: -34.7095,
    lng: -58.286,
  },
];
