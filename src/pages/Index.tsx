import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DollarSign,
  TrendingUp,
  Shield,
  Smartphone,
  BarChart3,
  PieChart,
  Target,
  Users,
  CheckCircle,
  ArrowRight,
  Star,
  Menu,
  X
} from "lucide-react";

// Button Component
const Button = ({ children, className = "", variant = "default", size = "default", onClick, ...props }) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
    ghost: "hover:bg-gray-100 text-gray-900"
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    lg: "h-12 px-6 py-3 text-lg"
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Card Components
const Card = ({ children, className = "" }) => (
  <div className={`rounded-lg border bg-white shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = "" }) => (
  <p className={`text-sm text-gray-600 ${className}`}>
    {children}
  </p>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleAuthClick = () => {
    navigate('/auth');
  };

  const features = [
    {
      icon: <BarChart3 className="h-6 w-6 text-white" />,
      title: "Controle Total",
      description: "Gerencie todas as suas finanças em um só lugar com dashboards inteligentes"
    },
    {
      icon: <PieChart className="h-6 w-6 text-white" />,
      title: "Relatórios Avançados",
      description: "Visualize tendências e tome decisões baseadas em dados reais"
    },
    {
      icon: <Shield className="h-6 w-6 text-white" />,
      title: "100% Seguro",
      description: "Seus dados protegidos com criptografia militar de ponta"
    }
  ];



  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed w-full top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#006ac7] to-[#0084ff] rounded-xl flex items-center justify-center">
                <img src="/lg-semfundo.png" className="h-8"/>
              </div>
              <span className="text-2xl font-bold text-gray-900">PulseFinance</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-[#006ac7] transition-colors">Recursos</a>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={handleAuthClick}
                className="text-gray-600 hover:text-[#006ac7]"
              >
                Entrar
              </Button>
              <Button 
                onClick={handleAuthClick}
                className="bg-[#006ac7] hover:bg-[#0056a3] text-white px-6"
              >
                Começar Grátis
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-gray-100">
              <nav className="flex flex-col space-y-4 mt-4">
                <a href="#features" className="text-gray-600">Recursos</a>
                <div className="flex flex-col space-y-2 pt-4">
                  <Button variant="ghost" onClick={handleAuthClick}>Entrar</Button>
                  <Button onClick={handleAuthClick} className="bg-[#006ac7] hover:bg-[#0056a3]">
                    Começar Grátis
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Tome Controle do Seu{" "}
                <span className="bg-gradient-to-r from-[#006ac7] to-[#0084ff] bg-clip-text text-transparent">
                  Futuro Financeiro
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Gerencie suas finanças de forma inteligente com nosso dashboard completo. 
                Controle receitas, despesas e investimentos em tempo real.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button
                  size="lg"
                  onClick={handleAuthClick}
                  className="bg-[#006ac7] hover:bg-[#0056a3] text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  Começar Grátis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center space-x-8 text-sm text-gray-500">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Grátis para começar
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  100% Seguro
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Sem compromisso
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Phone mockups */}
              <div className="relative flex justify-center items-center">
                <div className="absolute -left-8 top-8 transform rotate-12 z-10">
                  <div className="w-64 h-96 bg-white rounded-3xl shadow-2xl border-8 border-gray-200 overflow-hidden">
                    <div className="h-full bg-gradient-to-br from-[#006ac7] to-[#0084ff] p-6 flex flex-col">
                      <div className="text-white text-sm mb-4">Dashboard</div>
                      <div className="bg-white/20 rounded-xl p-4 mb-4">
                        <div className="text-white text-xs mb-1">Saldo Total</div>
                        <div className="text-white text-2xl font-bold">R$ 24.847,32</div>
                      </div>
                      <div className="space-y-3 flex-1">
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="flex justify-between text-white text-sm">
                            <span>Receitas</span>
                            <span>+R$ 5.240</span>
                          </div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="flex justify-between text-white text-sm">
                            <span>Despesas</span>
                            <span>-R$ 3.120</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative z-20">
                  <div className="w-72 h-[500px] bg-white rounded-3xl shadow-2xl border-8 border-gray-200 overflow-hidden">
                    <div className="h-full bg-white p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="text-gray-800 font-semibold">Análises</div>
                        <div className="w-8 h-8 bg-[#006ac7] rounded-lg"></div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4">
                          <div className="text-gray-600 text-sm mb-1">Este mês</div>
                          <div className="text-2xl font-bold text-gray-800">R$ 12.847</div>
                          <div className="text-green-500 text-sm">+12% vs mês anterior</div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-[#006ac7] rounded-full mr-3"></div>
                              <span className="text-gray-600 text-sm">Alimentação</span>
                            </div>
                            <span className="text-gray-800 font-semibold">35%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-[#0084ff] rounded-full mr-3"></div>
                              <span className="text-gray-600 text-sm">Transporte</span>
                            </div>
                            <span className="text-gray-800 font-semibold">22%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-[#00a8ff] rounded-full mr-3"></div>
                              <span className="text-gray-600 text-sm">Lazer</span>
                            </div>
                            <span className="text-gray-800 font-semibold">18%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Recursos Poderosos para Controlar Suas Finanças
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tudo que você precisa para gerenciar suas finanças de forma profissional
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="text-center pb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#006ac7] to-[#0084ff] rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature showcase */}
          <div className="bg-gradient-to-r from-[#006ac7] to-[#0084ff] rounded-3xl p-12 text-white">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-6">
                  Gerencie Suas Finanças em um Único Dashboard
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 mr-4 text-green-300" />
                    <span>Controle completo de receitas e despesas</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 mr-4 text-green-300" />
                    <span>Relatórios detalhados em tempo real</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 mr-4 text-green-300" />
                    <span>Metas financeiras personalizadas</span>
                  </div>
                </div>
                <Button 
                  className="mt-8 bg-white text-blue-700 hover:bg-gray-100 hover:text-white px-8 py-3"
                  onClick={handleAuthClick}
                >
                  Começar Agora
                </Button>
              </div>
              
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Saldo Disponível</span>
                      <TrendingUp className="h-5 w-5 text-green-300" />
                    </div>
                    <div className="text-3xl font-bold text-white">R$ 24.847,32</div>
                    <div className="text-green-300 text-sm">+12,5% este mês</div>
                    
                    <div className="space-y-3 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-white/80 text-sm">Receitas</span>
                        <span className="text-white font-semibold">R$ 8.450</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div className="bg-green-400 h-2 rounded-full w-3/4"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#006ac7] to-[#0084ff]">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Comece a Gerenciar Suas Finanças com Confiança
            </h2>
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Junte-se a milhares de usuários que já transformaram suas finanças com o PulseFinance
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                onClick={handleAuthClick}
                className="bg-[#006ac7] text-white hover:bg-[#0056a3] hover:text-white px-8 py-4 text-lg rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
              >
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="flex justify-center items-center space-x-2 text-blue-100">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-lg">4.9/5 de satisfação</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-[#006ac7] to-[#0084ff] rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">PulseFinance</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Transforme sua relação com o dinheiro através de tecnologia inteligente e insights poderosos.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Suporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Ajuda</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 PulseFinance. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;