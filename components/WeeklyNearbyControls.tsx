"use client";
import { useEffect, useRef, useState } from "react";
import type { SchoolCenter } from "@/types/game-location";
import { validPoint, type GeographicPoint } from "@/lib/geo-distance";
export default function WeeklyNearbyControls({
  centers,
  onCenter,
}: {
  centers: SchoolCenter[];
  onCenter: (p: GeographicPoint | null) => void;
}) {
  const [school, setSchool] = useState(""),
    [label, setLabel] = useState(""),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(false);
  const token = useRef(0);
  useEffect(
    () => () => {
      token.current++;
    },
    [],
  );
  function clear() {
    token.current++;
    onCenter(null);
    setSchool("");
    setLabel("");
    setMessage("");
    setLoading(false);
  }
  function locate() {
    const id = ++token.current;
    onCenter(null);
    setSchool("");
    setLabel("");
    if (!navigator.geolocation) {
      setMessage(
        "Location is unavailable in this browser. Choose a school instead.",
      );
      return;
    }
    setLoading(true);
    setMessage("Finding your location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (id !== token.current) return;
        setLoading(false);
        const p = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        if (
          !validPoint(p) ||
          !Number.isFinite(pos.coords.accuracy) ||
          pos.coords.accuracy > 1000
        ) {
          setMessage("Location is too approximate. Choose a school or retry.");
          return;
        }
        onCenter(p);
        setLabel("Near your location");
        setMessage("Location ready.");
      },
      (err) => {
        if (id !== token.current) return;
        setLoading(false);
        setMessage(
          err.code === 1
            ? "Location permission denied. Choose a school, or retry after changing permission."
            : err.code === 3
              ? "Location timed out. Choose a school or retry."
              : "Location unavailable. Choose a school or retry.",
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 },
    );
  }
  return (
    <section className="weekly-location" aria-label="Nearby search center">
      <p>Nearest first · straight-line distance. Following is marked inline.</p>
      <div className="weekly-location-buttons">
        <button
          className="weekly-control"
          type="button"
          onClick={locate}
          disabled={loading}
        >
          {loading ? "Finding location…" : "Use my location"}
        </button>
        <button className="weekly-control" type="button" onClick={clear}>
          {loading ? "Cancel request" : "Clear location"}
        </button>
      </div>
      <label className="weekly-label">
        Or choose a school
        <select
          className="weekly-control"
          value={school}
          onChange={(e) => {
            token.current++;
            setLoading(false);
            setSchool(e.target.value);
            const c = centers.find((c) => c.schoolSlug === e.target.value);
            onCenter(
              c ? { latitude: c.latitude, longitude: c.longitude } : null,
            );
            setLabel(c ? `Near ${c.schoolName}` : "");
            setMessage("");
          }}
        >
          <option value="">Choose a verified venue</option>
          {centers.map((c) => (
            <option key={c.schoolSlug} value={c.schoolSlug}>
              {c.schoolName} · {c.venueName}
            </option>
          ))}
        </select>
      </label>
      {label && <p className="font-semibold">{label}</p>}
      <p role="status">{message}</p>
      <p className="weekly-meta">
        Your location stays in memory and clears when you change week or leave
        Near Me. It is never included in shared links.
      </p>
    </section>
  );
}
