import { BlankBookTeaser } from '../sections/BlankBookTeaser';
import { Compare } from '../sections/Compare';
import { Faq, FinalCta } from '../sections/Faq';
import { Flow } from '../sections/Flow';
import { Hero } from '../sections/Hero';
import { Taste } from '../sections/Taste';
import { World } from '../sections/World';

export function HomePage() {
  return (
    <>
      <Hero />
      <Flow />
      <Taste />
      <BlankBookTeaser />
      <World />
      <Compare />
      <Faq />
      <FinalCta />
    </>
  );
}
