import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Users from './pages/Users/Users';
import UserPage from './pages/UserPage/UserPage';
import Authors from './pages/Authors/Authors';
import Books from './pages/Books/Books';
import BookCategories from './pages/BookCategories/BookCategories';
import BookPage from './pages/BookPage/BookPage';
import { Login } from './pages/Login/Login';
import Publishers from './pages/Publishers/Publishers';
import Reports from './pages/Reports/Reports';
import { Statistics } from './pages/Statistics/Statistics';
import { Audit } from './pages/Audit/Audit';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} ></Route>
        <Route path="/login" element={<Login />} ></Route>
        <Route path="/dashboard" element={<DashboardLayout />} >
          <Route path="/dashboard/users" element={<Users />} ></Route>
          <Route path="/dashboard/users/:id" element={<UserPage key="user-specific" />} ></Route>
          <Route path="/dashboard/books" element={<Books />} ></Route>
          <Route path="/dashboard/books/:id" element={<BookPage />} ></Route>
          <Route path="/dashboard/authors" element={<Authors />} ></Route>
          <Route path="/dashboard/book-categories" element={<BookCategories />} ></Route>
          <Route path="/dashboard/publishers" element={<Publishers />} ></Route>
          <Route path="/dashboard/reports" element={<Reports />} />
          <Route path="/dashboard/statistics" element={<Statistics />} />
          {/*<Route path="/dashboard/audit" element={<Audit />} />*/}
          <Route path="/dashboard/profile" element={<UserPage key="user-profile" />} ></Route>
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;