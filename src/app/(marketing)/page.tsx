import { Hero } from "@/components/sections/hero";
import { Problem } from "@/components/sections/problem";
import { Solution } from "@/components/sections/solution";
import { Process } from "@/components/sections/process";
import { Offer } from "@/components/sections/offer";
import { Pricing } from "@/components/sections/pricing";
import { Examples } from "@/components/sections/examples";
import { Trust } from "@/components/sections/trust";
import { Cta } from "@/components/sections/cta";
import { Faq } from "@/components/sections/faq";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Problem />
      <Solution />
      <Process />
      <Offer />
      <Pricing />
      <Examples />
      <Trust />
      <Cta />
      <Faq />
    </>
  );
}
