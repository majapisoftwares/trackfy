import type { Metadata } from "next";
import { TrackfyLanding } from "@/components/trackfy-landing";

export const metadata: Metadata = {
  title: "Trackfy | Tudo o que você assiste, em um só lugar",
  description:
    "Acompanhe séries, filmes e animes em uma biblioteca feita para o seu ritmo.",
};

export default function LandingPage() {
  return <TrackfyLanding />;
}
