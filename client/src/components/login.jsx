import React from 'react';
import { Link } from 'react-router-dom';
import './Login.css'; // Asegúrate de crear este archivo y agregar tus estilos

function Login() {
  return (
    <div className="login">
      <img className="login__image" src="url-de-tu-imagen" alt="Pokemon" />
      <Link className="login__button" to="/home">Ingresar</Link>
    </div>
  );
} 

export default Login;