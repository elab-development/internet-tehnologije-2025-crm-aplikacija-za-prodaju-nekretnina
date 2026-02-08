import logo from './logo.svg';
import './App.css';
import Pocetna from './pages/Pocetna';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import AgentDashboard from './pages/AgentDashboard';

function App() {
  return (
    <BrowserRouter>
     <Routes>
       <Route path="/" element={<Pocetna />} />
      <Route path="/login" element={<Login />} />
      <Route path="/agent" element={<AgentDashboard />} />

      
    </Routes>
     
    </BrowserRouter>
  );
}

export default App;
