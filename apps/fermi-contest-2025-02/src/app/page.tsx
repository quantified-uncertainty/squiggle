import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Fermi Model Competition Viewer</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link href="/submissions" className="p-6 bg-blue-50 rounded-lg shadow hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-2">View Submissions</h2>
          <p>Browse all submitted Fermi models</p>
        </Link>
        
        <Link href="/results" className="p-6 bg-green-50 rounded-lg shadow hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Evaluation Results</h2>
          <p>See the ranking and evaluation scores</p>
        </Link>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">About the Competition</h2>
        <p className="mb-4">
          The $300 Fermi Model Competition encourages exploration of creative ways to use AI for Fermi estimation.
          Models are evaluated based on:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>Surprise (40%)</strong>: How unexpected/novel are the findings?</li>
          <li><strong>Topic Relevance (20%)</strong>: Relevance to rationalist/EA communities</li>
          <li><strong>Robustness (20%)</strong>: Reliability of methodology and assumptions</li>
          <li><strong>Model Quality (20%)</strong>: Technical execution and presentation</li>
        </ul>
        <p>
          <a 
            href="https://forum.effectivealtruism.org/posts/Zc5jki9nXihueDcKj/usd300-fermi-model-competition" 
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            View original contest post on EA Forum
          </a>
        </p>
      </div>
    </div>
  );
}