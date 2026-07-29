# Backend do Trackfy

O backend segue a base tecnológica da Numa: Route Handlers do Next.js, MongoDB
com driver nativo, pool de conexões preparado para funções da Vercel, React
Query e logs estruturados com Pino.

## Configuração

Copie as variáveis de `.env.example` para `.env.local`. O MongoDB pode ser local
ou um cluster MongoDB Atlas.

```env
MONGODB_URI="mongodb://127.0.0.1:27017"
MONGODB_DB="trackfy"
```

Para iniciar o banco local configurado em `compose.yaml`:

```bash
npm run db:up
```

Os dados ficam no volume persistente `trackfy_mongodb_data`. Use
`npm run db:down` para parar o serviço sem apagar o volume.

O primeiro acesso cria um cookie `httpOnly` com um identificador aleatório. Esse
identificador separa a lista de cada navegador sem expor dados ao JavaScript. O
cadastro e o login substituem esse identificador pelo `ownerId` da conta e migram
automaticamente os itens que já estavam salvos no navegador.

As senhas são derivadas com `scrypt` e salt individual. A autenticação usa um token
aleatório armazenado no MongoDB apenas como hash e enviado ao navegador em cookie
`httpOnly`, `sameSite=lax` e `secure` em produção. As sessões expiram em 30 dias.

## Endpoints

- `GET /api/tracking`: lista os itens acompanhados.
- `GET /api/tracking/:mediaType/:mediaId`: retorna o progresso de um título.
- `PATCH /api/tracking/:mediaType/:mediaId`: salva lista, status e avaliação.
- `DELETE /api/tracking/:mediaType/:mediaId`: remove o acompanhamento.
- `PATCH /api/tracking/tv/:mediaId/episodes`: marca episódios como assistidos ou
  salvos para depois.
- `POST /api/auth/register`: cria a conta e inicia a sessão.
- `POST /api/auth/login`: autentica e inicia a sessão.
- `GET /api/auth/session`: retorna o usuário autenticado ou `null`.
- `POST /api/auth/logout`: encerra a sessão e volta a usar uma lista anônima.

`mediaType` aceita `movie` ou `tv`. Avaliações usam valores inteiros de 1 a 5.

O MongoDB cria automaticamente um índice único para
`ownerId + mediaType + mediaId` e um índice para ordenar a lista por atualização.
