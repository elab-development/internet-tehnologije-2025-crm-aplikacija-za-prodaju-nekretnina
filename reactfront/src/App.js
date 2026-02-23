import logo from './logo.svg';
import './App.css';
import Pocetna from './pages/Pocetna';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import AgentDashboard from './pages/AgentDashboard';
import KupciTable from './pages/KupciTable';
import NekretnineTable from './pages/NekretnineTable';
import NavBar from './components/NavBar';
import PonudeTable from './pages/PonudeTable';
import PreglediTable from './pages/PreglediTable';
import NekretnineListPage from './pages/NekretnineListPage';
import NekretninaDetailsPage from './pages/NekretninaDetailsPage';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <BrowserRouter>
    <NavBar />
     <Routes>
       <Route path="/" element={<Pocetna />} />
      <Route path="/login" element={<Login />} />
      <Route path="/agent" element={<AgentDashboard />} />
      <Route path="/kupci" element={<KupciTable />} />
      <Route path="/nekretnine" element={<NekretnineTable />} />


    <Route path="/ponude" element={<PonudeTable />} />
     <Route path="/pregledi" element={<PreglediTable />} />

       <Route path="/ponuda-nekretnina" element={<NekretnineListPage />} />
      <Route path="/ponuda-nekretnina/:id" element={<NekretninaDetailsPage />} />
      <Route path="/admin" element={<AdminDashboard />} />


      
    </Routes>
     
    </BrowserRouter>
  );
}

export default App;
