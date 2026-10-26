import { BlankBookTeaser } from '../sections/BlankBookTeaser';
import { Compare } from '../sections/Compare';
import { Faq, FinalCta } from '../sections/Faq';
import { Flow } from '../sections/Flow';
import { Hero } from '../sections/Hero';
import { Study } from '../sections/Study';
import { Taste } from '../sections/Taste';
import { World } from '../sections/World';

export function HomePage() {
  return (
    <>
      <Hero />
      <Flow />
      <Study />
      <Taste />
      <BlankBookTeaser />
      <World />
      <Compare />
      <Faq />
      <FinalCta />
    </>
  );
}
