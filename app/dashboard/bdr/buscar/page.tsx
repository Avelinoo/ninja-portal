'use client'

import { useState } from 'react'
import { Search, Loader2, CheckCircle, ChevronDown } from 'lucide-react'

const SEGMENTOS = [
  {
    categoria: 'Saúde',
    icon: '🏥',
    tipos: [
      { label: 'Clínicas Médicas', query: 'clínica médica' },
      { label: 'Odontologia', query: 'clínica odontológica' },
      { label: 'Psicologia', query: 'psicólogo clínica' },
      { label: 'Fisioterapia', query: 'clínica fisioterapia' },
      { label: 'Nutrição', query: 'nutricionista clínica' },
      { label: 'Veterinária', query: 'clínica veterinária' },
    ]
  },
  {
    categoria: 'Estética & Beleza',
    icon: '💅',
    tipos: [
      { label: 'Salão de Beleza', query: 'salão de beleza' },
      { label: 'Barbearia', query: 'barbearia' },
      { label: 'Clínica Estética', query: 'clínica estética' },
      { label: 'Spa', query: 'spa massagem' },
      { label: 'Manicure', query: 'manicure pedicure' },
    ]
  },
  {
    categoria: 'Fitness',
    icon: '💪',
    tipos: [
      { label: 'Academia', query: 'academia fitness' },
      { label: 'Crossfit', query: 'crossfit box' },
      { label: 'Pilates', query: 'estúdio pilates' },
      { label: 'Yoga', query: 'estúdio yoga' },
    ]
  },
  {
    categoria: 'Alimentação',
    icon: '🍽️',
    tipos: [
      { label: 'Restaurante', query: 'restaurante' },
      { label: 'Lanchonete', query: 'lanchonete fast food' },
      { label: 'Padaria', query: 'padaria confeitaria' },
      { label: 'Açaí / Sorvete', query: 'açaí sorveteria' },
    ]
  },
  {
    categoria: 'Educação',
    icon: '📚',
    tipos: [
      { label: 'Escola', query: 'escola colégio' },
      { label: 'Curso / Idiomas', query: 'curso idiomas escola' },
      { label: 'Reforço Escolar', query: 'reforço escolar aulas' },
      { label: 'Faculdade', query: 'faculdade universidade' },
    ]
  },
  {
    categoria: 'Serviços',
    icon: '🔧',
    tipos: [
      { label: 'Advocacia', query: 'escritório advocacia' },
      { label: 'Contabilidade', query: 'escritório contabilidade' },
      { label: 'Imobiliária', query: 'imobiliária' },
      { label: 'Oficina / Auto', query: 'oficina mecânica' },
      { label: 'Construção', query: 'construtora' },
    ]
  },
  {
    categoria: 'Varejo',
    icon: '🛍️',
    tipos: [
      { label: 'Farmácia', query: 'farmácia drogaria' },
      { label: 'Supermercado', query: 'supermercado mercado' },
      { label: 'Pet Shop', query: 'pet shop animal' },
      { label: 'Moda / Roupa', query: 'loja roupa moda' },
    ]
  },
  {
    categoria: 'iGaming / Digital',
    icon: '🎯',
    tipos: [
      { label: 'Marketing Digital', query: 'agência marketing digital' },
      { label: 'Desenvolvimento', query: 'empresa tecnologia software' },
      { label: 'E-commerce', query: 'loja virtual ecommerce' },
    ]
  },
]

const UFS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']

const CIDADES_POR_UF: Record<string, string[]> = {
  RJ: ['Rio de Janeiro', 'Niterói', 'Duque de Caxias', 'Nova Iguaçu', 'Campos dos Goytacazes', 'Petrópolis', 'Volta Redonda', 'Macaé', 'Angra dos Reis', 'Teresópolis'],
  SP: ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André', 'Osasco', 'Ribeirão Preto', 'Sorocaba', 'Santos', 'Mauá'],
  MG: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros', 'Ribeirão das Neves', 'Uberaba'],
  RS: ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria', 'Gravataí', 'Novo Hamburgo'],
  BA: ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Itabuna'],
  PR: ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'São José dos Pinhais'],
  SC: ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Criciúma'],
  PE: ['Recife', 'Caruaru', 'Petrolina', 'Olinda', 'Paulista'],
  CE: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral'],
  GO: ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde'],
}

interface Resultado {
  inseridos: number
  duplicados: number
  total_gerado: number
}

export default function BuscarPage() {
  const [segmentoAberto, setSegmentoAberto] = useState<string | null>('Saúde')
  const [tipoSelecionado, setTipoSelecionado] = useState<{ label: string; query: string } | null>(null)
  const [uf, setUf] = useState('')
  const [cidade, setCidade] = useState('')
  const [cidadeCustom, setCidadeCustom] = useState('')
  const [limite, setLimite] = useState(100)
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [erro, setErro] = useState('')

  const cidadesFiltro = uf ? (CIDADES_POR_UF[uf] || []) : []
  const cidadeFinal = cidadeCustom || cidade

  async function gerar() {
    if (!tipoSelecionado) { setErro('Selecione um segmento'); return }
    if (!cidadeFinal) { setErro('Informe a cidade'); return }
    setLoading(true); setErro(''); setResultado(null)

    try {
      const res = await fetch('/api/leads/gmaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipoSelecionado.query,
          cidade: cidadeFinal,
          uf,
          limite,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao gerar leads'); return }
      setResultado(data)
    } catch {
      setErro('Erro de conexão com a API')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>Buscar Leads</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Selecione o segmento, cidade e gere sua lista
        </p>
      </div>

      {/* Segmentos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-subtle)' }}>
          1. Escolha o segmento
        </h2>
        <div className="space-y-1.5">
          {SEGMENTOS.map(seg => (
            <div key={seg.categoria}>
              <button
                onClick={() => setSegmentoAberto(segmentoAberto === seg.categoria ? null : seg.categoria)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: segmentoAberto === seg.categoria ? 'var(--brand-light)' : 'transparent',
                  color: segmentoAberto === seg.categoria ? 'var(--brand)' : 'var(--foreground)',
                }}
              >
                <span className="flex items-center gap-2">
                  <span>{seg.icon}</span>
                  {seg.categoria}
                </span>
                <ChevronDown
                  size={14}
                  className="transition-transform"
                  style={{ transform: segmentoAberto === seg.categoria ? 'rotate(180deg)' : 'none' }}
                />
              </button>

              {segmentoAberto === seg.categoria && (
                <div className="flex flex-wrap gap-2 px-3 py-2">
                  {seg.tipos.map(tipo => {
                    const ativo = tipoSelecionado?.query === tipo.query
                    return (
                      <button
                        key={tipo.query}
                        onClick={() => setTipoSelecionado(tipo)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                        style={{
                          background: ativo ? '#19a66a' : 'transparent',
                          color: ativo ? '#fff' : 'var(--text-muted)',
                          borderColor: ativo ? '#19a66a' : 'var(--border)',
                        }}
                      >
                        {tipo.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Localização */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-subtle)' }}>
          2. Localização
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Estado</label>
            <select
              value={uf}
              onChange={e => { setUf(e.target.value); setCidade(''); setCidadeCustom('') }}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#19a66a] transition-all"
              style={{ color: 'var(--foreground)' }}
            >
              <option value="">Selecione</option>
              {UFS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Cidade</label>
            {cidadesFiltro.length > 0 ? (
              <select
                value={cidade}
                onChange={e => setCidade(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#19a66a] transition-all"
                style={{ color: 'var(--foreground)' }}
              >
                <option value="">Selecione</option>
                {cidadesFiltro.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__custom">Outra cidade...</option>
              </select>
            ) : (
              <input
                value={cidadeCustom}
                onChange={e => setCidadeCustom(e.target.value)}
                placeholder="Digite a cidade"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#19a66a] transition-all"
                style={{ color: 'var(--foreground)' }}
              />
            )}
          </div>
        </div>

        {cidade === '__custom' && (
          <input
            value={cidadeCustom}
            onChange={e => setCidadeCustom(e.target.value)}
            placeholder="Digite o nome da cidade"
            className="w-full mt-3 px-3 py-2.5 rounded-lg border border-gray-200 text-sm outline-none focus:border-[#19a66a] transition-all"
            style={{ color: 'var(--foreground)' }}
          />
        )}
      </div>

      {/* Quantidade */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-subtle)' }}>
          3. Quantidade
        </h2>
        <div className="flex items-center gap-4">
          {[50, 100, 200].map(n => (
            <button
              key={n}
              onClick={() => setLimite(n)}
              className="flex-1 py-2 rounded-lg text-sm font-medium border transition-all"
              style={{
                background: limite === n ? '#19a66a' : 'transparent',
                color: limite === n ? '#fff' : 'var(--text-muted)',
                borderColor: limite === n ? '#19a66a' : 'var(--border)',
              }}
            >
              {n} leads
            </button>
          ))}
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--text-subtle)' }}>
          Google Maps retorna até 60 resultados por busca. Para mais, repita com bairros diferentes.
        </p>
      </div>

      {/* Resumo selecionado */}
      {tipoSelecionado && cidadeFinal && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm flex items-center gap-2" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
          <Search size={14} />
          <span><strong>{tipoSelecionado.label}</strong> em <strong>{cidadeFinal}</strong>{uf ? ` — ${uf}` : ''}</span>
        </div>
      )}

      {erro && <p className="mb-4 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}

      {resultado && (
        <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--brand-light)' }}>
          <CheckCircle size={18} style={{ color: 'var(--brand)', marginTop: 1, flexShrink: 0 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--brand)' }}>
              {resultado.inseridos.toLocaleString('pt-BR')} leads adicionados
            </p>
            {resultado.duplicados > 0 && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--brand)' }}>
                {resultado.duplicados} já existiam na base
              </p>
            )}
          </div>
        </div>
      )}

      <button
        onClick={gerar}
        disabled={loading}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
        style={{ backgroundColor: '#19a66a' }}
      >
        {loading
          ? <><Loader2 size={16} className="animate-spin" /> Buscando no Google Maps...</>
          : <><Search size={16} /> Gerar Leads</>}
      </button>
    </div>
  )
}
