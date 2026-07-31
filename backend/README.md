# Backend

O backend da Olympic School usa serviços gerenciados do Firebase, sem manter um servidor Node próprio.

## Responsabilidades

- `firebase.json`: configuração dos serviços e emuladores.
- `.firebaserc`: associação com o projeto `biodoraia`.
- `firestore.rules`: autorização, isolamento e validação dos dados.
- `firestore.indexes.json`: índices necessários às consultas do frontend.

Authentication, Firestore, App Check e Firebase AI Logic são executados pela infraestrutura do
Firebase. O frontend acessa esses serviços pelos adaptadores em `frontend/src/services`.

## Comandos

Execute na raiz do repositório:

```sh
npm run firebase:use
npm run firebase:deploy:auth
npm run firebase:deploy:firestore
```

Os comandos usam sempre a versão mais recente da Firebase CLI via `npx`.
