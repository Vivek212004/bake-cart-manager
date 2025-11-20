import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { distanceFromBakeryKm } from "@/lib/distance";
import { MAX_DELIVERY_KM } from "@/config/location";
import { toast } from "sonner";

interface DeliveryLocationSectionProps {
  onValidLocation: (data: {
    address: string;
    lat: number;
    lng: number;
    distanceKm: number;
  }) => void;
}

export const DeliveryLocationSection = ({
  onValidLocation,
}: DeliveryLocationSectionProps) => {
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        const dist = distanceFromBakeryKm(latitude, longitude);

        setLat(latitude);
        setLng(longitude);
        setDistanceKm(dist);
        setLoadingLocation(false);

        if (dist > MAX_DELIVERY_KM) {
          toast.error(
            `Sorry, we only deliver within ${MAX_DELIVERY_KM} km. You are ~${dist.toFixed(
              1
            )} km away.`
          );
        } else {
          toast.success(
            `Great! You are ~${dist.toFixed(1)} km away – we can deliver.`
          );
        }
      },
      (err) => {
        console.error(err);
        toast.error("Could not get your location");
        setLoadingLocation(false);
      }
    );
  };

  const handleConfirmAddress = () => {
    if (!address.trim()) {
      toast.error("Please enter your address");
      return;
    }
    if (lat == null || lng == null || distanceKm == null) {
      toast.error("Please click 'Use my current location' first");
      return;
    }
    if (distanceKm > MAX_DELIVERY_KM) {
      toast.error(
        `Address is outside our ${MAX_DELIVERY_KM} km delivery radius`
      );
      return;
    }

    onValidLocation({
      address: address.trim(),
      lat,
      lng,
      distanceKm,
    });
  };

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <div className="space-y-2">
        <Label htmlFor="address">Delivery Address</Label>
        <Input
          id="address"
          placeholder="House no, street, area, city, pincode"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Button
          type="button"
          variant="outline"
          onClick={handleUseMyLocation}
          disabled={loadingLocation}
        >
          {loadingLocation ? "Getting location..." : "Use my current location"}
        </Button>

        {distanceKm != null && (
          <span className="text-sm text-muted-foreground">
            Distance from bakery: {distanceKm.toFixed(2)} km
          </span>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={handleConfirmAddress}>
          Confirm Address
        </Button>
      </div>
    </div>
  );
};
