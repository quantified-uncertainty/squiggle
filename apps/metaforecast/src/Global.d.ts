// Workaround related to: https://github.com/vercel/next.js/issues/29788
// https://github.com/vercel/next.js/issues/29788#issuecomment-1000595524
declare type StaticImageData = {
  src: string;
  height: number;
  width: number;
  placeholder?: string;
};
