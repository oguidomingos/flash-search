import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export const runtime = 'edge';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Source {
  kind: string;
  title: string;
  authors?: string[];
  year?: number;
  url?: string;
  doi?: string;
  snippet?: string;
  rank?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface NodeItem {
  label: string;
  type: string;
  score?: number;
  metadata?: Record<string, unknown>;
  sources?: Source[];
  parentNodeId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface WebResult {
  title?: string;
  source?: string;
  url?: string;
  snippet?: string;
  content?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface RelatedTopic {
  topic?: string;
  title?: string;
  description?: string;
  sources?: Source[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Publication {
  title: string;
  year?: number;
  url?: string;
  doi?: string;
  abstract?: string;
  summary?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Expert {
  name: string;
  description?: string;
  credentials?: string;
  publications?: Publication[];
  publication_type?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DeepSeekResponse {
  web_results?: WebResult[];
  related_topics?: RelatedTopic[];
  experts?: Expert[];
}

async function searchWithDeepSeek(topic: string) {
  try {
    // Note: DeepSeek doesn't have a web search API endpoint like this
    // This is a placeholder - in production you'd use their chat API or MCP integration
    console.log('DeepSeek API not available, using fallback data for:', topic);
    throw new Error('DeepSeek API not implemented - using fallback');

    const searchData: DeepSeekResponse = await searchResponse.json();
    
    // Transform DeepSeek results into our mind map format
    const nodes: NodeItem[] = [];
    
    // Main topic node
    nodes.push({
      label: topic,
      type: 'topic',
      score: 1.0,
      metadata: { description: `Main topic: ${topic}` },
      sources: searchData.web_results?.slice(0, 3).map((result, idx) => ({
        kind: 'web',
        title: result.title || `Web result ${idx + 1}`,
        authors: [result.source || 'Unknown'],
        year: new Date().getFullYear(),
        url: result.url || '#',
        snippet: result.snippet || result.content?.substring(0, 200) || '',
        rank: idx + 1
      })) || []
    });

    // Extract subtopics from the search results
    if (searchData.related_topics) {
      searchData.related_topics.slice(0, 5).forEach((subtopic, idx) => {
        nodes.push({
          label: subtopic.topic || subtopic.title || `Subtopic ${idx + 1}`,
          type: 'subtopic',
          score: 0.9 - (idx * 0.1),
          metadata: { description: subtopic.description || 'Related topic' },
          sources: subtopic.sources?.slice(0, 2) || []
        });
      });
    }

    // Add expert/author nodes if available
    if (searchData.experts) {
      searchData.experts.slice(0, 3).forEach((expert, idx) => {
        nodes.push({
          label: expert.name,
          type: 'author',
          score: 0.8 - (idx * 0.05),
          metadata: { 
            description: expert.description || `Expert in ${topic}`,
            credentials: expert.credentials
          },
          sources: expert.publications?.slice(0, 2).map((pub) => ({
            kind: expert.publication_type || 'publication',
            title: pub.title,
            authors: [expert.name],
            year: pub.year || new Date().getFullYear(),
            url: pub.url || pub.doi || '#',
            snippet: pub.abstract || pub.summary || '',
            rank: 1
          })) || []
        });
      });
    }

    return nodes;

  } catch (error) {
    console.error('DeepSeek search error:', error);
    
    // Fallback to enhanced mock data if DeepSeek fails
    const fallbackNodes: NodeItem[] = [
      {
        label: topic,
        type: 'topic',
        score: 1.0,
        metadata: { description: `Main topic: ${topic}` },
        sources: [
          {
            kind: 'wikipedia',
            title: `Wikipedia article about ${topic}`,
            authors: ['Wikipedia Contributors'],
            year: 2024,
            url: `https://en.wikipedia.org/wiki/${topic.replace(/\s+/g, '_')}`,
            snippet: `Comprehensive overview of ${topic} from Wikipedia`,
            rank: 1
          },
          {
            kind: 'web',
            title: `${topic} - Complete Guide`,
            authors: ['Various Experts'],
            year: 2024,
            url: `https://example.com/${topic.toLowerCase().replace(/\s+/g, '-')}`,
            snippet: `In-depth analysis and guide on ${topic}`,
            rank: 2
          }
        ]
      },
      {
        label: `${topic} Research`,
        type: 'subtopic',
        score: 0.9,
        metadata: { description: 'Recent research and studies' },
        sources: [
          {
            kind: 'journal',
            title: `Recent Advances in ${topic} Research`,
            authors: ['Dr. Academic', 'Prof. Research'],
            year: 2024,
            doi: '10.1000/example.2024.001',
            snippet: 'Latest findings and methodologies in the field...',
            rank: 1
          }
        ]
      },
      {
        label: `${topic} Applications`,
        type: 'subtopic',
        score: 0.85,
        metadata: { description: 'Practical applications and use cases' },
        sources: [
          {
            kind: 'web',
            title: `Practical Applications of ${topic}`,
            authors: ['Industry Expert'],
            year: 2024,
            url: 'https://example.com/applications',
            snippet: 'Real-world implementations and case studies...',
            rank: 1
          }
        ]
      },
      {
        label: 'Leading Expert',
        type: 'author',
        score: 0.8,
        metadata: { 
          description: `Renowned authority in ${topic}`,
          credentials: 'PhD, Professor, Research Director'
        },
        sources: [
          {
            kind: 'book',
            title: `The Complete Guide to ${topic}`,
            authors: ['Leading Expert'],
            year: 2023,
            url: 'https://example.com/complete-guide',
            snippet: 'Authoritative resource covering all aspects of the field...',
            rank: 1
          }
        ]
      }
    ];
    
    return fallbackNodes;
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = auth();
    const { userId, orgId, getToken } = await authResult;
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the JWT token for Convex authentication
    const token = await getToken({ template: 'convex' });
    if (!token) {
      return NextResponse.json({ error: 'Failed to get authentication token' }, { status: 401 });
    }

    // Create authenticated Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    convex.setAuth(token);

    const body = await request.json();
    const { topic, params } = body;
    
    if (!topic?.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    // Get or create workspace
    // Use orgId if available, otherwise create a default workspace for the user
    const clerkOrgId = orgId || `user_${userId}`;
    
    let workspace: any = await convex.query(api.queries.getWorkspaceByOrgId, {
      clerkOrgId
    });

    if (!workspace) {
      await convex.mutation(api.mutations.createWorkspace, {
        name: orgId ? `Workspace for ${orgId}` : `Default Workspace for ${userId}`,
        clerkOrgId,
        plan: 'free'
      });
      // Fetch the created workspace
      workspace = await convex.query(api.queries.getWorkspaceByOrgId, {
        clerkOrgId
      });
    }

    // Create query
    const queryResult: any = await convex.mutation(api.mutations.createQuery, {
      workspaceId: workspace._id,
      topic: topic.trim(),
      params: params || {}
    });
    const query = queryResult;

    // Perform search with DeepSeek (async)
    // Using a more robust approach with promises instead of setTimeout
    (async () => {
      try {
        const searchResults = await searchWithDeepSeek(topic.trim());

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await convex.mutation(api.mutations.appendNodesAndSources, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          queryId: query.id as any,
          workspaceId: workspace._id,
          items: searchResults
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await convex.mutation(api.mutations.updateQueryStatus, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          queryId: query.id as any,
          workspaceId: workspace._id,
          status: 'done'
        });
      } catch (error) {
        console.error('Error in DeepSeek search:', error);
        
        // Mark query as failed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await convex.mutation(api.mutations.updateQueryStatus, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          queryId: query.id as any,
          workspaceId: workspace._id,
          status: 'failed'
        });
      }
    })();

    return NextResponse.json({ 
      success: true, 
      queryId: query.id,
      workspaceId: workspace._id 
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}