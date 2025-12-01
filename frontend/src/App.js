import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainScreen from './components/MainScreen';
import CreateMissionScreen from './components/CreateMissionScreen';
import MonitorScreen from './components/MonitorScreen';
import AnalysisScreen from './components/AnalysisScreen';
import ReportsScreen from './components/ReportsScreen';
import MissionsHistoryScreen from "./components/MissionsHistoryScreen";
import SprayCalculatorScreen from "./components/SprayCalculatorScreen";
import WeatherScreen from "./components/WeatherScreen";
import MissionDetailScreen from "./components/MissionDetailScreen";
import SettingsScreen from "./components/SettingsScreen";
import CalendarScreen from "./components/CalendarScreen";
import SupportScreen from "./components/SupportScreen";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainScreen />} />
        <Route path="/create-mission/:fieldId" element={<CreateMissionScreen />} />
        <Route path="/monitor" element={<MonitorScreen />} />
        <Route path="/analysis" element={<AnalysisScreen />} />
        <Route path="/reports" element={<ReportsScreen />} />
          <Route path="/missions" element={<MissionsHistoryScreen />} />
          <Route path="/spray-calculator" element={<SprayCalculatorScreen />} />
          <Route path="/weather" element={<WeatherScreen />} />
          <Route path="/mission/:id" element={<MissionDetailScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/calendar" element={<CalendarScreen />} />
        <Route path="/support" element={<SupportScreen />} />
      </Routes>
    </Router>
  );
}

export default App;