# Guia de Refatoração do Payroll System

## ⚠️ Problema Identificado

O deploy no Vercel estava retornando **erro 404** para todas as rotas porque a estrutura do projeto estava incorreta:

```
payroll-system (repositório)
├── payroll-system/  (PASTA EXTRA - PROBLEMA!)
│   ├── package.json
│   ├── lib/
│   ├── supabase/
│   └── ...
```

O arquivo `package.json` (configuração Next.js) estava **uma pasta acima demais**, então Vercel não conseguia encontrá-lo.

---

## ✅ Solução: Executar o Script refactor.sh

### Opção 1: Usando Git Bash (Recomendado para Windows)

1. **Abra Git Bash**:
   - Clique com botão direito na pasta do seu projeto
   - Selecione "Git Bash Here"

2. **Execute o script**:
   ```bash
   bash refactor.sh
   ```

3. **O script vai**:
   - Mover todos os arquivos de `payroll-system/payroll-system/` para a raiz
   - Deletar a pasta vazia `payroll-system`
   - Preparar os arquivos para commit

4. **Após o script terminar, copie e execute**:
   ```bash
   git add -A
   git commit -m "Refactor: Move project to root directory for Vercel"
   git push origin main
   ```

---

### Opção 2: Forma Manual (Se não tiver Git Bash)

1. Abra o explorador de arquivos na pasta do seu projeto
2. Entre na pasta `payroll-system/payroll-system/`
3. Selecione TODOS os arquivos (Ctrl+A)
4. Copie (Ctrl+C)
5. Volte à raiz do projeto
6. Cole (Ctrl+V)
7. Delete a pasta vazia `payroll-system`
8. Abra Git Bash e rode:
   ```bash
   git add -A
   git commit -m "Refactor: Move project to root directory"
   git push origin main
   ```

---

## 🔄 Resultado Esperado

Após executar este processo:

✅ Estrutura corrigida:
```
payroll-system (repositório)
├── package.json  (NA RAIZ - CORRETO!)
├── lib/
├── supabase/
├── types/
├── next.config.js
└── ...
```

✅ Vercel detectará o Next.js corretamente

✅ Deploy funcionará sem erros 404

---

## 📊 Verificação

Para confirmar que funcionou:

1. Acesse https://vercel.com/garabed-juniors-projects/payroll-system
2. Veja o novo deploy sendo criado automaticamente
3. Verifique se o status muda de "404" para "Ready"
4. Clique em "Visit" para acessar a aplicação

---

## 🆘 Se algo deu errado

Não se preocupe! Os commits são reversíveis:

```bash
git reset --hard HEAD~1  # Desfazer o último commit
git push origin main -f   # Forçar o push do código anterior
```

Depois tente novamente com mais cuidado.

---

## 📞 Suporte

Se tiver dúvidas, verifique:
- O script está sendo executado **na raiz do projeto** (mesma pasta onde tem `.git`)
- Você tem permissão de escrita na pasta
- Git Bash está atualizado
