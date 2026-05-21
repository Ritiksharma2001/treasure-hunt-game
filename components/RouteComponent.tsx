"use client";

import { useEffect } from "react";

import { useMap } from "react-leaflet";

import L from "leaflet";

import "leaflet-routing-machine";

type Props = {
  userPosition: [number, number];
  treasurePosition: [number, number];
};

export default function RouteComponent({
  userPosition,
  treasurePosition,
}: Props) {

  const map = useMap();

  useEffect(() => {

    const routingControl = (L as any).Routing.control({      waypoints: [
        L.latLng(userPosition[0], userPosition[1]),
        L.latLng(
          treasurePosition[0],
          treasurePosition[1]
        ),
      ],

      routeWhileDragging: false,

      show: false,

      addWaypoints: false,

      draggableWaypoints: false,

      fitSelectedRoutes: true,

      lineOptions: {
        styles: [
          {
            color: "#00ffff",
            weight: 6,
          },
        ],
      },

    }).addTo(map);

    return () => {
      map.removeControl(routingControl);
    };

  }, [map, userPosition, treasurePosition]);

  return null;
}