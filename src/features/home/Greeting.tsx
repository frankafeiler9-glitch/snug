"use client";

import { useEffect, useState } from "react";

// "Good morning, Alex & Sam". Runs in the browser because it depends on the phone's clock.
export function Greeting({ names }: { names: string }) {
  const [hello, setHello] = useState("Hello");
  useEffect(() => {
    const hour = new Date().getHours();
    setHello(hour < 5 ? "Hello, night owls" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening");
  }, []);

  return <p className="text-sm text-muted">{hello === "Hello, night owls" ? `${hello} 🌙` : `${hello}, ${names}`}</p>;
}
