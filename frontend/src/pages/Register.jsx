import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerAPI } from '../api/endpoints'
import { useAuth } from '../store/useAuth.jsx'

const SPECIALIZATIONS = [
  'Academic Stress', 'Anxiety', 'Burnout', 'Depression',
  'Relationship Issues', 'Career Counseling', 'Grief & Loss',
  'Time Management', 'Social Skills', 'Self Esteem'
]

const DEPARTMENTS = [
  'Computer Science', 'Engineering', 'Medicine', 'Law',
  'Business', 'Arts', 'Science', 'Commerce', 'Design', 'Other'
]

export default function Register() {
  const [step, setStep] = useState(1) // 1=role select, 2=form
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

  const toggleSpec = (spec) => {
    setForm(f => ({
      ...f,
      specializations: f.specializations.includes(spec)
        ? f.specializations.filter(s => s !== spec)
        : [...f.specializations, spec]
    }))
  }

  const validate = () => {
    const e = {}
    if (!form.full_name.trim()) e.full_name = 'Name is required'
    if (!form.email.includes('@')) e.email = 'Enter a valid email'
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (!/[A-Z]/.test(form.password)) e.password = 'Password must contain an uppercase letter'
    if (!/[0-9]/.test(form.password)) e.password = 'Password must contain a number'
    if (form.password !== form.confirm_password) e.confirm_password = 'Passwords do not match'
    if (!form.department) e.department = 'Department is required'
    if (role === 'student' && !form.year_of_study) e.year_of_study = 'Year of study is required'
    if (role === 'mentor' && form.specializations.length === 0) e.specializations = 'Select at least one specialization'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role,
        department: form.department,
        phone: form.phone,
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

      if (userRole === 'mentor') {
        // Mentor needs admin approval
        navigate('/pending-approval')
        return
      }

      login(access_token, {
        role: userRole, email: form.email, full_name: form.full_name
      })
      navigate('/dashboard')
    } catch (err) {
      setErrors({ submit: err.response?.data?.detail || 'Registration failed' })
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (key) => ({
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: `1px solid ${errors[key] ? 'var(--red)' : 'var(--border)'}`,
    fontSize: 14, fontFamily: 'var(--font-sans)', outline: 'none',
    background: 'var(--cream)',
  })

  // Step 1 — Role selection
  if (step === 1) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: 'var(--cream)',
      }}>
        <div style={{ width: '100%', maxWidth: 480, padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, color: 'var(--sage-dark)' }}>
              Eunoia
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 6 }}>
              Who are you joining as?
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { role: 'student', emoji: '🎓', title: 'Student', desc: 'Track your well-being, chat with Eunoia, get support' },
              { role: 'mentor', emoji: '🤝', title: 'Mentor', desc: 'Support students, get assigned cases, track progress' },
            ].map(({ role: r, emoji, title, desc }) => (
              <button key={r} onClick={() => { setRole(r); setStep(2) }} style={{
                background: 'white', border: '1px solid var(--border)',
                borderRadius: 14, padding: '28px 20px', cursor: 'pointer',
                textAlign: 'center', transition: 'all .15s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--sage-dark)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>{emoji}</div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{desc}</div>
              </button>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--sage-dark)', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    )
  }

  // Step 2 — Registration form
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--cream)', padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, color: 'var(--sage-dark)' }}>
            Eunoia
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span style={{
              background: 'var(--sage-light)', color: 'var(--sage-dark)',
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              textTransform: 'capitalize',
            }}>{role} registration</span>
            <button onClick={() => setStep(1)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: 'var(--muted)',
            }}>← change</button>
          </div>
        </div>

        <div style={{
          background: 'white', borderRadius: 16,
          border: '1px solid var(--border)', padding: '28px',
        }}>
          {errors.submit && (
            <div style={{
              background: 'var(--red-light)', color: 'var(--red)',
              padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
            }}>{errors.submit}</div>
          )}

          {role === 'mentor' && (
            <div style={{
              background: '#EFF6FF', border: '1px solid #BFDBFE',
              borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#1D4ED8',
            }}>
              ℹ️ Mentor accounts require admin approval before you can log in.
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Basic info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Full name *</label>
                <input value={form.full_name} onChange={e => set('full_name', e.target.value)}
                  placeholder="Aarav Sharma" style={inputStyle('full_name')} />
                {errors.full_name && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{errors.full_name}</div>}
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Phone</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="+91 9876543210" style={inputStyle('phone')} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Email *</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="you@university.edu" style={inputStyle('email')} />
              {errors.email && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{errors.email}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Password *</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                  placeholder="Min 8 chars, 1 uppercase, 1 number" style={inputStyle('password')} />
                {errors.password && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{errors.password}</div>}
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Confirm password *</label>
                <input type="password" value={form.confirm_password} onChange={e => set('confirm_password', e.target.value)}
                  placeholder="Repeat password" style={inputStyle('confirm_password')} />
                {errors.confirm_password && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{errors.confirm_password}</div>}
              </div>
            </div>

            {/* Password strength indicator */}
            {form.password && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {[
                  form.password.length >= 8,
                  /[A-Z]/.test(form.password),
                  /[0-9]/.test(form.password),
                  /[^A-Za-z0-9]/.test(form.password),
                ].map((met, i) => (
                  <div key={i} style={{
                    height: 4, flex: 1, borderRadius: 2,
                    background: met ? 'var(--green)' : 'var(--border)',
                  }} />
                ))}
                <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {[form.password.length >= 8, /[A-Z]/.test(form.password), /[0-9]/.test(form.password), /[^A-Za-z0-9]/.test(form.password)].filter(Boolean).length}/4
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: role === 'student' ? '1fr 1fr' : '1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Department *</label>
                <select value={form.department} onChange={e => set('department', e.target.value)} style={inputStyle('department')}>
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{errors.department}</div>}
              </div>
              {role === 'student' && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Year of study *</label>
                  <select value={form.year_of_study} onChange={e => set('year_of_study', e.target.value)} style={inputStyle('year_of_study')}>
                    <option value="">Select year</option>
                    {['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Postgraduate'].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  {errors.year_of_study && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>{errors.year_of_study}</div>}
                </div>
              )}
            </div>

            {/* Mentor-specific fields */}
            {role === 'mentor' && (
              <>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Bio</label>
                  <textarea value={form.bio} onChange={e => set('bio', e.target.value)}
                    placeholder="Brief description of your background and approach..."
                    rows={3} style={{ ...inputStyle('bio'), resize: 'vertical' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Years of experience</label>
                    <input type="number" min="0" value={form.experience_years}
                      onChange={e => set('experience_years', e.target.value)}
                      placeholder="0" style={inputStyle('experience_years')} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 5 }}>Languages (comma separated)</label>
                    <input value={form.languages} onChange={e => set('languages', e.target.value)}
                      placeholder="English, Hindi, Marathi" style={inputStyle('languages')} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 8 }}>
                    Specializations * (select all that apply)
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {SPECIALIZATIONS.map(spec => (
                      <button key={spec} type="button" onClick={() => toggleSpec(spec)} style={{
                        padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                        border: '1px solid',
                        background: form.specializations.includes(spec) ? 'var(--sage-dark)' : 'white',
                        color: form.specializations.includes(spec) ? 'white' : 'var(--muted)',
                        borderColor: form.specializations.includes(spec) ? 'var(--sage-dark)' : 'var(--border)',
                      }}>
                        {spec}
                      </button>
                    ))}
                  </div>
                  {errors.specializations && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 4 }}>{errors.specializations}</div>}
                </div>
              </>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '12px', borderRadius: 8,
              background: loading ? 'var(--border)' : 'var(--sage-dark)',
              color: 'white', border: 'none', fontSize: 14,
              fontWeight: 600, cursor: loading ? 'default' : 'pointer', marginTop: 4,
            }}>
              {loading ? 'Creating account…' : `Create ${role} account`}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--sage-dark)', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}