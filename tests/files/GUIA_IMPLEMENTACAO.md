# 🚀 GUIA DE IMPLEMENTAÇÃO - MODAL iOS-PROOF

## 📋 CHECKLIST DE INSTALAÇÃO

- [ ] 1. Copiar arquivos para o projeto
- [ ] 2. Importar CSS global
- [ ] 3. Atualizar imports dos modais existentes
- [ ] 4. Testar no iPhone 13
- [ ] 5. Deploy

---

## 1️⃣ ESTRUTURA DE ARQUIVOS

Coloque os arquivos nas seguintes pastas do seu projeto `prosperus-club-app`:

```
prosperus-club-app/
├── hooks/
│   └── useScrollLock.ts          ← COPIAR AQUI
├── components/
│   └── ui/
│       └── ModalWrapper.tsx      ← SUBSTITUIR o existente
└── src/
    └── index.css                 ← ADICIONAR imports aqui
```

---

## 2️⃣ IMPORTAR CSS GLOBAL

No seu arquivo `src/index.css` (ou `App.css`), adicione no **TOPO**:

```css
/* Modal iOS-Proof Styles */
@import './styles/modal-ios.css';

/* ... resto dos seus estilos ... */
```

Ou copie o conteúdo de `modal-ios.css` diretamente dentro do seu `index.css`.

---

## 3️⃣ EXEMPLOS DE USO

### Exemplo 1: Modal Simples (já usa ModalWrapper)

Se você já usa o ModalWrapper nos seus componentes, **não precisa mudar nada!**
O scroll lock é automático.

```tsx
// Qualquer componente existente que use ModalWrapper
import { ModalWrapper } from '@/components/ui/ModalWrapper';

function MeuComponente() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Abrir Modal</button>

      <ModalWrapper
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Meu Modal"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p>Conteúdo do modal...</p>
          {/* Scroll automático se o conteúdo for grande */}
        </div>
      </ModalWrapper>
    </>
  );
}
```

---

### Exemplo 2: Modal com Formulário (scroll interno)

```tsx
import { ModalWrapper } from '@/components/ui/ModalWrapper';

function FormularioModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Cadastro de Membro"
      maxWidth="xl"
      maxHeight="90vh" // Controla altura máxima
    >
      {/* Form com muitos campos - scroll automático */}
      <form className="space-y-4">
        <input type="text" placeholder="Nome" className="w-full p-2 border rounded" />
        <input type="email" placeholder="Email" className="w-full p-2 border rounded" />
        <textarea placeholder="Bio" rows={10} className="w-full p-2 border rounded" />
        {/* ... mais 20 campos ... */}
        
        <div className="flex gap-4 sticky bottom-0 bg-white pt-4 border-t">
          <button type="button" onClick={() => setIsOpen(false)}>Cancelar</button>
          <button type="submit">Salvar</button>
        </div>
      </form>
    </ModalWrapper>
  );
}
```

---

### Exemplo 3: Modal com Conteúdo Dinâmico/API

```tsx
import { ModalWrapper } from '@/components/ui/ModalWrapper';
import { useEffect, useState } from 'react';

function PerfilSocioModal({ socioId, isOpen, onClose }) {
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && socioId) {
      setLoading(true);
      // Busca dados da API
      fetch(`/api/socios/${socioId}`)
        .then(res => res.json())
        .then(data => setDados(data))
        .finally(() => setLoading(false));
    }
  }, [isOpen, socioId]);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={dados?.name || 'Carregando...'}
      maxWidth="2xl"
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <img src={dados?.image_url} alt={dados?.name} className="w-32 h-32 rounded-full mx-auto" />
          <div>
            <h3 className="font-bold text-lg">{dados?.company}</h3>
            <p className="text-gray-600">{dados?.job_title}</p>
          </div>
          <div className="prose">
            <p>{dados?.bio}</p>
          </div>
          {/* Lista de benefícios, vídeos, etc - pode ter scroll */}
          <div className="grid grid-cols-2 gap-4">
            {dados?.benefits?.map((benefit, idx) => (
              <div key={idx} className="p-4 border rounded">
                {benefit.title}
              </div>
            ))}
          </div>
        </div>
      )}
    </ModalWrapper>
  );
}
```

---

### Exemplo 4: Múltiplos Modais Empilhados

```tsx
function ComponenteComplexo() {
  const [modalPrincipal, setModalPrincipal] = useState(false);
  const [modalConfirmacao, setModalConfirmacao] = useState(false);

  return (
    <>
      <button onClick={() => setModalPrincipal(true)}>Abrir</button>

      {/* Modal 1 */}
      <ModalWrapper
        isOpen={modalPrincipal}
        onClose={() => setModalPrincipal(false)}
        title="Editar Perfil"
        modalId="modal-perfil" // ID único importante!
      >
        <div className="space-y-4">
          <input type="text" className="w-full p-2 border rounded" />
          
          <button 
            onClick={() => setModalConfirmacao(true)}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Deletar Conta
          </button>
        </div>
      </ModalWrapper>

      {/* Modal 2 - empilhado sobre o Modal 1 */}
      <ModalWrapper
        isOpen={modalConfirmacao}
        onClose={() => setModalConfirmacao(false)}
        title="Confirmar Exclusão"
        modalId="modal-confirmacao" // ID único diferente!
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p>Tem certeza que deseja deletar sua conta?</p>
          <div className="flex gap-4">
            <button onClick={() => setModalConfirmacao(false)}>Cancelar</button>
            <button className="bg-red-500 text-white px-4 py-2 rounded">
              Confirmar
            </button>
          </div>
        </div>
      </ModalWrapper>
    </>
  );
}
```

---

### Exemplo 5: Uso Direto do Hook (componente customizado)

Se você quiser criar um modal totalmente customizado sem usar ModalWrapper:

```tsx
import { useScrollLock } from '@/hooks/useScrollLock';

function MeuModalCustomizado({ isOpen, onClose }) {
  // Ativa o scroll lock automaticamente
  useScrollLock({ enabled: isOpen, modalId: 'meu-modal-custom' });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <h2>Modal Customizado</h2>
        <p>O scroll do body está bloqueado!</p>
        <button onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}
```

---

## 4️⃣ PROPS DO MODALWRAPPER

| Prop | Tipo | Default | Descrição |
|------|------|---------|-----------|
| `isOpen` | boolean | - | **Obrigatório.** Controla visibilidade |
| `onClose` | () => void | - | **Obrigatório.** Callback ao fechar |
| `title` | string | - | Título do modal (opcional) |
| `children` | ReactNode | - | **Obrigatório.** Conteúdo do modal |
| `maxWidth` | 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| 'full' | 'lg' | Largura máxima |
| `showCloseButton` | boolean | true | Mostra botão X |
| `closeOnOverlayClick` | boolean | true | Fecha ao clicar fora |
| `closeOnEsc` | boolean | true | Fecha com tecla ESC |
| `maxHeight` | string | '85vh' | Altura máxima (CSS) |
| `className` | string | '' | Classes CSS extras |
| `modalId` | string | 'modal-wrapper' | ID único (para múltiplos modais) |

---

## 5️⃣ MIGRAÇÃO DOS MODAIS EXISTENTES

### Antes (se você tinha modal customizado):

```tsx
function ModalAntigo({ isOpen, onClose }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
      <div className="bg-white p-4 rounded">
        {/* Conteúdo */}
      </div>
    </div>
  );
}
```

### Depois:

```tsx
import { ModalWrapper } from '@/components/ui/ModalWrapper';

function ModalNovo({ isOpen, onClose }) {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Título">
      {/* Mesmo conteúdo */}
    </ModalWrapper>
  );
}
```

---

## 6️⃣ TESTE NO IPHONE 13

### Checklist de testes:

1. **Scroll básico:**
   - [ ] Abrir modal → scroll da página deve estar bloqueado
   - [ ] Tentar scrollar a página → não deve mover
   - [ ] Scrollar dentro do modal → deve funcionar suavemente
   - [ ] Fechar modal → scroll da página deve voltar ao normal

2. **Múltiplos modais:**
   - [ ] Abrir modal 1 → scroll bloqueado
   - [ ] Abrir modal 2 sobre o modal 1 → scroll continua bloqueado
   - [ ] Fechar modal 2 → scroll ainda bloqueado
   - [ ] Fechar modal 1 → scroll volta ao normal

3. **Inputs e teclado:**
   - [ ] Abrir modal com formulário
   - [ ] Clicar em input → teclado virtual aparece
   - [ ] Modal não deve sair da tela
   - [ ] Digitar normalmente
   - [ ] Fechar teclado → modal volta à posição original

4. **Edge cases:**
   - [ ] Rotacionar dispositivo (portrait ↔ landscape)
   - [ ] Abrir/fechar múltiplas vezes rapidamente
   - [ ] Navegar entre páginas com modal aberto
   - [ ] Recarregar página com modal aberto

---

## 7️⃣ TROUBLESHOOTING

### Problema: Scroll ainda acontece no iOS

**Solução:**
```tsx
// Certifique-se de que o CSS foi importado
// Verifique no DevTools se a classe 'scroll-locked' está sendo aplicada ao <body>

// Se necessário, force a aplicação:
useEffect(() => {
  if (isOpen) {
    document.body.classList.add('scroll-locked');
  } else {
    document.body.classList.remove('scroll-locked');
  }
}, [isOpen]);
```

### Problema: Modal não fecha ao clicar fora

**Solução:**
```tsx
<ModalWrapper
  isOpen={isOpen}
  onClose={onClose}
  closeOnOverlayClick={true} // ← Certifique-se de que está true
>
```

### Problema: Conteúdo do modal não tem scroll

**Solução:**
```tsx
<ModalWrapper
  isOpen={isOpen}
  onClose={onClose}
  maxHeight="90vh" // ← Ajuste a altura máxima
>
  <div className="space-y-4">
    {/* Conteúdo grande aqui */}
  </div>
</ModalWrapper>
```

### Problema: Teclado iOS empurra o modal

**Solução:**
O CSS `modal-ios.css` já trata disso, mas se persistir:

```css
/* Adicione ao seu CSS */
@supports (-webkit-touch-callout: none) {
  .modal-content {
    max-height: 100vh;
    max-height: -webkit-fill-available;
  }
}
```

---

## 8️⃣ PERFORMANCE & OTIMIZAÇÃO

### Lazy Loading de Modais

Se você tem muitos modais, carregue-os apenas quando necessário:

```tsx
import { lazy, Suspense } from 'react';

const PerfilModal = lazy(() => import('./components/modals/PerfilModal'));

function App() {
  const [showPerfil, setShowPerfil] = useState(false);

  return (
    <>
      <button onClick={() => setShowPerfil(true)}>Ver Perfil</button>
      
      <Suspense fallback={null}>
        {showPerfil && (
          <PerfilModal isOpen={showPerfil} onClose={() => setShowPerfil(false)} />
        )}
      </Suspense>
    </>
  );
}
```

### Memoização

Para modais com conteúdo pesado:

```tsx
import { memo } from 'react';

const PerfilModalContent = memo(({ dados }) => {
  return (
    <div className="space-y-4">
      {/* Renderização pesada */}
    </div>
  );
});

function PerfilModal({ isOpen, onClose, socioId }) {
  const dados = useDados(socioId);
  
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
      <PerfilModalContent dados={dados} />
    </ModalWrapper>
  );
}
```

---

## 9️⃣ PRÓXIMOS PASSOS

1. ✅ Copiar os 3 arquivos para o projeto
2. ✅ Importar o CSS global
3. ✅ Testar um modal simples
4. ✅ Migrar modais existentes progressivamente
5. ✅ Testar no iPhone 13
6. ✅ Deploy para produção

---

## 🎯 RESULTADO ESPERADO

Depois da implementação, no **iPhone 13**:

- ✅ Scroll da página **100% bloqueado** quando modal aberto
- ✅ Scroll **apenas dentro do modal** funcionando suavemente
- ✅ Sem bounce/rubber band nas extremidades
- ✅ Teclado virtual não empurra o modal pra fora
- ✅ Múltiplos modais funcionam perfeitamente
- ✅ Transições suaves e profissionais
- ✅ Safe areas respeitadas (notch, home indicator)

---

## 📚 RECURSOS ADICIONAIS

- [Web.dev - Modal Accessibility](https://web.dev/building-a-dialog-component/)
- [iOS Safari CSS Reference](https://developer.apple.com/documentation/safari-release-notes)
- [React Modal Best Practices](https://reactjs.org/docs/accessibility.html#programmatically-managing-focus)

---

**Versão:** 1.0.0  
**Compatibilidade:** iOS 13+, Android 8+, Chrome, Safari, Firefox  
**Autor:** Solução MVP para Prosperus Club App  
**Data:** Fevereiro 2026
