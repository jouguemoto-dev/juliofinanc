# Minhas Economias

Aplicativo pessoal de controle financeiro. O projeto usa React, TypeScript e Vite na interface, com uma API Express para autenticação por e-mail e senha e recursos auxiliares. A autenticação Google e a sincronização opcional usam Firebase.

## Requisitos

- Node.js 20.19+ ou 22.12+
- npm

## Executar localmente

1. Instale as dependências:

   ```sh
   npm install
   ```

2. Copie `.env.example` para `.env`. Defina `GEMINI_API_KEY` somente se quiser habilitar os recursos de IA. Nunca envie o arquivo `.env` ao GitHub.
3. Inicie o servidor e a interface:

   ```sh
   npm run dev
   ```

4. Abra http://localhost:3000.

## Dados e autenticação

- O servidor de desenvolvimento armazena usuários, sessões e dados financeiros em `data/store.json`. Esse arquivo é local, gerado pelo app e excluído do Git.
- O modo sem login mantém os dados no armazenamento local do navegador; esses dados não são sincronizados entre dispositivos.
- A autenticação Google e a sincronização Firestore usam `firebase-applet-config.json`, uma configuração de cliente. As regras do Firestore devem restringir cada usuário aos próprios dados.
- Backups financeiros podem ser exportados e restaurados pela aplicação. Guarde os arquivos de backup em local seguro; eles contêm dados financeiros.

## Validação

```sh
npm test
npm run lint
npm run build
```

## Segurança e implantação

Este projeto está preparado para desenvolvimento local, não para hospedar publicamente dados financeiros. Antes de implantar na internet, revise as regras do Firestore, configure HTTPS e proteção contra abuso, planeje backups e use armazenamento persistente/gerenciado adequado. Nunca versione senhas, tokens, chaves privadas, arquivos `.env`, backups financeiros ou `data/store.json`.
