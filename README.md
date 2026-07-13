# Agendamento Lab Med

Aplicativo independente para a **Equipe de Campo** agendar e consultar medidores destinados à entrada no Laboratório de Medição.

## Funcionalidades

- **Agendar** — cadastro de medidor com CSD, cliente presente e reserva automática da próxima data disponível
- **Consultar** — listagem dos agendamentos (filtro "somente meus" para administrador)
- Autenticação por matrícula e senha
- PostgreSQL com migração e seed automáticos na inicialização

## Integração com Eficiência da Medição

Em produção os dois apps compartilham o **mesmo PostgreSQL**:

- Agendamentos criados aqui aparecem em **Entrada de medidores** no portal principal
- CSDs e calendário de bloqueios são os mesmos
- Login SSO: pelo portal, em Equipe de campo → Agendar/Consultar

Variáveis no Railway do Agendamento Lab Med:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | URL pública (ou interna se mesmo projeto) do Postgres do Eficiência |
| `SHARED_DATABASE` | `true` (desliga migrate/seed locais) |
| `JWT_SECRET` | **igual** ao do Eficiência da Medição |

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

1. Crie um projeto no Railway (ou use o mesmo do Eficiência)
2. Conecte o repositório GitHub
3. Configure as variáveis da tabela de integração acima
4. O `railway.toml` executa `npm run build` e inicia com `npm run start`

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Vite + API em modo desenvolvimento |
| `npm run build` | Build frontend + compilação do servidor |
| `npm run start` | Servidor de produção |
