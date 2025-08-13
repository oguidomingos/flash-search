'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useState, useEffect } from 'react';

interface MindMapProps {
  params: Promise<{
    workspaceId: string;
    queryId: string;
  }>;
}

interface Node {
  _id: Id<'nodes'>;
  label: string;
  type: string;
  score?: number;
  metadata?: {
    description?: string;
  };
}

export default function MindMapPage({ params }: MindMapProps) {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [resolvedParams, setResolvedParams] = useState<{ workspaceId: string; queryId: string } | null>(null);

  // Resolve params asynchronously
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const query = useQuery(api.queries.getQuery, 
    resolvedParams ? { queryId: resolvedParams.queryId as Id<'queries'> } : "skip"
  );

  const nodes = useQuery(api.queries.getNodesByQuery, 
    resolvedParams ? { queryId: resolvedParams.queryId as Id<'queries'> } : "skip"
  );

  const edges = useQuery(api.queries.getEdgesByQuery, 
    resolvedParams ? { queryId: resolvedParams.queryId as Id<'queries'> } : "skip"
  );

  if (!resolvedParams || !query) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm border-b p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold">{query.topic}</h1>
            <p className="text-sm text-gray-500">
              Status: {query.status === 'running' ? 'Em andamento' : 
                      query.status === 'done' ? 'Concluída' : 'Erro'}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
              Export PNG
            </button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
              Export PDF
            </button>
            <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50">
              Deep Dive
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="flex-1 relative">
          {nodes && nodes.length > 0 ? (
            <div className="p-8">
              <h3 className="text-lg font-semibold mb-4">Mind Map Nodes ({nodes.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nodes.map((node) => (
                  <div 
                    key={node._id} 
                    className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500 cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedNode(node)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        node.type === 'topic' ? 'bg-red-100 text-red-800' :
                        node.type === 'subtopic' ? 'bg-orange-100 text-orange-800' :
                        node.type === 'author' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {node.type}
                      </span>
                      {node.score && (
                        <span className="text-xs text-gray-500">
                          {Math.round(node.score * 100)}%
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{node.label}</h4>
                    {node.metadata?.description && (
                      <p className="text-sm text-gray-600">{node.metadata.description}</p>
                    )}
                  </div>
                ))}
              </div>
              
              {edges && edges.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Connections ({edges.length})</h3>
                  <div className="bg-white p-4 rounded-lg shadow">
                    {edges.map((edge, idx) => (
                      <div key={edge._id} className="text-sm text-gray-600 mb-1">
                        Connection {idx + 1}: {edge.relation}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {query.status === 'running' ? 'Gerando mapa mental...' : 'Nenhum resultado encontrado'}
                </h3>
                <p className="text-gray-500">
                  {query.status === 'running' 
                    ? 'Os resultados aparecerão aqui conforme são processados.' 
                    : 'Tente uma pesquisa diferente.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {selectedNode && (
          <div className="w-80 bg-white border-l shadow-lg p-4 overflow-y-auto">
            <h3 className="font-semibold text-lg mb-4">Node Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Label:</label>
                <p className="text-gray-900">{selectedNode.label}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Type:</label>
                <p className="text-gray-900 capitalize">{selectedNode.type}</p>
              </div>
              {selectedNode.score && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Score:</label>
                  <p className="text-gray-900">{Math.round(selectedNode.score * 100)}%</p>
                </div>
              )}
              {selectedNode.metadata?.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description:</label>
                  <p className="text-gray-900">{selectedNode.metadata.description}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 space-y-2">
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Add Note
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                Star Node
              </button>
              <button className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                Deep Dive
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}