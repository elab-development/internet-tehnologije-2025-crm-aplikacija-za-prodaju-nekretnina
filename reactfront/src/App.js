import logo from './logo.svg';
import './App.css';
import Pocetna from './pages/Pocetna';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import AgentDashboard from './pages/AgentDashboard';
import KupciTable from './pages/KupciTable';
import NekretnineTable from './pages/NekretnineTable';

function App() {
  return (
    <BrowserRouter>
     <Routes>
       <Route path="/" element={<Pocetna />} />
      <Route path="/login" element={<Login />} />
      <Route path="/agent" element={<AgentDashboard />} />
      <Route path="/kupci" element={<KupciTable />} />
      <Route path="/nekretnine" element={<NekretnineTable />} />

      
    </Routes>
     
    </BrowserRouter>
  );
}

export default App;
