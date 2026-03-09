import { useState } from 'react'
import { useToast } from '../context/ToastContext'
import { evaluationAPI } from '../api/axios'

const SUS_QUESTIONS = [
  { id: 'q1',  positive: true,  text: 'I think that I would like to use this system frequently.' },
  { id: 'q2',  positive: false, text: 'I found the system unnecessarily complex.' },
  { id: 'q3',  positive: true,  text: 'I thought the system was easy to use.' },
  { id: 'q4',  positive: false, text: 'I think that I would need the support of a technical person to use this system.' },
  { id: 'q5',  positive: true,  text: 'I found the various functions in this system were well integrated.' },
  { id: 'q6',  positive: false, text: 'I thought there was too much inconsistency in this system.' },
  { id: 'q7',  positive: true,  text: 'I would imagine that most people would learn to use this system very quickly.' },
  { id: 'q8',  positive: false, text: 'I found the system very cumbersome to use.' },
  { id: 'q9',  positive: true,  text: 'I felt very confident using the system.' },
  { id: 'q10', positive: false, text: 'I needed to learn a lot of things before I could get going with this system.' },
]

const RATING_COLORS = {
  Excellent: 'var(--success)', Good: 'var(--accent)',
  OK: 'var(--warning)', Poor: '#FB923C', Awful: 'var(--danger)',
}

export default function EvaluationPage() {
  const toast = useToast()
  const [responses, setResponses] = useState({})
  const [respondentType, setRespondentType] = useState('proxy_user')
  const [openFeedback, setOpenFeedback] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const answered = Object.keys(responses).length
  const allAnswered = answered === SUS_QUESTIONS.length

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!allAnswered) { toast.error('Please answer all 10 questions'); return }
    setSubmitting(true)
    try {
      const { data } = await evaluationAPI.submit({ responses, respondentType, openFeedback })
      setResult(data.data)
      toast.success(`SUS Score: ${data.data.susScore} — ${data.data.rating}!`)
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed') }
    finally { setSubmitting(false) }
  }

  if (result) {
    const color = RATING_COLORS[result.rating] || 'var(--accent)'
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }} className="page-enter">
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>
            {result.rating === 'Excellent' ? '🏆' : result.rating === 'Good' ? '✅' : result.rating === 'OK' ? '👍' : '⚠️'}
          </div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: '0.5rem' }}>
            Evaluation Complete
          </h2>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color, margin: '1.5rem 0' }}>
            {result.susScore} / 100
          </div>
          <div style={{
            display: 'inline-block', padding: '0.5rem 1.5rem',
            background: `${color}22`, color, borderRadius: 999,
            fontWeight: 700, fontSize: 'var(--text-lg)', marginBottom: '1.5rem',
          }}>
            {result.rating}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.8 }}>
            The System Usability Scale (Brooke, 1996) score above has been recorded.<br />
            A score ≥71 is considered "Good" and ≥85 is "Excellent" by SUS benchmarks.
          </p>
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-input)', borderRadius: 'var(--radius)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Your response has been anonymously saved and will contribute to the dissertation evaluation data.
          </div>
          <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => { setResult(null); setResponses({}) }}>
            Submit Another Response
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }} className="page-enter">
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="chart-title" style={{ marginBottom: '0.5rem' }}>⭐ System Usability Scale (SUS) Evaluation</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.7 }}>
          This questionnaire measures the usability of the SchoolAdmin system using the standardised SUS methodology
          (Brooke, 1996). Please rate each statement from <strong>1 (Strongly Disagree)</strong> to <strong>5 (Strongly Agree)</strong>.
          Your responses are anonymous and will be used for academic evaluation purposes.
        </p>
        <div style={{ marginTop: '1rem' }}>
          <label className="form-label">I am a:</label>
          <select className="form-select" style={{ width: 'auto', display: 'inline-block', marginLeft: '0.75rem' }}
            value={respondentType} onChange={e => setRespondentType(e.target.value)} aria-label="Respondent type">
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="proxy_user">Observer / Proxy User</option>
          </select>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontWeight: 700 }}>Questions</span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{answered} / {SUS_QUESTIONS.length} answered</span>
          </div>

          {SUS_QUESTIONS.map((q, qi) => (
            <div key={q.id} className="sus-question">
              <div className="sus-question-text">
                <span style={{ color: 'var(--accent)', fontWeight: 700, marginRight: '0.5rem' }}>Q{qi + 1}.</span>
                {q.text}
              </div>
              <div className="sus-scale">
                <span className="sus-scale-label">Strongly<br />Disagree</span>
                <div className="sus-options">
                  {[1, 2, 3, 4, 5].map(val => (
                    <div key={val} className="sus-option">
                      <input
                        type="radio" name={q.id} value={val}
                        checked={responses[q.id] === val}
                        onChange={() => setResponses(p => ({ ...p, [q.id]: val }))}
                        aria-label={`${q.text} — ${val}`}
                        required
                      />
                      <span>{val}</span>
                    </div>
                  ))}
                </div>
                <span className="sus-scale-label">Strongly<br />Agree</span>
              </div>
            </div>
          ))}

          <div style={{ marginTop: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Additional Comments (optional)</label>
              <textarea className="form-textarea" rows={4} value={openFeedback} onChange={e => setOpenFeedback(e.target.value)}
                placeholder="Any other feedback about the system's usability, design, or features…" aria-label="Additional feedback" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button type="submit" className="btn btn-primary" disabled={submitting || !allAnswered}
            style={{ padding: '0.8rem 2rem', fontSize: 'var(--text-base)' }} aria-label="Submit evaluation">
            {submitting ? 'Submitting…' : `⭐ Submit Evaluation (${answered}/${SUS_QUESTIONS.length})`}
          </button>
        </div>
      </form>
    </div>
  )
}
