#!/usr/bin/env -S deno run -A
import { FontStyle, LoadFont } from '../components/LoadFont.tsx';
import { Parragraph } from '../components/Parragraph.tsx';
import {
  Container,
  generate,
  ImageFormat,
  LinearGradient,
  Renderer,
  Text,
} from '../mod.ts';
import { basename, extname } from 'node:path';

function Image() {
  return (
    <Renderer width={480} height={854}>
      <LoadFont
        default
        style={FontStyle.Regular}
        family='Roboto'
        src='./assets/Roboto-Regular.ttf'
      />
      <LoadFont
        style={FontStyle.Bold}
        family='Roboto'
        src='./assets/Roboto-Bold.ttf'
      />
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
            <Text
              fontSize={24}
              y={(64 / 2) - (24 / 2)}
              content='Ask me anything'
              color='#fff'
              align='center'
            />
          </Container>

          <Container
            width='100%'
            height={200 - 64}
            y={64}
          >
            <Text
              fontSize={24}
              y={((200 - 64) / 2) - (24 / 2)}
              content='How old are you?'
              color='#000'
              align='center'
            />
          </Container>
        </Container>
        <Text
          color='#fff'
          fontSize={72}
          y={854 * .6}
          content='28'
          align='center'
          fontStyle={FontStyle.Bold}
        />
        <Parragraph
          color='#fff'
          fontSize={16}
          y={854 - 32}
          align='center'
        >
          Swipe up to ask me anything
        </Parragraph>
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
