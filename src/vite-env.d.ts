/// <reference types="vite/client" />

declare module '*.css?raw' {
  const content: string;
  export default content;
}

declare module '*.png?inline' {
  const content: string;
  export default content;
}

declare module '*.jpg?inline' {
  const content: string;
  export default content;
}

declare module '*.svg?inline' {
  const content: string;
  export default content;
}

declare module '*.svg?raw' {
  const content: string;
  export default content;
}
