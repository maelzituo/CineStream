import { ArrowLeft, ShieldCheck, Database, Lock, Mail, Server } from 'lucide-react';

export default function PrivacyPolicy() {
  const currentDate = new Date().toLocaleDateString('pt-BR');

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-gray-200 antialiased font-sans flex flex-col items-center">
      {/* Navbar Minimalista */}
      <nav className="w-full h-16 border-b border-white/5 bg-surface-container/50 backdrop-blur-md flex items-center px-6 md:px-12 fixed top-0 z-50">
        <button 
          onClick={() => window.history.back()} 
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-display font-bold text-xs tracking-wider uppercase">Voltar</span>
        </button>
      </nav>

      {/* Conteúdo Principal */}
      <main className="w-full max-w-3xl px-6 py-28 md:py-32 space-y-12">
        <header className="space-y-4">
          <h1 className="text-3xl md:text-5xl font-display font-black text-white tracking-tight">
            Política de Privacidade
          </h1>
          <p className="text-sm text-gray-400">Última atualização: {currentDate}</p>
        </header>

        <section className="space-y-8 text-sm md:text-base text-gray-300 leading-relaxed">
          <div className="space-y-3">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-red" />
              1. Identificação do Serviço
            </h2>
            <p>
              Esta Política de Privacidade descreve como o aplicativo <strong>CineStream</strong> ("nós", "nosso", "aplicativo") coleta, usa, protege e compartilha suas informações. Ao utilizar o CineStream, você concorda com as práticas descritas nesta política.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-brand-red" />
              2. Dados Coletados
            </h2>
            <p>Para fornecer e melhorar nossos serviços, coletamos as seguintes informações quando você cria uma conta e utiliza o aplicativo:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-400 marker:text-brand-red">
              <li><strong>Dados de Cadastro:</strong> Endereço de e-mail e senha criptografada (quando cadastrado via e-mail).</li>
              <li><strong>Dados via Google Sign-In:</strong> Nome público, endereço de e-mail e foto de perfil (se você optar por fazer login usando sua conta do Google).</li>
              <li><strong>Dados de Uso e Preferências:</strong> Armazenamos sua lista de filmes favoritos ("Minha Lista"), listas personalizadas criadas por você, e seu histórico de visualização (progresso de filmes e séries assistidos).</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-brand-red" />
              3. Serviços de Terceiros Integrados
            </h2>
            <p>O CineStream opera de forma segura utilizando provedores de nuvem de alta confiabilidade. Seus dados interagem com os seguintes serviços:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-400 marker:text-brand-red">
              <li><strong>Firebase Authentication:</strong> Utilizamos o Google Firebase para gerenciar seu cadastro e login com segurança. Nós não armazenamos senhas em texto puro.</li>
              <li><strong>Cloud Firestore:</strong> Nosso banco de dados principal, onde suas preferências, listas e histórico são salvos de forma segura na nuvem do Google Cloud.</li>
              <li><strong>The Movie Database (TMDB):</strong> Utilizamos a API pública do TMDB para obter informações, sinopses e imagens dos filmes e séries.</li>
              <li><strong>Provedores de Vídeo (Embeds):</strong> O aplicativo atua como um agregador e buscador, redirecionando o player de vídeo para provedores externos (ex: AutoEmbed). Não hospedamos filmes em nossos servidores.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand-red" />
              4. Cookies e Armazenamento Local
            </h2>
            <p>
              Utilizamos tecnologias como <code>localStorage</code> e <code>sessionStorage</code> no seu navegador exclusivamente para fins operacionais: manter você logado (gerenciamento de sessão do Firebase) e armazenar temporariamente o status da interface do aplicativo para proporcionar uma navegação mais rápida. Não utilizamos cookies invasivos para rastreamento publicitário.
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-display font-bold text-white">
              5. Finalidade da Coleta
            </h2>
            <p>Todos os dados coletados têm como única finalidade o funcionamento técnico do aplicativo, permitindo que você:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-400 marker:text-brand-red">
              <li>Acesse sua conta a partir de múltiplos dispositivos.</li>
              <li>Salve e organize seus filmes e séries favoritos.</li>
              <li>Retome a reprodução de um vídeo de onde parou.</li>
            </ul>
            <p><strong>Nós nunca vendemos seus dados pessoais a terceiros.</strong></p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-display font-bold text-white">
              6. Retenção, Exclusão e Seus Direitos
            </h2>
            <p>
              Suas informações são armazenadas enquanto sua conta estiver ativa. Você tem o direito de:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-400 marker:text-brand-red">
              <li>Acessar os dados associados à sua conta.</li>
              <li>Modificar ou remover itens das suas listas.</li>
              <li><strong>Solicitar a exclusão permanente:</strong> Você pode excluir sua conta a qualquer momento diretamente pelo aplicativo (na seção "Perfil") ou solicitando via e-mail. A exclusão da conta apaga definitivamente seu histórico, listas e e-mail de nossos bancos de dados (Firestore e Firebase Auth).</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-brand-red" />
              7. Contato
            </h2>
            <p>
              Se você tiver dúvidas sobre esta Política de Privacidade ou desejar exercer seus direitos sobre seus dados, entre em contato conosco através do e-mail:
            </p>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl inline-block mt-2">
              <a href="mailto:seu-email@dominio.com" className="text-brand-red hover:text-white font-bold transition-colors">
                [INSERIR_SEU_EMAIL_AQUI]
              </a>
            </div>
          </div>
        </section>

        <footer className="pt-8 border-t border-white/5 text-xs text-gray-500 text-center">
          <p>© {new Date().getFullYear()} CineStream. Todos os direitos reservados.</p>
        </footer>
      </main>
    </div>
  );
}
