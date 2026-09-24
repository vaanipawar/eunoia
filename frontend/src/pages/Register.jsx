import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GraduationCap, HandHeart, ChevronRight, Info } from 'lucide-react'
import { registerAPI } from '../api/endpoints'
import { useAuth } from '../store/useAuth.jsx'
import AuthShell from '../components/AuthShell'

const SPECIALIZATIONS = [
  'Academic Stress', 'Anxiety', 'Burnout', 'Depression',
  'Relationship Issues', 'Career Counseling', 'Grief & Loss',
  'Time Management', 'Social Skills', 'Self Esteem',
]
const DEPARTMENTS = [
  'Computer Science', 'Engineering', 'Medicine', 'Law',
  'Business', 'Arts', 'Science', 'Commerce', 'Design', 'Other',
]
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Postgraduate']

const ROLES = [
  { role: 'student', icon: GraduationCap, title: 'Student', desc: 'Weekly check-ins, chat with Eunoia, and support when you need it.' },
  { role: 'mentor', icon: HandHeart, title: 'Mentor', desc: 'Support students who are assigned to you and follow their progress.' },
]

function Field({ id, label, error, children }) {
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      {children}
      {error && <div id={`${id}-err`} className="field-error" role="alert">{error}</div>}
    </div>
  )
}

export default function Register() {
  const [role, setRole] = useState('')
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm_password: '',
    department: '', year_of_study: '', phone: '',
    bio: '', experience_years: '', languages: '', specializations: [],
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const f = (k) => ({
    id: k, className: 'field', value: form[k],
    onChange: e => set(k, e.target.value),
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `${k}-err` : undefined,
  })

  const toggleSpec = (spec) => setForm(x => ({
    ...x,
    specializations: x.specializations.includes(spec)
      ? x.specializations.filter(s => s !== spec)
      : [...x.specializations, spec],
  }))

  const pw = form.password
  const reqs = [
    { ok: pw.length >= 8, text: '8+ characters' },
    { ok: /[A-Z]/.test(pw), text: 'Uppercase letter' },
    { ok: /[0-9]/.test(pw), text: 'Number' },
  ]

  const validate = () => {
    const e = {}
    if (!form.full_name.trim()) e.full_name = 'Enter your name.'
    if (!form.email.includes('@')) e.email = 'Enter a valid email address.'
    if (pw.length < 8) e.password = 'Use at least 8 characters.'
    else if (!/[A-Z]/.test(pw)) e.password = 'Add an uppercase letter.'
    else if (!/[0-9]/.test(pw)) e.password = 'Add a number.'
    if (pw !== form.confirm_password) e.confirm_password = 'Passwords do not match.'
    if (!form.department) e.department = 'Choose your department.'
    if (role === 'student' && !form.year_of_study) e.year_of_study = 'Choose your year of study.'
    if (role === 'mentor' && form.specializations.length === 0) e.specializations = 'Select at least one specialization.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        full_name: form.full_name, email: form.email, password: form.password,
        role, department: form.department, phone: form.phone,
        ...(role === 'student' && { year_of_study: form.year_of_study }),
        ...(role === 'mentor' && {
          bio: form.bio,
          experience_years: parseInt(form.experience_years) || 0,
          languages: form.languages.split(',').map(l => l.trim()).filter(Boolean),
          specializations: form.specializations,
        }),
      }
      const res = await registerAPI(payload)
      const { access_token, role: userRole } = res.data
      if (userRole === 'mentor') { navigate('/pending-approval'); return }
      login(access_token, { role: userRole, email: form.email, full_name: form.full_name })
      navigate('/dashboard')
    } catch (err) {
      setErrors({ submit: err.response?.data?.detail || 'Registration failed. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (!role) {
    return (
      <AuthShell>
        <h1>Create your account</h1>
        <p className="muted">Who are you joining as?</p>
        <div className="choices">
          {ROLES.map(({ role: r, icon: Icon, title, desc }) => (
            <button key={r} type="button" className="choice" onClick={() => setRole(r)}>
              <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
              <span><strong>{title}</strong><small>{desc}</small></span>
              <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
          ))}
        </div>
        <div className="auth-links"><span>Already have an account? <Link to="/login">Sign in</Link></span></div>
      </AuthShell>
    )
  }

  return (
    <AuthShell wide>
      <h1>{role === 'mentor' ? 'Mentor sign-up' : 'Student sign-up'}</h1>
      <p className="muted">
        <button type="button" className="link-btn" onClick={() => setRole('')}>Change role</button>
      </p>

      {role === 'mentor' && (
        <div className="banner">
          <Info size={17} strokeWidth={1.75} style={{ flex: 'none', marginTop: 2 }} aria-hidden="true" />
          <span>Mentor accounts need admin approval before you can sign in.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="stack" noValidate>
        {errors.submit && <div className="notice notice-error" role="alert">{errors.submit}</div>}

        <div className="row2">
          <Field id="full_name" label="Full name" error={errors.full_name}>
            <input {...f('full_name')} placeholder="Aarav Sharma" autoComplete="name" />
          </Field>
          <Field id="phone" label="Phone (optional)">
            <input {...f('phone')} placeholder="+91 98765 43210" autoComplete="tel" />
          </Field>
        </div>

        <Field id="email" label="Email" error={errors.email}>
          <input {...f('email')} type="email" placeholder="you@university.edu" autoComplete="email" />
        </Field>

        <div className="row2">
          <Field id="password" label="Password" error={errors.password}>
            <input {...f('password')} type="password" autoComplete="new-password" />
          </Field>
          <Field id="confirm_password" label="Confirm password" error={errors.confirm_password}>
            <input {...f('confirm_password')} type="password" autoComplete="new-password" />
          </Field>
        </div>
        <div className="reqs" aria-live="polite">
          {reqs.map(r => <span key={r.text} className={r.ok ? 'met' : ''}>{r.ok ? '✓ ' : ''}{r.text}</span>)}
        </div>

        <div className={role === 'student' ? 'row2' : ''}>
          <Field id="department" label="Department" error={errors.department}>
            <select {...f('department')}>
              <option value="">Select department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          {role === 'student' && (
            <Field id="year_of_study" label="Year of study" error={errors.year_of_study}>
              <select {...f('year_of_study')}>
                <option value="">Select year</option>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
          )}
        </div>

        {role === 'mentor' && (
          <>
            <Field id="bio" label="Bio (optional)">
              <textarea {...f('bio')} rows={3} placeholder="Your background and how you work with students." style={{ resize: 'vertical' }} />
            </Field>
            <div className="row2">
              <Field id="experience_years" label="Years of experience">
                <input {...f('experience_years')} type="number" min="0" placeholder="0" />
              </Field>
              <Field id="languages" label="Languages, comma separated">
                <input {...f('languages')} placeholder="English, Hindi" />
              </Field>
            </div>
            <fieldset className="chips-set">
              <legend className="label">Specializations (choose all that apply)</legend>
              <div className="chips">
                {SPECIALIZATIONS.map(s => (
                  <button key={s} type="button" className="chip" aria-pressed={form.specializations.includes(s)} onClick={() => toggleSpec(s)}>
                    {s}
                  </button>
                ))}
              </div>
              {errors.specializations && <div className="field-error" role="alert">{errors.specializations}</div>}
            </fieldset>
          </>
        )}

        <button type="submit" disabled={loading} className="btn btn-block">
          {loading ? 'Creating account…' : `Create ${role} account`}
        </button>
      </form>

      <div className="auth-links"><span>Already have an account? <Link to="/login">Sign in</Link></span></div>
    </AuthShell>
  )
}