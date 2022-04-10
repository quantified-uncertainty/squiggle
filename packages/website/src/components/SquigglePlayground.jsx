import BrowserOnly from '@docusaurus/BrowserOnly';

export function SquigglePlayground(props) {
  return (
    <BrowserOnly fallback={<div>Loading...</div>}>
      {() => {
        const LibComponent =
          require('@quri/squiggle-components').SquigglePlayground;
        return <LibComponent {...props} />;
      }}
    </BrowserOnly>
  );
}
