import { HashRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Users from './pages/Users/Users';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />} >
          <Route index element={<Users />} />
          <Route path="/users" element={<Users />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
