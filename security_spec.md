# Security Specification — Neia Concept

## 1. Data Invariants
1. **Default-Deny Catch-All**: Nenhuma colecao fora de `settings`, `dresses` e `media` e acessivel.
2. **Publicacao Restrita**: Visitantes anonimos ou nao-administradores so podem ler documentos em `dresses` cujo campo `status == 'published'`. Consultas sem filtro `status == 'published'` sao rejeitadas pelo Firestore na regra `allow list`.
3. **Escrita Administrativa Exclusiva**: Apenas a sessao administrativa autenticada via provedor `password` (`admin@neiaconcept.com.br`) ou conta verificada bootstrap (`pedronepo097@gmail.com`) pode criar, editar, publicar, arquivar ou excluir vestidos, configuracoes e midias.
4. **Integridade de Midia e Tamanho**: Documentos `media` possuem limite maximo de payload (`dataBase64.size() <= 900000`), tipos MIME estritos (`image/webp`, `image/jpeg`, `image/png`) e sao imutaveis apos criacao.
5. **Integridade Temporal e de Autoria**: Campos `createdAt`, `updatedAt` e `createdBy` sao validados contra `request.time` e `request.auth.uid`, com campos de criacao imutaveis em atualizacoes.
6. **Bloqueio de Campos Proibidos**: O schema de `dresses` utiliza `keys().hasOnly(...)` estrito, impedindo a insercao de campos sombra ou nao permitidos.

## 2. The "Dirty Dozen" Payloads (Adversarial Tests)
1. **Unauthenticated Dress Create**: Visitante sem autenticacao tenta criar um vestido em `/dresses/test-1` -> `PERMISSION_DENIED`.
2. **Non-Admin Authenticated Dress Create**: Usuario logado com outra conta tenta criar `/dresses/test-2` -> `PERMISSION_DENIED`.
3. **Unverified Google Email Spoofing**: Token Google com `email_verified: false` tenta atualizar `/settings/store` -> `PERMISSION_DENIED`.
4. **Unfiltered Draft Listing Leak**: Visitante anonimo executa `list` em `/dresses` sem `where('status', '==', 'published')` -> `PERMISSION_DENIED`.
5. **Direct Draft Get Leak**: Visitante anonimo tenta `get` em `/dresses/draft-1` onde `status == 'draft'` -> `PERMISSION_DENIED`.
6. **Publish Without Main Image**: Admin tenta publicar vestido (`status: 'published'`) com `mainImageUrl: ''` -> `PERMISSION_DENIED`.
7. **Shadow Field Injection**: Admin tenta criar vestido com campo extra `isFeaturedHack: true` -> `PERMISSION_DENIED`.
8. **ID Poisoning Attack**: Admin tenta criar `/dresses/invalid..slash$id` ou ID com mais de 128 caracteres -> `PERMISSION_DENIED`.
9. **Timestamp Spoofing**: Admin tenta criar vestido com `createdAt` no passado em vez de `request.time` -> `PERMISSION_DENIED`.
10. **Immutable Creator Tampering**: Admin tenta atualizar `createdBy` de um vestido existente -> `PERMISSION_DENIED`.
11. **Oversized Media DoS**: Admin tenta enviar documento em `/media/m1` com `dataBase64` acima de 900.000 chars ou `mimeType: 'text/html'` -> `PERMISSION_DENIED`.
12. **Arbitrary Collection Write**: Usuario tenta gravar em `/admin_emails/hack` ou outra colecao nao declarada -> `PERMISSION_DENIED`.
