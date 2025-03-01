import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/index';

const Home = lazy(() => import('@components/Home'));
const BGComponent = lazy(() => import('@components/BitGoJS'));
const BGApiComponent = lazy(() => import('@components/BitGoAPI'));

const Loading = () => <div>Loading route...</div>;

const App = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/bitgo-js" element={<BGComponent />} />
            <Route path="/bitgo-api" element={<BGApiComponent />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
