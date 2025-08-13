'use client';

import { useAuth, useOrganization } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import Link from 'next/link';

export default function AppHome() {
  const { orgId } = useAuth();
  const { organization } = useOrganization();
  const [searchTopic, setSearchTopic] = useState('');

  // Even if orgId is not available, we'll let the API create a default workspace
  const workspace = useQuery(api.queries.getWorkspaceByOrgId, 
    orgId ? { clerkOrgId: orgId } : 'skip'
  );

  const queries = useQuery(api.queries.getQueriesByWorkspace, 
    workspace ? { workspaceId: workspace._id } : 'skip'
  );

  const handleStartSearch = async () => {
    if (searchTopic.trim()) {
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ topic: searchTopic }),
        });

        if (response.ok) {
          const result = await response.json();
          // Redirect to the mind map page
          window.location.href = `/app/${result.workspaceId}/q/${result.queryId}`;
        } else {
          console.error('Search failed');
        }
      } catch (error) {
        console.error('Error starting search:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {organization?.name || 'MindMap Research Engine'}
            </h1>
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-3xl font-bold text-center mb-6">
              Start a New Research
            </h2>
            
            <div className="flex gap-4 max-w-2xl mx-auto">
              <input
                type="text"
                value={searchTopic}
                onChange={(e) => setSearchTopic(e.target.value)}
                placeholder="Digite um tópico para pesquisar... (ex: Persuasão)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                onKeyPress={(e) => e.key === 'Enter' && handleStartSearch()}
              />
              <button 
                onClick={handleStartSearch}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={!searchTopic.trim()}
              >
                Pesquisar
              </button>
            </div>
            
            {!orgId && (
              <div className="mt-4 text-sm text-gray-500 text-center">
                Você está usando um workspace padrão. Para criar organizações e colaborar com sua equipe, 
                habilite o recurso de organizações no painel do Clerk.
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-xl font-semibold mb-6">Recent Searches</h3>
            
            {queries && queries.length > 0 ? (
              <div className="space-y-4">
                {queries.map((query) => (
                  <div key={query._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div>
                      <h4 className="font-medium">{query.topic}</h4>
                      <p className="text-sm text-gray-500">
                        {query.status === 'running' ? 'Em andamento...' : 
                         query.status === 'done' ? 'Concluída' : 
                         'Erro'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/app/${workspace?._id}/q/${query._id}`}>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                          Ver Mapa
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Nenhuma pesquisa realizada ainda. Comece criando sua primeira pesquisa acima!
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}