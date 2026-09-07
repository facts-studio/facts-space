"use client";

// Registro de fotos del equipo REAL (employees), para los avatares que solo
// tienen el email a mano: tareas, cronograma, filtros… Antes salían del mock
// `TEAM`, así que cualquier alta nueva se quedaba sin cara.
//
// El layout del portal lo rellena una vez por render con la plantilla activa.
const PHOTOS = new Map();

export function registerTeamPhotos(list = []) {
  for (const e of list) {
    if (e?.email) PHOTOS.set(e.email.toLowerCase(), e.photo || null);
  }
}

export const photoByEmail = (email) => (email ? PHOTOS.get(email.toLowerCase()) || null : null);

export default function TeamPhotos({ people = [] }) {
  registerTeamPhotos(people);
  return null;
}
