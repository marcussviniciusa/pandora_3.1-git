import React from 'react';
import { useAuth } from '../../context/AuthContext';

function ProfilePage() {
  const { user } = useAuth();
  
  return (
    <div className="container mt-4">
      <h1>Perfil</h1>
      <div className="card">
        <div className="card-body">
          <h5 className="card-title">Informações do Usuário</h5>
          {user && (
            <div>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Nome:</strong> {user.name || 'Não especificado'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
