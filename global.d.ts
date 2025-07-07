// Provide a generic JSX namespace to support libraries with TS definitions
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
// Override react-markdown types to avoid library TS errors
declare module 'react-markdown' {
  const ReactMarkdown: any;
  export default ReactMarkdown;
}
