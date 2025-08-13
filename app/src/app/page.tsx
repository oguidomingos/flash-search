import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">MRE</h1>
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton>
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Sign In</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link href="/app">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Go to App</button>
            </Link>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            MindMap Research Engine
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Ferramenta ultra-rápida de pesquisa por qualquer tema. Digite um tópico e receba um mind map dinâmico 
            com tópicos principais, subtemas, autores, fontes e conhecimentos aleatórios.
          </p>
          
          <div className="flex justify-center gap-4 mb-16">
            <SignedOut>
              <SignInButton>
                <button className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700">
                  Começar Agora
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/app">
                <button className="px-8 py-4 bg-blue-600 text-white rounded-lg text-lg hover:bg-blue-700">
                  Abrir Aplicativo
                </button>
              </Link>
            </SignedIn>
            <button className="px-8 py-4 border border-gray-300 rounded-lg text-lg hover:bg-gray-50">
              Ver Demo
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Ultra Rápido</h3>
              <p className="text-gray-600">Resultados em tempo real com mapas que se montam progressivamente</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Fontes Confiáveis</h3>
              <p className="text-gray-600">Livros, artigos científicos, blogs e vídeos com citações e metadados</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Exportação</h3>
              <p className="text-gray-600">Exporte seus mapas como XMind, PDF, PNG ou Markdown</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
