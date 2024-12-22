#!/usr/bin/env -S deno run -A
import { Paragraph } from '../components/Paragraph.tsx';
import {
  Container,
  generate,
  ImageFormat,
  LinearGradient,
  Renderer,
} from '../mod.ts';
import { basename, extname } from 'node:path';

function Image() {
  return (
    <Renderer width={480} height={854}>
      <LinearGradient
        width='100%'
        height='100%'
        colors={[[0, '#6190E8'], [1, '#A7BFE8']]}
      >
        <Container
          width={300}
          height={200}
          y={200}
          x={(480 / 2) - (300 / 2)}
          backgroundColor='#fff'
          borderRadius={16}
          shadow={{ color: `rgba(0, 0, 0, 0.5)` }}
          overflow='hidden'
        >
          <Container
            width='100%'
            height={64}
            backgroundColor='#333'
          >
            <Paragraph
              fontSize={24}
              y={(64 / 2) - (24 / 2)}
              color='#fff'
              align='center'
            >
              Ask me anything
            </Paragraph>
          </Container>

          <Container
            width='100%'
            height={200 - 64}
            y={64}
          >
            <Paragraph
              fontSize={24}
              y={((200 - 64) / 2) - (24 / 2)}
              color='#000'
              align='center'
            >
              How old are you?
            </Paragraph>
          </Container>
        </Container>
        <Paragraph
          color='#fff'
          y={854 * .6}
          align='center'
          fontSize={72}
        >
          <b>28🦦</b>
        </Paragraph>
        <Paragraph
          color='#fff'
          fontSize={16}
          y={854 - 32}
          align='center'
        >
          Swipe up to me <b>anything</b>
        </Paragraph>
      </LinearGradient>
    </Renderer>
  );
}

const outFile =
  basename(import.meta.url).slice(0, -extname(import.meta.url).length) +
  '.webp';

generate(Image, { fileName: outFile, format: ImageFormat.WEBP }).catch((e) => {
  console.error(e);
});
