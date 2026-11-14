# Guia de Publicação — Neia Concept

## 1. Serviços e Infraestrutura Utilizados
- **Frontend e Backend (SSR / API Routes)**: Next.js 15 (App Router, `output: 'standalone'`).
- **Banco de Dados e Armazenamento Persistente de Imagens**: Cloud Firestore (projeto Firebase configurado em `firebase-applet-config.json`), com regras de segurança zero-trust em `firestore.rules`.
- **Autenticação Administrativa**: Firebase Authentication via provedor **E-mail/senha** (a interface do `/admin` solicita apenas a senha, utilizando internamente a conta `admin@neiaconcept.com.br`).

## 2. Ativação da Senha Administrativa no Firebase (Passo Único)
1. Acesse o Firebase Console do projeto (`Authentication -> Sign-in method`).
2. Clique em **Adicionar novo provedor** -> **E-mail/senha**, ative a primeira opção (**Ativar**) e salve.
3. Na aba **Users** (**Usuários**), clique em **Adicionar usuário**, informe o e-mail `admin@neiaconcept.com.br` e defina a senha desejada pela proprietária.
4. No painel `/admin`, basta digitar apenas essa senha (não é necessário usar conta Google). A senha pode ser alterada depois na aba **Senha** do próprio painel.

## 3. Variáveis de Ambiente
Declare no ambiente de produção (Cloud Run, Vercel ou servidor próprio com HTTPS):
- `APP_URL`: URL pública oficial com `https://` (ex.: `https://neiaconcept.com.br`), usada para OpenGraph, `sitemap.xml` e `robots.txt`.

## 4. Build e Execução em Produção
```bash
npm install
npm run build
npm run start
```
Para execução via HTTPS, utilize um proxy reverso (Nginx, Caddy, Cloudflare ou o balanceador gerenciado do Cloud Run / Vercel) com certificado SSL/TLS ativo.
