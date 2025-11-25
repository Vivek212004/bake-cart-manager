// src/lib/distance.ts
import { BAKERY_LOCATION } from "@/config/location";

const toRad = (v: number) => (v * Math.PI) / 180;

export const distanceFromBakeryKm = (lat: number, lng: number): number => {
  const R = 6371; // km
  const dLat = toRad(lat - BAKERY_LOCATION.lat);
  const dLng = toRad(lng - BAKERY_LOCATION.lng);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(BAKERY_LOCATION.lat)) *
      Math.cos(toRad(lat)) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const straightLineDistance = R * c;
  
  // Apply 1.5x multiplier to approximate road distance
  return straightLineDistance * 1.5;
};
