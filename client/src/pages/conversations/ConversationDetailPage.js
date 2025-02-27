import React from 'react';
import { useParams } from 'react-router-dom';

function ConversationDetailPage() {
  const { id } = useParams();
  
  return (
    <div className="container mt-4">
      <h1>Detalhes da Conversa</h1>
      <p>Esta página está em desenvolvimento. Aqui serão exibidos os detalhes da conversa com ID: {id}</p>
    </div>
  );
}

export default ConversationDetailPage;
