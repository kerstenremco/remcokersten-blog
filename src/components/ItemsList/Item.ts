import type { ImageMetadata } from "astro";

export interface Item {
  title: string;
  text: string;
  tags: string[];
  link: string;
  image: ImageMetadata;
}
