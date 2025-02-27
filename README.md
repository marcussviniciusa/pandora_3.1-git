# Sistema de Gerenciamento de Mensagens Multicanal (Pandora 3.1)

Sistema unificado para gerenciamento de mensagens de múltiplos canais com integração de IA.

## Funcionalidades

- Gerenciamento de mensagens de WhatsApp e Instagram
- Sistema de filas para processamento assíncrono
- Integração com IA para processamento de mensagens
- Webhooks para integração com sistemas externos
- Notificações em tempo real
- API RESTful documentada

## Requisitos

- Node.js v16+
- PostgreSQL
- npm ou yarn

## Configuração

1. Clone o repositório
2. Instale as dependências:
   ```
   npm install
   cd client && npm install
   ```
3. Configure as variáveis de ambiente no arquivo `.env`
4. Execute as migrações do banco de dados:
   ```
   npm run migrate
   ```
5. Inicie o servidor:
   ```
   npm run dev-full
   ```

## Testando a Conexão com WhatsApp

1. Crie um canal WhatsApp usando a API:
   ```
   POST /api/channels
   {
     "type": "whatsapp",
     "name": "Meu WhatsApp"
   }
   ```

2. Inicie a conexão com o WhatsApp:
   ```
   POST /api/channels/whatsapp/{channel_id}/connect
   ```

3. Obtenha o QR code para autenticação:
   ```
   GET /api/channels/whatsapp/{channel_id}/qrcode
   ```

4. Escaneie o QR code com seu celular (abra o WhatsApp > Menu > WhatsApp Web)

5. Verifique o status da conexão:
   ```
   GET /api/channels/whatsapp/{channel_id}/status
   ```

6. Envie uma mensagem de teste:
   ```
   POST /api/messages
   {
     "channelId": "{channel_id}",
     "contactId": "5511999999999", // Número do destinatário com código do país
     "content": "Mensagem de teste",
     "type": "text"
   }
   ```

## Estrutura do Projeto

```
pandora_3.1/
├── client/                 # Frontend React
├── src/
│   ├── config/             # Configurações
│   ├── controllers/        # Controladores da API
│   ├── db/                 # Configuração e modelos do banco de dados
│   ├── middleware/         # Middlewares Express
│   ├── routes/             # Rotas da API
│   ├── services/           # Serviços de negócio
│   ├── utils/              # Utilitários
│   ├── workers/            # Workers
│   └── index.js            # Ponto de entrada
├── .env                    # Variáveis de ambiente
└── package.json
```

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Autenticação de usuários
- `POST /api/auth/refresh` - Renovação de token

### Gerenciamento de Canais
- `GET /api/channels` - Listar canais configurados
- `POST /api/channels/whatsapp/connect` - Iniciar conexão WhatsApp
- `POST /api/channels/instagram/connect` - Conectar conta Instagram
- `GET /api/channels/{id}/status` - Verificar status de conexão

### Mensagens
- `GET /api/conversations` - Listar conversas
- `GET /api/conversations/{id}/messages` - Obter mensagens de conversa
- `POST /api/messages/send` - Enviar mensagem

### Webhooks
- `POST /api/webhooks/register` - Registrar webhook
- `GET /api/webhooks` - Listar webhooks registrados
- `DELETE /api/webhooks/{id}` - Remover webhook

## Licença

ISC
