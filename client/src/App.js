import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';

import Login from './components/Login.jsx';// import HomePage from '../components/HomePage.jsx';


function App() {
  return (

    <Routes>
        <Route path="/" exact component={Login} />
        {/* <Route path="/home" component={HomePage} /> */}
    </Routes>
  );
}

export default App;