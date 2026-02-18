// import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from '@/components/Layout';
import { CreateSecretPage } from '@/pages/CreateSecretPage';
import { ViewSecretPage } from '@/pages/ViewSecretPage';
import { ActivityPage } from '@/pages/ActivityPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<CreateSecretPage />} />
            <Route path="/secrets/:id" element={<ViewSecretPage />} />
            <Route path="/activity" element={<ActivityPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
