# Agendamento Lab Med

Aplicativo independente para a **Equipe de Campo** agendar e consultar medidores destinados à entrada no Laboratório de Medição.

## Funcionalidades

- **Agendar** — cadastro de medidor com CSD, cliente presente e reserva automática da próxima data disponível
- **Consultar** — listagem dos agendamentos (filtro "somente meus" para administrador)
- Autenticação por matrícula e senha
- PostgreSQL com migração e seed automáticos na inicialização

## Desenvolvimento local

```bash
npm install
cp .env.example .env
# Configure DATABASE_URL apontando para um PostgreSQL local
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3000

## Usuários demo

| Perfil | Matrícula | Senha |
|--------|-----------|-------|
| Admin | E706032 | Step@241 |
| Campo | F700001 | Campo@241 |
| Campo | F700002 | Campo@241 |

## Deploy (Railway)

1. Crie um projeto no Railway
2. Adicione o plugin **PostgreSQL**
3. Conecte o repositório GitHub deste projeto
4. Variáveis de ambiente:
   - `DATABASE_URL` — gerada automaticamente pelo PostgreSQL do Railway
   - `JWT_SECRET` — segredo forte para tokens
   - `NODE_ENV=production`
5. O `railway.toml` executa `npm run build` e inicia com `npm run start`

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Vite + API em modo desenvolvimento |
| `npm run build` | Build frontend + compilação do servidor |
| `npm run start` | Servidor de produção |
