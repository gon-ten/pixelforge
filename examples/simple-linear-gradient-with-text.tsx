#!/usr/bin/env -S deno run -A
import {
  generate,
  ImageFormat,
  LinearGradient,
  Paragraph,
  Renderer,
} from '../mod.ts';
import { basename, extname } from 'node:path';

function Image() {
  return (
    <Renderer width={800} height={600}>
      <LinearGradient
        width={800}
        height={600}
        colors={[
          [0, '#1F11CE'],
          [1, '#E52B2B'],
        ]}
      >
        <Paragraph
          color='#fff'
          fontSize={48}
          y={(600 / 2) - (48 / 2)}
          align='center'
        >
          Hello, World!
        </Paragraph>
      </LinearGradient>
    </Renderer>
  );
}

const outFile =
  basename(import.meta.url).slice(0, -extname(import.meta.url).length) +
  '.jpeg';

generate(Image, { fileName: outFile, format: ImageFormat.JPEG }).catch((e) => {
  console.error(e);
});
