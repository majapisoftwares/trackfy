# Trackfy

Uma plataforma para descobrir e acompanhar filmes, séries e animes. Salve títulos na sua lista, registre avaliações, marque episódios assistidos e receba recomendações baseadas no seu histórico.

## Recursos

- Catálogo de filmes, séries e animes com dados do TMDB.
- Busca, páginas de detalhes e conteúdos populares.
- Lista pessoal, status de visualização e avaliação de títulos.
- Acompanhamento de episódios e seção “Continuar assistindo”.
- Recomendações personalizadas para usuários autenticados.
- Contas, sessões seguras em cookies `httpOnly` e migração da lista anônima.

## Tecnologias

- Next.js 16, React 19 e TypeScript
- Tailwind CSS
- MongoDB com driver nativo
- TanStack Query
- TMDB API

## Pré-requisitos

- Node.js 20 ou superior
- MongoDB local ou MongoDB Atlas
- Credenciais da API do TMDB

## Como executar

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo `.env.local` a partir do exemplo:

   ```bash
   Copy-Item .env.example .env.local
   ```

3. Preencha as variáveis no `.env.local`:

   ```env
   TMDB_ACCESS_TOKEN="seu-token-de-leitura-do-tmdb"
   TMDB_API_KEY="sua-chave-da-api-do-tmdb"
   MONGODB_URI="mongodb://127.0.0.1:27017"
   MONGODB_DB="trackfy"
   ```

4. Opcionalmente, inicie o MongoDB com Docker:

   ```bash
   npm run db:up
   ```

5. Inicie o ambiente de desenvolvimento:

   ```bash
   npm run dev
   ```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Comandos úteis

```bash
npm run lint       # verifica o código com ESLint
npm run typecheck  # verifica os tipos TypeScript
npm run build      # gera a build de produção
npm run db:up      # inicia o MongoDB via Docker
npm run db:down    # para o MongoDB via Docker
```

## API

As rotas de acompanhamento, autenticação e integração com o catálogo ficam em `app/api`. A documentação dos endpoints e detalhes da persistência estão em [BACKEND.md](BACKEND.md).

## Créditos

Os dados de filmes, séries e animes são fornecidos pela [TMDB](https://www.themoviedb.org/). Este produto usa a API do TMDB, mas não é endossado ou certificado pelo TMDB.
