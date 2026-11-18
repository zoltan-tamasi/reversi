# Reversi

A React + Node.js implementation of reversi/othello with a GraphQL API.

## Stack

- **Server** (`src/server`) — Node.js + TypeScript + [Apollo Server](https://www.apollographql.com/docs/apollo-server/) exposing a GraphQL API. Games are held in an in-memory store, each with the list of events that happened in it. Compiled to `dist/` with `tsc`; `tsx` runs the sources directly for dev and tests.
- **Client** (`src/client`) — React + Vite + Apollo Client rendering the board. It keeps a game's events in memory and derives everything it shows from them.
- **Shared** (`src/shared`) — the game engine and event replay as pure functions, used by both sides. Compiled to `dist/` with `tsc`; both sides use the compiled output, so the root scripts build it first.

The three packages are wired together as npm workspaces from the repo root.

## Getting started

```bash
npm install          # installs all workspaces
npm run dev          # starts the API (:4000) and the client (:5173), and rebuilds src/shared on change
```

Or run each side on its own:

```bash
npm run dev:server   # GraphQL API at http://localhost:4000/
npm run dev:client   # React app at http://localhost:5173/
npm run dev:shared   # rebuild src/shared on change
```

Point the client at a different API with `VITE_GRAPHQL_URI`.

## Building & type-checking

```bash
npm run build        # tsc compiles src/shared and the server to their dist folders, then builds the client
npm run typecheck    # type-check the server and the client without emitting
npm start            # run the compiled server (node dist/index.js)
```

## Testing

```bash
npm test             # runs the engine and game store unit tests (node --test via tsx)
```

## GraphQL API

```graphql
mutation { newGame { id } }
mutation { makeMove(gameId: "…", row: 2, col: 3) }
mutation { passMove(gameId: "…") }
query    { game(id: "…") { status winner legalMoves { row col } events { seq type } } }

# Streams the events with a seq above afterSeq: recorded ones first, then new ones.
subscription { joinGame(gameId: "…", afterSeq: -1) { seq type player row col message senderName winner } }
```

## Layout

```
src/
  shared/            Code used by both server and client (TypeScript)
    src/
      reversi.ts     Pure game engine
      reversi.test.ts
      replay.ts      Rebuilds a game's state from its events
  server/            GraphQL API (TypeScript)
    tsconfig.json    tsc compiler config (outputs to dist/)
    src/
      index.ts       Apollo Server entrypoint
      schema.ts      GraphQL type definitions
      resolvers.ts   Query / Mutation / Game resolvers
      gameStore.ts   In-memory game store; records each game's events
      gameEvents.ts  Streams a game's events to subscribers
      game/
        gameStore.test.ts
        gameEvents.test.ts
  client/            React front-end
    src/
      App.jsx
      apollo.js       Apollo Client setup
      graphql.js      queries & mutations
      components/     Board, Cell, GameInfo
```
