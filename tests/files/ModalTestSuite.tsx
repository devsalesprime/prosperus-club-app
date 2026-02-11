/**
 * Modal Test Suite - Componente de Teste Completo
 * 
 * Use este componente para validar se os modais estão funcionando
 * corretamente no iPhone 13 antes de migrar todo o app.
 * 
 * Como usar:
 * 1. Adicione este componente em alguma página de teste
 * 2. Acesse pelo iPhone 13
 * 3. Execute todos os testes listados
 * 4. Se todos passarem, pode migrar os modais do app
 * 
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { ModalWrapper } from '../components/ui/ModalWrapper';

export const ModalTestSuite: React.FC = () => {
  const [test1Open, setTest1Open] = useState(false);
  const [test2Open, setTest2Open] = useState(false);
  const [test3Open, setTest3Open] = useState(false);
  const [test4Open, setTest4Open] = useState(false);
  const [test5Open, setTest5Open] = useState(false);
  const [nestedModal, setNestedModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🧪 Modal Test Suite - iPhone 13
          </h1>
          <p className="text-gray-600">
            Execute cada teste e marque ✅ ou ❌ conforme o resultado
          </p>
        </header>

        {/* Conteúdo scrollável da página para testar bloqueio */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">📜 Conteúdo da Página</h2>
          <div className="space-y-4">
            {Array.from({ length: 30 }).map((_, i) => (
              <p key={i} className="text-gray-700">
                Parágrafo {i + 1} - Este é um conteúdo longo para testar se o scroll 
                da página está sendo bloqueado corretamente quando os modais abrem. 
                Tente scrollar a página com cada modal aberto.
              </p>
            ))}
          </div>
        </div>

        {/* Testes */}
        <div className="space-y-4">
          
          {/* TESTE 1: Modal Básico */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">
              ✅ Teste 1: Modal Básico (Scroll Bloqueado)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Verifique se o scroll da página para quando o modal abre.
            </p>
            <button
              onClick={() => setTest1Open(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Abrir Teste 1
            </button>
          </div>

          {/* TESTE 2: Modal com Scroll Interno */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">
              ✅ Teste 2: Modal com Scroll Interno
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Verifique se você consegue scrollar APENAS dentro do modal.
            </p>
            <button
              onClick={() => setTest2Open(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Abrir Teste 2
            </button>
          </div>

          {/* TESTE 3: Modal com Formulário */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">
              ✅ Teste 3: Formulário + Teclado iOS
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Verifique se o teclado iOS não empurra o modal pra fora.
            </p>
            <button
              onClick={() => setTest3Open(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Abrir Teste 3
            </button>
          </div>

          {/* TESTE 4: Múltiplos Modais */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">
              ✅ Teste 4: Modais Empilhados
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Abra um modal sobre outro e verifique o scroll.
            </p>
            <button
              onClick={() => setTest4Open(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Abrir Teste 4
            </button>
          </div>

          {/* TESTE 5: Modal Grande */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">
              ✅ Teste 5: Conteúdo Gigante
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Modal com muito conteúdo - teste scroll suave.
            </p>
            <button
              onClick={() => setTest5Open(true)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Abrir Teste 5
            </button>
          </div>

        </div>

        {/* Checklist */}
        <div className="mt-8 p-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">📋 Checklist de Validação</h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span>Teste 1: Scroll da página bloqueado ✅</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span>Teste 2: Scroll dentro do modal funciona ✅</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span>Teste 3: Teclado não empurra o modal ✅</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span>Teste 4: Múltiplos modais funcionam ✅</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span>Teste 5: Performance fluida em conteúdo grande ✅</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span>Fechar com ESC funciona ✅</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span>Fechar clicando fora funciona ✅</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span>Sem bounce/rubber band no scroll ✅</span>
            </label>
          </div>
        </div>

      </div>

      {/* MODAIS DE TESTE */}

      {/* Teste 1: Modal Básico */}
      <ModalWrapper
        isOpen={test1Open}
        onClose={() => setTest1Open(false)}
        title="✅ Teste 1: Modal Básico"
        maxWidth="md"
        modalId="test-1"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Este é um modal simples. O scroll da página deve estar <strong>completamente bloqueado</strong>.
          </p>
          <div className="p-4 bg-blue-50 rounded">
            <h4 className="font-semibold mb-2">Como testar:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Tente scrollar a página com o dedo</li>
              <li>A página NÃO deve se mover</li>
              <li>Apenas este modal deve estar visível</li>
            </ol>
          </div>
          <p className="text-sm text-gray-500">
            Se o scroll da página se moveu, há um problema! ❌
          </p>
        </div>
      </ModalWrapper>

      {/* Teste 2: Modal com Scroll Interno */}
      <ModalWrapper
        isOpen={test2Open}
        onClose={() => setTest2Open(false)}
        title="✅ Teste 2: Scroll Interno"
        maxWidth="lg"
        maxHeight="60vh"
        modalId="test-2"
      >
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded">
            <h4 className="font-semibold mb-2">Como testar:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Role este conteúdo para baixo</li>
              <li>O scroll deve ser SUAVE (sem travamentos)</li>
              <li>A página atrás NÃO deve se mover</li>
            </ol>
          </div>

          {/* Conteúdo longo */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="p-4 border rounded">
              <h5 className="font-semibold">Item {i + 1}</h5>
              <p className="text-sm text-gray-600">
                Este é um item de conteúdo para criar scroll. Continue scrollando para
                testar se o comportamento está suave e sem problemas no iOS.
              </p>
            </div>
          ))}

          <div className="p-4 bg-green-100 rounded text-center">
            <p className="font-semibold">🎉 Você chegou ao final!</p>
            <p className="text-sm">Se o scroll foi suave, teste passou! ✅</p>
          </div>
        </div>
      </ModalWrapper>

      {/* Teste 3: Modal com Formulário */}
      <ModalWrapper
        isOpen={test3Open}
        onClose={() => setTest3Open(false)}
        title="✅ Teste 3: Formulário iOS"
        maxWidth="xl"
        modalId="test-3"
      >
        <div className="space-y-4">
          <div className="p-4 bg-purple-50 rounded">
            <h4 className="font-semibold mb-2">Como testar:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Clique em cada input abaixo</li>
              <li>O teclado virtual do iOS vai aparecer</li>
              <li>O modal NÃO deve sair da tela</li>
              <li>Digite normalmente em cada campo</li>
            </ol>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome Completo</label>
              <input
                type="text"
                placeholder="Digite seu nome"
                className="w-full p-3 border rounded focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                placeholder="seu@email.com"
                className="w-full p-3 border rounded focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Telefone</label>
              <input
                type="tel"
                placeholder="(11) 98765-4321"
                className="w-full p-3 border rounded focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Empresa</label>
              <input
                type="text"
                placeholder="Nome da empresa"
                className="w-full p-3 border rounded focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Mensagem</label>
              <textarea
                rows={4}
                placeholder="Digite sua mensagem aqui..."
                className="w-full p-3 border rounded focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Data de Nascimento</label>
              <input
                type="date"
                className="w-full p-3 border rounded focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setTest3Open(false)}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Formulário funcionou! ✅');
                }}
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      </ModalWrapper>

      {/* Teste 4: Modais Empilhados */}
      <ModalWrapper
        isOpen={test4Open}
        onClose={() => setTest4Open(false)}
        title="✅ Teste 4: Modal Principal"
        maxWidth="lg"
        modalId="test-4-main"
      >
        <div className="space-y-4">
          <div className="p-4 bg-orange-50 rounded">
            <h4 className="font-semibold mb-2">Como testar:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Clique no botão abaixo para abrir outro modal</li>
              <li>Você terá 2 modais abertos ao mesmo tempo</li>
              <li>O scroll deve continuar bloqueado</li>
              <li>Feche o segundo modal, depois o primeiro</li>
              <li>O scroll da página deve voltar ao normal apenas no final</li>
            </ol>
          </div>

          <p className="text-gray-700">
            Este é o <strong>Modal Principal</strong>. Abra outro modal por cima dele:
          </p>

          <button
            onClick={() => setNestedModal(true)}
            className="w-full px-4 py-3 bg-orange-600 text-white rounded hover:bg-orange-700"
          >
            Abrir Modal Secundário
          </button>

          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              ⚠️ Importante: O scroll da página deve estar bloqueado até você
              fechar TODOS os modais.
            </p>
          </div>
        </div>
      </ModalWrapper>

      {/* Modal Aninhado */}
      <ModalWrapper
        isOpen={nestedModal}
        onClose={() => setNestedModal(false)}
        title="✅ Modal Secundário (Empilhado)"
        maxWidth="md"
        modalId="test-4-nested"
      >
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border-2 border-yellow-400 rounded">
            <p className="font-semibold mb-2">🎯 Você abriu 2 modais!</p>
            <p className="text-sm">
              O scroll da página ainda deve estar bloqueado. Feche este modal
              e depois o principal.
            </p>
          </div>

          <p className="text-gray-700">
            Este é um modal empilhado sobre outro. O sistema deve gerenciar
            ambos corretamente.
          </p>

          <button
            onClick={() => setNestedModal(false)}
            className="w-full px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Fechar Este Modal
          </button>
        </div>
      </ModalWrapper>

      {/* Teste 5: Conteúdo Gigante */}
      <ModalWrapper
        isOpen={test5Open}
        onClose={() => setTest5Open(false)}
        title="✅ Teste 5: Conteúdo Gigante"
        maxWidth="2xl"
        maxHeight="80vh"
        modalId="test-5"
      >
        <div className="space-y-4">
          <div className="p-4 bg-red-50 rounded">
            <h4 className="font-semibold mb-2">Como testar:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Scroll este modal do topo até o final</li>
              <li>O scroll deve ser MUITO SUAVE</li>
              <li>Sem travamentos ou lags</li>
              <li>Sem efeito de "rubber band" nas extremidades</li>
            </ol>
          </div>

          {/* Cards de exemplo */}
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-lg mb-2">
                    Card de Exemplo #{i + 1}
                  </h5>
                  <p className="text-gray-600 text-sm mb-3">
                    Este é um card de exemplo com conteúdo realista. Em um cenário real,
                    aqui poderia estar a descrição de um membro do clube, um evento,
                    um vídeo da academy, etc.
                  </p>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Tag 1
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Tag 2
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      Tag 3
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="p-6 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg text-center">
            <h4 className="text-2xl font-bold mb-2">🎉 Final do Conteúdo!</h4>
            <p>Se você chegou aqui com scroll suave, o teste passou! ✅</p>
          </div>
        </div>
      </ModalWrapper>

    </div>
  );
};

export default ModalTestSuite;
