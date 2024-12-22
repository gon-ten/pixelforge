#!/usr/bin/env -S deno run -A
import {
  Container,
  generate,
  LinearGradient,
  Paragraph,
  Picture,
  Renderer,
} from '../mod.ts';
import { basename, extname } from 'node:path';

function Image() {
  return (
    <Renderer width={800} height={600}>
      <LinearGradient
        width='100%'
        height='100%'
        colors={[[0, '#7dd3fc'], [1, '#2563eb']]}
      >
        <Container
          x={50}
          y={50}
          width={700}
          height={500}
          borderRadius={24}
          shadow={{ color: `rgba(0, 0, 0, 0.5)` }}
          overflow='hidden'
        >
          <Picture
            src='./assets/car.webp'
            region={[300, 300, 1000, 800]}
          />
        </Container>
        <Paragraph
          fontSize={24}
          y={565}
          align='center'
          color='#fff'
        >
          AI Generated BMW M4
        </Paragraph>
      </LinearGradient>
    </Renderer>
  );
}

const outFile =
  basename(import.meta.url).slice(0, -extname(import.meta.url).length) + '.png';

generate(Image, { fileName: outFile }).catch((e) => {
  console.error(e);
});
