import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Users from './pages/Users/Users';
import { Login } from './pages/Login/Login';

function App() {
  return (
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} ></Route>
          <Route path="/login" element={<Login />} ></Route>
          <Route path="/dashboard" element={<DashboardLayout />} >
            <Route path="/dashboard/users" element={<Users />} ></Route>
          </Route>
        </Routes>
      </HashRouter>
  );
}

export default App;