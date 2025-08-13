'use client';

import { useOrganizationList, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OrganizationSelectionPage() {
  const { isLoaded, organizationList } = useOrganizationList();
  const { orgId } = useAuth();
  const router = useRouter();

  // If user already has an org selected, redirect to app
  useEffect(() => {
    if (orgId) {
      router.push('/app');
    }
  }, [orgId, router]);

  // If no organizations are available, redirect to app (will create default workspace)
  useEffect(() => {
    if (isLoaded && organizationList?.length === 0) {
      router.push('/app');
    }
  }, [isLoaded, organizationList, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
          <p>Please wait while we load your organizations.</p>
        </div>
      </div>
    );
  }

  // If organizations are disabled or not available, show a simple message
  if (!organizationList || organizationList.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">No Organizations Available</h1>
            <p className="text-gray-600 mb-8">
              You don't have any organizations yet. You'll be redirected to the app where a default workspace will be created for you.
            </p>
            <button 
              onClick={() => router.push('/app')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continue to App
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Select Organization</h1>
          <p className="text-gray-600 mb-8">
            Please select or create an organization to continue using the MindMap Research Engine.
          </p>
          
          <div className="flex justify-center">
            <div className="text-gray-500">
              Organizations feature is not enabled in your Clerk account.
              You'll be redirected to the app where a default workspace will be created for you.
            </div>
          </div>
          
          <div className="mt-6">
            <button 
              onClick={() => router.push('/app')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continue to App
            </button>
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            Organizations help you collaborate with your team and manage access to your research projects.
          </div>
        </div>
      </div>
    </div>
  );
}