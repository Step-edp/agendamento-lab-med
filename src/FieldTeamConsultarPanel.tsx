import { useCallback, useEffect, useState } from 'react'
import { api, ApiError, type AppUser, type MeterScheduleRecord } from './api'

type FieldTeamConsultarPanelProps = {
  user: AppUser
}

function formatDateTime(isoDate: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(isoDate))
}

function clientPresentLabel(value: 'sim' | 'nao') {
  return value === 'sim' ? 'Sim' : 'Não'
}

export function FieldTeamConsultarPanel({ user }: FieldTeamConsultarPanelProps) {
  const [schedules, setSchedules] = useState<MeterScheduleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [mineOnly, setMineOnly] = useState(user.role === 'field')
  const [feedback, setFeedback] = useState<string | null>(null)

  const loadSchedules = useCallback(async () => {
    setLoading(true)
    setFeedback(null)

    try {
      const { schedules: rows } = await api.listMeterSchedules({
        mine: mineOnly,
      })
      setSchedules(rows)
    } catch (error) {
      setSchedules([])
      setFeedback(
        error instanceof ApiError
          ? error.message
          : 'Não foi possível carregar os agendamentos.',
      )
    } finally {
      setLoading(false)
    }
  }, [mineOnly])

  useEffect(() => {
    void loadSchedules()
  }, [loadSchedules])

  return (
    <>
      <div className="schedule-form-header">
        <div>
          <p className="schedule-form-kicker">Consulta</p>
          <p className="schedule-form-subtitle">
            Agendamentos cadastrados pela equipe de campo
          </p>
        </div>
        <div className="consultar-toolbar">
          {user.role === 'admin' ? (
            <label className="consultar-filter">
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(event) => setMineOnly(event.target.checked)}
              />
              <span>Somente meus agendamentos</span>
            </label>
          ) : null}
        </div>
      </div>

      {feedback ? (
        <div className="login-feedback error" role="status">
          {feedback}
        </div>
      ) : null}

      {loading ? (
        <p className="entrada-panel-empty">Carregando agendamentos...</p>
      ) : schedules.length === 0 ? (
        <p className="entrada-panel-empty">
          Nenhum agendamento encontrado{mineOnly ? ' para o seu usuário' : ''}.
        </p>
      ) : (
        <>
          <p className="consultar-summary">{schedules.length} agendamento(s) encontrado(s)</p>
          <div className="entrada-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medidor</th>
                  <th>Instalação</th>
                  <th>TOI</th>
                  <th>Nota</th>
                  <th>CSD</th>
                  <th>Cliente presente</th>
                  <th>Data reservada</th>
                  <th>Cadastrado em</th>
                  {user.role === 'admin' && !mineOnly ? <th>Matrícula</th> : null}
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td>{schedule.meter}</td>
                    <td>{schedule.installation}</td>
                    <td>{schedule.toi}</td>
                    <td>{schedule.note}</td>
                    <td>{schedule.csd}</td>
                    <td>{clientPresentLabel(schedule.clientPresent)}</td>
                    <td>{schedule.scheduledAtLabel}</td>
                    <td>{formatDateTime(schedule.createdAt)}</td>
                    {user.role === 'admin' && !mineOnly ? (
                      <td>{schedule.createdByRegistration ?? '—'}</td>
                    ) : null}
                    <td>{schedule.schedulingNotes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
