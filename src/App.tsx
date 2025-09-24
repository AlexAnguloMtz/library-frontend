import { HashRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Users from './pages/Users/Users';
import { Login } from './pages/Login/Login';
import { AuthPage } from './pages/AuthPage/AuthPage';

function App() {
  return (
      <HashRouter>
        <Routes>
          <Route path="/" index element={<Login />} ></Route>
          <Route path="/auth-page" index element={<AuthPage />} ></Route>
        </Routes>
      </HashRouter>
  );
}

export default App;
