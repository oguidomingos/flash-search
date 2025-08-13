# Configuração do Template JWT para Clerk + Convex

Para resolver o erro "No JWT template exists with name: convex", siga estas etapas:

## 1. Acesse o Painel do Clerk

1. Vá para https://dashboard.clerk.com/
2. Selecione seu aplicativo

## 2. Configure o Template JWT

1. No menu lateral, clique em "JWT Templates"
2. Clique no botão "Add JWT Template"
3. Selecione "Convex" como o tipo de template
4. Dê o nome "convex" ao template (esse é o nome esperado pelo Convex)
5. Clique em "Create"

## 3. Verifique as Configurações

O template deve incluir automaticamente as claims necessárias para o Convex:
- `sub` (ID do usuário)
- `org_id` (ID da organização, se aplicável)

## 4. Salve e Teste

1. Salve o template
2. Reinicie sua aplicação Next.js
3. Tente fazer login novamente

## Erro Comum

Se você ainda estiver vendo o erro, verifique:

1. Se você está usando as chaves de desenvolvimento corretas (não as de produção)
2. Se o nome do template é exatamente "convex" (minúsculo)
3. Se você reiniciou o servidor de desenvolvimento após a configuração

## Referência

Para mais informações, consulte a documentação oficial:
- https://clerk.com/docs/integrations/databases/convex