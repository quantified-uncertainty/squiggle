import BrowserOnly from '@docusaurus/BrowserOnly';

export function SquiggleEditor(props) {
  return (
    <BrowserOnly fallback={<div>Loading...</div>}>
      {() => {
        const LibComponent =
          require('@quri/squiggle-components').SquiggleEditor;
        return <LibComponent {...props} />;
      }}
    </BrowserOnly>
  );
}
