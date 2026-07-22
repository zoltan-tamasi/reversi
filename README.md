# Reversi

A React + Node.js implementation of reversi/othello with a GraphQL API.

## Stack

- **Server** (`src/server`) — Node.js + TypeScript + [Apollo Server](https://www.apollographql.com/docs/apollo-server/) exposing a GraphQL API. Game logic lives in `src/server/src/game/reversi.ts` as pure functions; games are held in an in-memory store. Compiled to `dist/` with `tsc`; `tsx` runs the sources directly for dev and tests.
- **Client** (`src/client`) — React + Vite + Apollo Client rendering the board.

The two packages are wired together as npm workspaces from the repo root.

## Getting started

```bash
npm install          # installs both workspaces
npm run dev          # starts the API (:4000) and the client (:5173)
```

Or run each side on its own:

```bash
npm run dev:server   # GraphQL API at http://localhost:4000/
npm run dev:client   # React app at http://localhost:5173/
```

Point the client at a different API with `VITE_GRAPHQL_URI`.

## Building & type-checking

```bash
npm run build        # tsc compiles the server to src/server/dist, then builds the client
npm run typecheck    # type-check the server without emitting
npm start            # run the compiled server (node dist/index.js)
```

## Testing

```bash
npm test             # runs the engine unit tests (node --test via tsx)
```

## GraphQL API

```graphql
mutation { newGame { id currentPlayer } }
mutation { makeMove(gameId: "…", row: 2, col: 3) { board scores { black white } } }
mutation { passMove(gameId: "…") { currentPlayer } }
query    { game(id: "…") { status winner legalMoves { row col } } }
```

## Layout

```
src/
  server/            GraphQL API + game engine (TypeScript)
    tsconfig.json    tsc compiler config (outputs to dist/)
    src/
      index.ts       Apollo Server entrypoint
      schema.ts      GraphQL type definitions
      resolvers.ts   Query / Mutation / Game resolvers
      gameStore.ts   In-memory game store
      game/
        reversi.ts   Pure game engine
        reversi.test.ts
  client/            React front-end
    src/
      App.jsx
      apollo.js       Apollo Client setup
      graphql.js      queries & mutations
      components/     Board, Cell, GameInfo
```
