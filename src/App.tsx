import { FormEvent, useEffect, useState } from 'react'
import { api, ApiError, type AppUser } from './api'
import { EdpLogo } from './EdpLogo'
import { FieldTeamCadastrarForm } from './FieldTeamCadastrarForm'
import { FieldTeamConsultarPanel } from './FieldTeamConsultarPanel'

type Section = 'Agendar' | 'Consultar'

function TopActionBar({
  onBack,
  onHome,
  onLogout,
}: {
  onBack?: () => void
  onHome: () => void
  onLogout: () => void
}) {
  return (
    <div className="top-action-bar">
      {onBack ? (
        <button type="button" className="secondary-button" onClick={onBack}>
          Voltar
        </button>
      ) : (
        <span />
      )}
      <div className="top-action-bar-right">
        <button type="button" className="secondary-button" onClick={onHome}>
          Início
        </button>
        <button type="button" className="secondary-button" onClick={onLogout}>
          Sair
        </button>
      </div>
    </div>
  )
}

function LoginScreen({ onLoginSuccess }: { onLoginSuccess: (user: AppUser) => void }) {
  const [registration, setRegistration] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setFeedback(null)

    try {
      const { user } = await api.login(registration, password)
      onLoginSuccess(user)
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof ApiError
            ? error.message
            : 'Não foi possível entrar. Tente novamente.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="shell">
      <section className="home-card auth-card">
        <EdpLogo />
        <p className="section-tag">Equipe de Campo</p>
        <h1>Agendamento Lab Med</h1>
        <p>Agende e consulte medidores para entrada no laboratório.</p>

        <section className="auth-panel">
          <header>
            <h2>Entrar com matrícula e senha</h2>
          </header>

          <div className="demo-access-box">
            <strong>Acesso fictício para teste</strong>
            <span>ADM — Matrícula: E706032 | Senha: Step@241</span>
            <span>Campo — Matrícula: F700001 | Senha: Campo@241</span>
          </div>

          <form className="form-grid" onSubmit={(event) => void handleSubmit(event)}>
            <label>
              Matrícula
              <input
                type="text"
                placeholder="Digite sua matrícula"
                value={registration}
                onChange={(event) => setRegistration(event.target.value)}
                autoComplete="username"
              />
            </label>

            <label>
              Senha
              <input
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </label>

            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {feedback ? (
            <div className={`login-feedback ${feedback.type}`} role="status">
              {feedback.message}
            </div>
          ) : null}
        </section>
      </section>
    </main>
  )
}

function HomeScreen({
  user,
  onSelectSection,
  onLogout,
}: {
  user: AppUser
  onSelectSection: (section: Section) => void
  onLogout: () => void
}) {
  const sections: Section[] = ['Agendar', 'Consultar']

  return (
    <main className="shell">
      <section className="home-card">
        <EdpLogo />
        <p className="section-tag">Equipe de Campo</p>
        <h1>Olá, {user.name.split(' ')[0]}</h1>
        <p>Escolha uma opção para continuar.</p>

        <div className="top-action-bar">
          <span />
          <button type="button" className="secondary-button" onClick={onLogout}>
            Sair
          </button>
        </div>

        <div className="measurement-sections" aria-label="Funções da equipe de campo">
          {sections.map((section) => (
            <button
              key={section}
              type="button"
              className="measurement-item"
              onClick={() => onSelectSection(section)}
            >
              <span className="item-with-icon">
                <span>{section}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [booting, setBooting] = useState(true)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      try {
        const hash = window.location.hash
        const ssoMatch = hash.match(/(?:^#|[#&])sso=([^&]+)/)
        const sectionMatch = hash.match(/[?&#]section=([^&]+)/)
        const ssoToken = ssoMatch?.[1] ? decodeURIComponent(ssoMatch[1]) : null
        const sectionFromHash = sectionMatch?.[1]
          ? decodeURIComponent(sectionMatch[1])
          : null

        if (ssoToken) {
          await api.exchangeSsoToken(ssoToken)
          window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
        }

        const { user: currentUser } = await api.me()
        if (cancelled) return
        setUser(currentUser)
        if (sectionFromHash === 'Agendar' || sectionFromHash === 'Consultar') {
          setSelectedSection(sectionFromHash)
        }
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setBooting(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const handleLogout = async () => {
    try {
      await api.logout()
    } catch {
      // ignore
    }
    setUser(null)
    setSelectedSection(null)
  }

  if (booting) {
    return (
      <main className="shell">
        <section className="home-card">
          <p>Carregando...</p>
        </section>
      </main>
    )
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={setUser} />
  }

  if (selectedSection) {
    return (
      <main className="shell">
        <section className="home-card area-screen-card">
          <TopActionBar
            onBack={() => setSelectedSection(null)}
            onHome={() => setSelectedSection(null)}
            onLogout={() => void handleLogout()}
          />
          <p className="section-tag">Equipe de Campo</p>
          <h2>{selectedSection}</h2>
          {selectedSection === 'Agendar' ? (
            <FieldTeamCadastrarForm />
          ) : (
            <FieldTeamConsultarPanel user={user} />
          )}
        </section>
      </main>
    )
  }

  return (
    <HomeScreen
      user={user}
      onSelectSection={setSelectedSection}
      onLogout={() => void handleLogout()}
    />
  )
}
